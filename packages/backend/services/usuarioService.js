import { usuarioDTO, usuarioPropioDTO } from "../dtos/usuarioDTO.js";
import { NotFoundError } from "../error/appError.js";
import { paginar } from "../utils/paginacion.js";

export class UsuarioService {
  constructor(usuarioRepository, eventoService) {
    this.usuarioRepository = usuarioRepository;
    this.eventoService = eventoService;
  }

  async findAll(rol) {
    const usuarios = rol
      ? await this.usuarioRepository.findByRol(rol)
      : await this.usuarioRepository.findAll();
    return usuarios.map(usuarioDTO);
  }

  async findById(id) {
    const usuario = await this.usuarioRepository.findById(id);
    if (!usuario) {
      throw new NotFoundError(`No existe el usuario con id ${id}`);
    }
    return usuarioDTO(usuario);
  }

  async perfil(id) {
    const usuario = await this.usuarioRepository.findById(id);
    if (!usuario) {
      throw new NotFoundError(`No existe el usuario con id ${id}`);
    }
    return usuarioPropioDTO(usuario);
  }

  // R-01: favoritos del comprador
  async favoritos(usuario, page, limit) {
    const resumenes = await Promise.all(
      usuario.favoritos.map((evento) => this.eventoService.aResumen(evento, usuario)),
    );
    return paginar(resumenes, page, limit);
  }

  async agregarFavorito(usuario, eventoId) {
    const evento = await this.eventoService.obtenerEntidad(eventoId);
    usuario.agregarFavorito(evento);
    await this.usuarioRepository.save(usuario);
    return this.eventoService.aResumen(evento, usuario);
  }

  async quitarFavorito(usuario, eventoId) {
    const evento = await this.eventoService.obtenerEntidad(eventoId);
    if (!usuario.tieneFavorito(evento)) {
      throw new NotFoundError(`El evento ${eventoId} no está en tus favoritos`);
    }
    usuario.quitarFavorito(evento);
    await this.usuarioRepository.save(usuario);
  }
}
