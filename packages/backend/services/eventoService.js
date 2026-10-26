import { eventoDetalleDTO, eventoResumenDTO, tipoEntradaDTO } from "../dtos/eventoDTO.js";
import { reseniaDTO } from "../dtos/reseniaDTO.js";
import { ConflictError, NotFoundError, ValidationError } from "../error/appError.js";
import { EstadoCompra } from "../models/entities/estadoCompra.js";
import { Evento } from "../models/entities/evento.js";
import { TipoEntrada } from "../models/entities/tipoEntrada.js";
import { ordenarProximosPrimero } from "../utils/orden.js";
import { paginar } from "../utils/paginacion.js";

const CANTIDAD_ULTIMAS_RESENIAS = 5;

export const OrdenEvento = Object.freeze({
  FECHA: "fecha",
  PRECIO: "precio",
  PUNTAJE: "puntaje",
});

export class EventoService {
  constructor(eventoRepository, categoriaRepository, compraRepository, reseniaRepository, reloj) {
    this.eventoRepository = eventoRepository;
    this.categoriaRepository = categoriaRepository;
    this.compraRepository = compraRepository;
    this.reseniaRepository = reseniaRepository;
    this.reloj = reloj;
  }

  // HU-01: el organizador publica un evento con sus tipos de entrada
  async crear(datos, organizador) {
    const ahora = this.reloj.ahora();
    const categoria = await this.categoriaRepository.findById(datos.categoriaId);
    if (!categoria) {
      throw new NotFoundError(`No existe la categoría con id ${datos.categoriaId}`);
    }
    if (datos.fecha <= ahora) {
      throw new ValidationError("Datos de validación inválidos", [
        { campo: "fecha", mensaje: "La fecha del evento debe ser futura" },
      ]);
    }
    const nombresTipos = datos.tiposEntrada.map((tipo) => tipo.nombre.trim().toLowerCase());
    if (new Set(nombresTipos).size !== nombresTipos.length) {
      throw new ValidationError("Datos de validación inválidos", [
        {
          campo: "tiposEntrada",
          mensaje: "Los tipos de entrada no pueden tener nombres repetidos",
        },
      ]);
    }
    const duplicado = await this.eventoRepository.findByNombreYOrganizador(
      datos.nombre,
      organizador.id,
      datos.fecha,
    );
    if (duplicado) {
      throw new ConflictError("Ya publicaste un evento con ese nombre en esa misma fecha");
    }

    const tiposEntrada = datos.tiposEntrada.map(
      (tipo) => new TipoEntrada(tipo.nombre, tipo.descripcion, tipo.precio, tipo.cupo),
    );
    const evento = new Evento({ ...datos, categoria, tiposEntrada, organizador });
    const guardado = await this.eventoRepository.save(evento);
    return this.aDetalle(guardado, organizador);
  }

  // HU-02 + HU-03: búsqueda, filtros, orden y paginación
  async listar(filtros, usuario) {
    const ahora = this.reloj.ahora();
    const eventos = await this.eventoRepository.buscar(filtros, ahora);
    const conReputacion = await Promise.all(
      eventos.map(async (evento) => ({
        evento,
        reputacion: await this.reseniaRepository.reputacionDeOrganizador(evento.organizador.id),
      })),
    );

    const ordenados = ordenar(conReputacion, filtros.orden, filtros.dir);
    const pagina = paginar(ordenados, filtros.page, filtros.limit);
    pagina.data = pagina.data.map(({ evento, reputacion }) =>
      eventoResumenDTO(evento, { reputacion, ahora, usuario }),
    );
    return pagina;
  }

  async detalle(id, usuario) {
    const evento = await this.obtenerEntidad(id);
    return this.aDetalle(evento, usuario);
  }

  // R-04: eventos del organizador con el resumen de sus ventas
  async misEventos(organizador, page, limit) {
    const ahora = this.reloj.ahora();
    const eventos = await this.eventoRepository.findByOrganizador(organizador.id);
    const ordenados = ordenarProximosPrimero(eventos, (evento) => evento.fecha, ahora);
    const pagina = paginar(ordenados, page, limit);
    pagina.data = await Promise.all(
      pagina.data.map(async (evento) => ({
        ...(await this.aResumen(evento, organizador)),
        tiposEntrada: evento.tiposEntrada.map(tipoEntradaDTO),
        ventas: await this.resumenDeVentas(evento, organizador),
        resenias: await this.reseniaRepository.reputacionDeEvento(evento.id),
      })),
    );
    return pagina;
  }

  async obtenerEntidad(id) {
    const evento = await this.eventoRepository.findById(id);
    if (!evento) {
      throw new NotFoundError(`No existe el evento con id ${id}`);
    }
    return evento;
  }

  async aResumen(evento, usuario) {
    const reputacion = await this.reseniaRepository.reputacionDeOrganizador(evento.organizador.id);
    return eventoResumenDTO(evento, { reputacion, ahora: this.reloj.ahora(), usuario });
  }

  async aDetalle(evento, usuario) {
    const organizadorId = evento.organizador.id;
    const reputacion = await this.reseniaRepository.reputacionDeOrganizador(organizadorId);
    const resenias = await this.reseniaRepository.findByOrganizador(organizadorId);
    return eventoDetalleDTO(evento, {
      reputacion,
      ahora: this.reloj.ahora(),
      usuario,
      ultimasResenias: resenias.slice(0, CANTIDAD_ULTIMAS_RESENIAS).map(reseniaDTO),
    });
  }

  async resumenDeVentas(evento, organizador) {
    const compras = await this.compraRepository.findByEvento(evento.id);
    const pagadas = compras.filter((compra) =>
      [EstadoCompra.CONFIRMADA, EstadoCompra.UTILIZADA].includes(compra.estado),
    );
    return {
      cupoTotal: evento.tiposEntrada.reduce((total, tipo) => total + tipo.cupo, 0),
      entradasVendidas: evento.tiposEntrada.reduce((total, tipo) => total + tipo.vendidas, 0),
      cantidadCompras: compras.length,
      comprasPendientes: compras.filter((compra) => compra.estado === EstadoCompra.PENDIENTE)
        .length,
      recaudacion: pagadas.reduce((total, compra) => total + compra.total, 0),
      // D-26: mensajes de los compradores que el organizador todavía no leyó
      mensajesSinLeer: compras.reduce(
        (total, compra) => total + compra.mensajesSinLeerPara(organizador),
        0,
      ),
    };
  }
}

// HU-03: precio = precio mínimo del evento; puntaje = promedio del organizador (sin reseñas, al final)
function ordenar(items, orden = OrdenEvento.FECHA, dir = "asc") {
  const signo = dir === "desc" ? -1 : 1;
  const porFecha = (a, b) => a.evento.fecha - b.evento.fecha;
  const criterios = {
    [OrdenEvento.FECHA]: porFecha,
    [OrdenEvento.PRECIO]: (a, b) => a.evento.precioMinimo() - b.evento.precioMinimo(),
    [OrdenEvento.PUNTAJE]: (a, b) => a.reputacion.puntajePromedio - b.reputacion.puntajePromedio,
  };

  return [...items].sort((a, b) => {
    if (orden === OrdenEvento.PUNTAJE) {
      const sinPuntajeA = a.reputacion.puntajePromedio === null;
      const sinPuntajeB = b.reputacion.puntajePromedio === null;
      if (sinPuntajeA !== sinPuntajeB) return sinPuntajeA ? 1 : -1;
      if (sinPuntajeA && sinPuntajeB) return porFecha(a, b);
    }
    return signo * criterios[orden](a, b) || porFecha(a, b) || a.evento.id - b.evento.id;
  });
}
