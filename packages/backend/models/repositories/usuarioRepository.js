import { InMemoryRepository } from "./inMemoryRepository.js";

export class UsuarioRepository extends InMemoryRepository {
  async findByRol(rol) {
    return this.findBy((usuario) => usuario.rol === rol);
  }
}
