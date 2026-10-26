import { InMemoryRepository } from "./inMemoryRepository.js";

export class CompraRepository extends InMemoryRepository {
  async findByComprador(compradorId, estado) {
    return this.findBy(
      (compra) => compra.comprador.id === compradorId && (!estado || compra.estado === estado),
    );
  }

  async findByEvento(eventoId, estado) {
    return this.findBy(
      (compra) => compra.evento.id === eventoId && (!estado || compra.estado === estado),
    );
  }

  async findByEstado(estado) {
    return this.findBy((compra) => compra.estado === estado);
  }

  async findByCodigo(codigo) {
    return this.findOneBy((compra) => compra.codigo === codigo);
  }

  async findByCompradorYEstadoEnEvento(compradorId, eventoId, estado) {
    return this.findBy(
      (compra) =>
        compra.comprador.id === compradorId &&
        compra.evento.id === eventoId &&
        compra.estado === estado,
    );
  }
}
