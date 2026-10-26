import { Cupon } from "../entities/cupon.js";
import { InMemoryRepository } from "./inMemoryRepository.js";

export class CuponRepository extends InMemoryRepository {
  async findByEvento(eventoId) {
    return this.findBy((cupon) => cupon.evento.id === eventoId);
  }

  // El código es único dentro de cada evento (sin distinguir mayúsculas)
  async findByCodigoYEvento(codigo, eventoId) {
    const normalizado = Cupon.normalizarCodigo(codigo);
    return this.findOneBy((cupon) => cupon.evento.id === eventoId && cupon.codigo === normalizado);
  }
}
