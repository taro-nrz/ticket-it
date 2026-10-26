import { Usuario } from "../entities/usuario.js";
import { InMemoryRepository } from "./inMemoryRepository.js";

export class UsuarioRepository extends InMemoryRepository {
  async findByRol(rol) {
    return this.findBy((usuario) => usuario.rol === rol);
  }

  async findByEmail(email) {
    const normalizado = Usuario.normalizarEmail(email);
    return this.findOneBy((usuario) => usuario.email === normalizado);
  }
}
