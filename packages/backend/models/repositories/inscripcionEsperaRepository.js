import { InMemoryRepository } from "./inMemoryRepository.js";

const porOrdenDeLlegada = (a, b) => a.fecha - b.fecha || a.id - b.id;

export class InscripcionEsperaRepository extends InMemoryRepository {
  // Cola de un tipo de entrada, en orden de llegada (sólo las activas)
  async colaDe(eventoId, tipoEntradaId) {
    const activas = await this.findBy(
      (i) => i.evento.id === eventoId && i.tipoEntrada.id === tipoEntradaId && i.estaActiva(),
    );
    return activas.sort(porOrdenDeLlegada);
  }

  async activasDeEvento(eventoId) {
    return (await this.findBy((i) => i.evento.id === eventoId && i.estaActiva())).sort(
      porOrdenDeLlegada,
    );
  }

  async activaDe(usuarioId, eventoId, tipoEntradaId) {
    return this.findOneBy(
      (i) =>
        i.usuario.id === usuarioId &&
        i.evento.id === eventoId &&
        i.tipoEntrada.id === tipoEntradaId &&
        i.estaActiva(),
    );
  }

  async avisadas() {
    return this.findBy((i) => i.estado === "AVISADA");
  }
}
