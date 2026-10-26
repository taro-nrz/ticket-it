import { categoriaDTO } from "./usuarioDTO.js";

export function tipoEntradaDTO(tipo) {
  return {
    id: tipo.id,
    nombre: tipo.nombre,
    descripcion: tipo.descripcion,
    precio: tipo.precio,
    cupo: tipo.cupo,
    vendidas: tipo.vendidas,
    disponibles: tipo.disponibles(),
    agotado: tipo.disponibles() === 0,
  };
}

// reputacion: { puntajePromedio, cantidadResenias }
export function organizadorDTO(organizador, reputacion) {
  return {
    id: organizador.id,
    nombre: organizador.nombre,
    apellido: organizador.apellido,
    puntajePromedio: reputacion.puntajePromedio,
    cantidadResenias: reputacion.cantidadResenias,
  };
}

// Versión mínima de un evento para embeber en compras, reseñas y favoritos
export function eventoReferenciaDTO(evento) {
  return {
    id: evento.id,
    nombre: evento.nombre,
    fecha: evento.fecha,
    lugar: evento.lugar,
    imagen: evento.multimedia[0] ?? null,
  };
}

// Ítem de los listados del catálogo (HU-02 / HU-03)
export function eventoResumenDTO(evento, { reputacion, ahora, usuario }) {
  return {
    id: evento.id,
    nombre: evento.nombre,
    categoria: categoriaDTO(evento.categoria),
    fecha: evento.fecha,
    lugar: evento.lugar,
    imagen: evento.multimedia[0] ?? null,
    precioDesde: evento.precioMinimo(),
    precioHasta: evento.precioMaximo(),
    agotado: evento.estaAgotado(),
    yaSeRealizo: evento.yaSeRealizo(ahora),
    esFavorito: esFavoritoDe(usuario, evento),
    organizador: organizadorDTO(evento.organizador, reputacion),
  };
}

export function eventoDetalleDTO(evento, { reputacion, ahora, usuario, ultimasResenias = [] }) {
  return {
    id: evento.id,
    nombre: evento.nombre,
    descripcion: evento.descripcion,
    categoria: categoriaDTO(evento.categoria),
    fecha: evento.fecha,
    lugar: evento.lugar,
    direccion: evento.direccion,
    multimedia: evento.multimedia,
    precioDesde: evento.precioMinimo(),
    precioHasta: evento.precioMaximo(),
    agotado: evento.estaAgotado(),
    yaSeRealizo: evento.yaSeRealizo(ahora),
    esFavorito: esFavoritoDe(usuario, evento),
    tiposEntrada: evento.tiposEntrada.map(tipoEntradaDTO),
    organizador: organizadorDTO(evento.organizador, reputacion),
    ultimasResenias,
  };
}

function esFavoritoDe(usuario, evento) {
  return usuario?.esComprador() ? usuario.tieneFavorito(evento) : false;
}
