import { InMemoryRepository } from "./inMemoryRepository.js";

export class CodigoRecuperacionRepository extends InMemoryRepository {
  // El último código pedido es el único que vale
  async ultimoDe(usuarioId) {
    const codigos = await this.findBy((codigo) => codigo.usuario.id === usuarioId);
    return codigos.at(-1) ?? null;
  }

  async invalidarDe(usuarioId) {
    for (const codigo of await this.findBy((c) => c.usuario.id === usuarioId && !c.usado)) {
      codigo.usar();
      await this.save(codigo);
    }
  }
}
