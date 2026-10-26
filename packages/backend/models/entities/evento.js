import { inicioDelDia } from "../../utils/reloj.js";
import { normalizarTexto } from "../../utils/texto.js";

export class Evento {
  id;

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
