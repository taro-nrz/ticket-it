import { InMemoryRepository } from "./inMemoryRepository.js";

export class EventoRepository extends InMemoryRepository {
  // HU-02: búsqueda textual, categoría, rango de precio y de fechas.
  // Por defecto sólo eventos que todavía no se realizaron.
  async buscar(filtros, ahora) {
    const {
      texto,
      categoriaId,
      precioMin,
      precioMax,
      fechaDesde,
      fechaHasta,
      incluirPasados = false,
    } = filtros;

    return this.findBy((evento) => {
      if (evento.cancelado) return false;
      if (!incluirPasados && evento.yaSeRealizo(ahora)) return false;
      if (texto && !evento.coincideConTexto(texto)) return false;
      if (categoriaId !== undefined && evento.categoria.id !== categoriaId) return false;
      if (
        (precioMin !== undefined || precioMax !== undefined) &&
        !evento.tuPrecioEstaEntre(precioMin ?? 0, precioMax ?? Infinity)
      ) {
        return false;
      }
      if (fechaDesde && evento.fecha < fechaDesde) return false;
      if (fechaHasta && evento.fecha > fechaHasta) return false;
      return true;
    });
  }

  async findByOrganizador(organizadorId) {
    return this.findBy((evento) => evento.organizador.id === organizadorId);
  }

  async findByNombreYOrganizador(nombre, organizadorId, fecha) {
    return this.findOneBy(
      (evento) =>
        evento.organizador.id === organizadorId &&
        evento.nombre.toLowerCase() === nombre.toLowerCase() &&
        evento.fecha.getTime() === fecha.getTime(),
    );
  }
}
