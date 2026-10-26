import { normalizarTexto } from "../../utils/texto.js";
import { InMemoryRepository } from "./inMemoryRepository.js";

export class CategoriaRepository extends InMemoryRepository {
  async findByNombre(nombre) {
    return this.findOneBy(
      (categoria) => normalizarTexto(categoria.nombre) === normalizarTexto(nombre),
    );
  }
}
