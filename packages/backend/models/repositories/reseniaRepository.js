import { InMemoryRepository } from "./inMemoryRepository.js";

const masRecientePrimero = (a, b) => b.fecha - a.fecha;

export class ReseniaRepository extends InMemoryRepository {
  async findByEvento(eventoId) {
    const resenias = await this.findBy((resenia) => resenia.evento.id === eventoId);
    return resenias.sort(masRecientePrimero);
  }

  // HU-12: reseñas de todos los eventos de un organizador
  async findByOrganizador(organizadorId) {
    const resenias = await this.findBy(
      (resenia) => resenia.evento.organizador.id === organizadorId,
    );
    return resenias.sort(masRecientePrimero);
  }

  async findByCompradorYEvento(compradorId, eventoId) {
    return this.findOneBy(
      (resenia) => resenia.comprador.id === compradorId && resenia.evento.id === eventoId,
    );
  }

  // Reputación del organizador: promedio de las puntuaciones de sus eventos
  async reputacionDeOrganizador(organizadorId) {
    return promedio(await this.findByOrganizador(organizadorId));
  }

  async reputacionDeEvento(eventoId) {
    return promedio(await this.findByEvento(eventoId));
  }
}

// Promedio redondeado a 2 decimales; sin reseñas no hay puntaje (null)
function promedio(resenias) {
  if (resenias.length === 0) {
    return { puntajePromedio: null, cantidadResenias: 0 };
  }
  const suma = resenias.reduce((acumulado, resenia) => acumulado + resenia.puntuacion, 0);
  return {
    puntajePromedio: Math.round((suma / resenias.length) * 100) / 100,
    cantidadResenias: resenias.length,
  };
}
