import { BusinessRuleError } from "../../error/appError.js";
import { inicioDelDia } from "../../utils/reloj.js";
import { normalizarTexto } from "../../utils/texto.js";

export class Evento {
  id;
  // D-31: un evento cancelado sale del catálogo y no admite compras
  cancelado = false;
  motivoCancelacion = null;
  fechaCancelacion = null;

  constructor({
    nombre,
    descripcion,
    categoria,
    fecha,
    lugar,
    direccion,
    tiposEntrada,
    multimedia = [],
    organizador,
  }) {
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.categoria = categoria;
    this.fecha = new Date(fecha);
    this.lugar = lugar;
    this.direccion = direccion;
    this.multimedia = multimedia;
    this.organizador = organizador;
    // Los tipos de entrada se identifican dentro del evento (1..n)
    this.tiposEntrada = tiposEntrada;
    this.tiposEntrada.forEach((tipo, indice) => (tipo.id = indice + 1));
  }

  // Método del diagrama: el evento ofrece alguna entrada con precio dentro del rango
  tuPrecioEstaEntre(minimo, maximo) {
    return this.tiposEntrada.some((tipo) => tipo.precio >= minimo && tipo.precio <= maximo);
  }

  precioMinimo() {
    return Math.min(...this.tiposEntrada.map((tipo) => tipo.precio));
  }

  precioMaximo() {
    return Math.max(...this.tiposEntrada.map((tipo) => tipo.precio));
  }

  yaSeRealizo(ahora) {
    return this.fecha <= ahora;
  }

  // A partir de las 00:00 del día del evento (para el control de acceso)
  esElDiaOPosterior(ahora) {
    return inicioDelDia(this.fecha) <= ahora;
  }

  // D-31: sólo se edita un evento vigente (ni realizado ni cancelado)
  puedeEditarse(ahora) {
    return !this.cancelado && !this.yaSeRealizo(ahora);
  }

  // D-31: los tipos de entrada existentes se identifican por id; los nuevos no tienen id.
  // No se puede bajar el cupo por debajo de lo vendido ni quitar un tipo con entradas vendidas.
  actualizar({ tiposEntrada, ...datos }, crearTipoEntrada) {
    const quitados = this.tiposEntrada.filter(
      (tipo) => !tiposEntrada.some((nuevo) => nuevo.id === tipo.id),
    );
    const conVentas = quitados.find((tipo) => tipo.vendidas > 0);
    if (conVentas) {
      throw new BusinessRuleError(
        `No se puede quitar "${conVentas.nombre}": tiene ${conVentas.vendidas} entradas vendidas`,
      );
    }
    for (const datosTipo of tiposEntrada.filter((tipo) => tipo.id !== undefined)) {
      const tipo = this.buscarTipoEntrada(datosTipo.id);
      if (!tipo) {
        throw new BusinessRuleError(`El evento no tiene un tipo de entrada con id ${datosTipo.id}`);
      }
      if (datosTipo.cupo < tipo.vendidas) {
        throw new BusinessRuleError(
          `El cupo de "${tipo.nombre}" no puede ser menor a las ${tipo.vendidas} entradas ya vendidas`,
        );
      }
    }

    let siguienteId = Math.max(0, ...this.tiposEntrada.map((tipo) => tipo.id)) + 1;
    this.tiposEntrada = tiposEntrada.map((datosTipo) => {
      if (datosTipo.id === undefined) {
        const nuevo = crearTipoEntrada(datosTipo);
        nuevo.id = siguienteId++;
        return nuevo;
      }
      // Se modifica el mismo objeto: las compras existentes lo siguen referenciando
      const tipo = this.buscarTipoEntrada(datosTipo.id);
      Object.assign(tipo, {
        nombre: datosTipo.nombre,
        descripcion: datosTipo.descripcion,
        precio: datosTipo.precio,
        cupo: datosTipo.cupo,
      });
      return tipo;
    });
    Object.assign(this, { ...datos, fecha: new Date(datos.fecha) });
  }

  cancelar(motivo, ahora) {
    if (this.cancelado) {
      throw new BusinessRuleError("El evento ya está cancelado");
    }
    if (this.yaSeRealizo(ahora)) {
      throw new BusinessRuleError("No se puede cancelar un evento que ya se realizó");
    }
    this.cancelado = true;
    this.motivoCancelacion = motivo;
    this.fechaCancelacion = new Date(ahora);
  }

  buscarTipoEntrada(tipoEntradaId) {
    return this.tiposEntrada.find((tipo) => tipo.id === tipoEntradaId);
  }

  estaAgotado() {
    return this.tiposEntrada.every((tipo) => tipo.disponibles() === 0);
  }

  esOrganizadoPor(usuario) {
    return this.organizador.id === usuario.id;
  }

  coincideConTexto(texto) {
    const buscado = normalizarTexto(texto);
    return [this.nombre, this.descripcion, this.lugar, this.categoria.nombre]
      .map(normalizarTexto)
      .some((campo) => campo.includes(buscado));
  }
}
