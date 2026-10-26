import { eventoDetalleDTO, eventoResumenDTO, tipoEntradaDTO } from "../dtos/eventoDTO.js";
import { reseniaDTO } from "../dtos/reseniaDTO.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  BusinessRuleError,
  ValidationError,
} from "../error/appError.js";
import { EstadoCompra } from "../models/entities/estadoCompra.js";
import { Evento } from "../models/entities/evento.js";
import { TipoEntrada } from "../models/entities/tipoEntrada.js";
import { ordenarProximosPrimero } from "../utils/orden.js";
import { sumarDias } from "../utils/reloj.js";
import { paginar } from "../utils/paginacion.js";
import { SIN_NOTIFICACIONES } from "./notificacionService.js";

const CANTIDAD_ULTIMAS_RESENIAS = 5;

export const OrdenEvento = Object.freeze({
  FECHA: "fecha",
  PRECIO: "precio",
  PUNTAJE: "puntaje",
});

export class EventoService {
  constructor(
    eventoRepository,
    categoriaRepository,
    compraRepository,
    reseniaRepository,
    reloj,
    notificaciones = SIN_NOTIFICACIONES,
  ) {
    this.eventoRepository = eventoRepository;
    this.categoriaRepository = categoriaRepository;
    this.compraRepository = compraRepository;
    this.reseniaRepository = reseniaRepository;
    this.reloj = reloj;
    this.notificaciones = notificaciones;
  }

  // HU-01: el organizador publica un evento con sus tipos de entrada
  async crear(datos, organizador) {
    const categoria = await this.validarDatos(datos, organizador);
    const tiposEntrada = datos.tiposEntrada.map(crearTipoEntrada);
    const evento = new Evento({ ...datos, categoria, tiposEntrada, organizador });
    const guardado = await this.eventoRepository.save(evento);
    return this.aDetalle(guardado, organizador);
  }

  // D-31: el organizador edita un evento propio que todavía no se realizó
  async actualizar(id, datos, organizador) {
    const evento = await this.obtenerPropio(id, organizador);
    if (!evento.puedeEditarse(this.reloj.ahora())) {
      throw new BusinessRuleError(
        evento.cancelado
          ? "No se puede editar un evento cancelado"
          : "No se puede editar un evento que ya se realizó",
      );
    }
    const categoria = await this.validarDatos(datos, organizador, evento);
    const { categoriaId: _categoriaId, ...cambios } = datos;
    evento.actualizar({ ...cambios, categoria }, crearTipoEntrada);
    await this.eventoRepository.save(evento);
    return this.aDetalle(evento, organizador);
  }

  // D-31: cancelar un evento cancela todas sus compras activas (y reembolsa las pagadas)
  async cancelar(id, motivo, organizador) {
    const ahora = this.reloj.ahora();
    const evento = await this.obtenerPropio(id, organizador);
    evento.cancelar(motivo, ahora);

    const activas = (await this.compraRepository.findByEvento(evento.id)).filter((compra) =>
      [EstadoCompra.PENDIENTE, EstadoCompra.CONFIRMADA].includes(compra.estado),
    );
    for (const compra of activas) {
      compra.cancelar(organizador, ahora, { porCancelacionDelEvento: true });
      await this.compraRepository.save(compra);
    }
    await this.eventoRepository.save(evento);
    await this.notificaciones.eventoCancelado(evento, activas);
    return {
      evento: await this.aDetalle(evento, organizador),
      comprasCanceladas: activas.length,
      comprasReembolsadas: activas.filter((compra) => compra.estado === EstadoCompra.REEMBOLSADA)
        .length,
      compras: activas,
    };
  }

  // D-34: panel de estadísticas del evento para su organizador
  async estadisticas(id, organizador) {
    const ahora = this.reloj.ahora();
    const evento = await this.obtenerPropio(id, organizador);
    const compras = await this.compraRepository.findByEvento(evento.id);
    const pagadas = compras.filter((compra) =>
      [EstadoCompra.CONFIRMADA, EstadoCompra.UTILIZADA].includes(compra.estado),
    );
    const sumar = (lista, valor) => lista.reduce((total, item) => total + valor(item), 0);

    const cupoTotal = sumar(evento.tiposEntrada, (tipo) => tipo.cupo);
    const entradasPagadas = sumar(pagadas, (compra) => compra.cantidad);
    const recaudacion = sumar(pagadas, (compra) => compra.total);
    const utilizadas = compras.filter((compra) => compra.estado === EstadoCompra.UTILIZADA);
    const canceladas = compras.filter((compra) =>
      [EstadoCompra.CANCELADA, EstadoCompra.REEMBOLSADA].includes(compra.estado),
    );
    const reputacion = await this.reseniaRepository.reputacionDeEvento(evento.id);

    return {
      evento: { id: evento.id, nombre: evento.nombre, fecha: evento.fecha },
      totales: {
        cupoTotal,
        entradasVendidas: sumar(evento.tiposEntrada, (tipo) => tipo.vendidas),
        entradasPagadas,
        recaudacion,
        ticketPromedio: pagadas.length ? Math.round(recaudacion / pagadas.length) : 0,
        ocupacion: cupoTotal ? Math.round((entradasPagadas / cupoTotal) * 1000) / 10 : 0,
        compras: compras.length,
        tasaCancelacion: compras.length
          ? Math.round((canceladas.length / compras.length) * 1000) / 10
          : 0,
        entradasUtilizadas: sumar(utilizadas, (compra) => compra.cantidad),
        puntajePromedio: reputacion.puntajePromedio,
        cantidadResenias: reputacion.cantidadResenias,
      },
      porTipo: evento.tiposEntrada.map((tipo) => {
        const delTipo = pagadas.filter((compra) => compra.tipoEntrada.id === tipo.id);
        return {
          id: tipo.id,
          nombre: tipo.nombre,
          cupo: tipo.cupo,
          vendidas: tipo.vendidas,
          pagadas: sumar(delTipo, (compra) => compra.cantidad),
          recaudacion: sumar(delTipo, (compra) => compra.total),
        };
      }),
      porEstado: Object.fromEntries(
        Object.values(EstadoCompra).map((estado) => [
          estado,
          compras.filter((compra) => compra.estado === estado).length,
        ]),
      ),
      ventasPorDia: ventasPorDia(pagadas, ahora < evento.fecha ? ahora : evento.fecha),
    };
  }

  async obtenerPropio(id, organizador) {
    const evento = await this.obtenerEntidad(id);
    if (!evento.esOrganizadoPor(organizador)) {
      throw new ForbiddenError("Sólo el organizador del evento puede modificarlo");
    }
    return evento;
  }

  // Reglas comunes de publicar y editar; devuelve la categoría
  async validarDatos(datos, organizador, eventoActual = null) {
    const categoria = await this.categoriaRepository.findById(datos.categoriaId);
    if (!categoria) {
      throw new NotFoundError(`No existe la categoría con id ${datos.categoriaId}`);
    }
    if (datos.fecha <= this.reloj.ahora()) {
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
    if (duplicado && duplicado.id !== eventoActual?.id) {
      throw new ConflictError("Ya publicaste un evento con ese nombre en esa misma fecha");
    }
    return categoria;
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

const DIAS_DEL_GRAFICO = 14;

// Entradas pagadas por día (según la fecha en que se confirmó el pago), con los días sin ventas en 0.
// Se muestran los 14 días hasta hoy (o hasta el evento); si en ese período no hubo ventas, los 14 días
// que terminan en la última venta, para que un evento viejo no muestre un gráfico vacío.
function ventasPorDia(pagadas, limite) {
  const clave = (fecha) => aTextoFecha(fecha);
  const fechaDePago = (compra) =>
    compra.historial.find((cambio) => cambio.estado === EstadoCompra.CONFIRMADA)?.fechaHora;
  const pagos = pagadas.map(fechaDePago).filter((fecha) => fecha && fecha <= limite);
  const inicioVentana = sumarDias(limite, -(DIAS_DEL_GRAFICO - 1));
  const hayVentasRecientes = pagos.some((fecha) => clave(fecha) >= clave(inicioVentana));
  const hasta = pagos.length && !hayVentasRecientes ? new Date(Math.max(...pagos)) : limite;
  const dias = Array.from({ length: DIAS_DEL_GRAFICO }, (_, i) =>
    clave(sumarDias(hasta, i - DIAS_DEL_GRAFICO + 1)),
  );
  const porDia = Object.fromEntries(dias.map((dia) => [dia, { entradas: 0, recaudacion: 0 }]));
  for (const compra of pagadas) {
    const pago = fechaDePago(compra);
    const dia = pago && clave(pago);
    if (porDia[dia]) {
      porDia[dia].entradas += compra.cantidad;
      porDia[dia].recaudacion += compra.total;
    }
  }
  return dias.map((dia) => ({ fecha: dia, ...porDia[dia] }));
}

function aTextoFecha(fecha) {
  const f = new Date(fecha);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}

function crearTipoEntrada(tipo) {
  return new TipoEntrada(tipo.nombre, tipo.descripcion, tipo.precio, tipo.cupo);
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
