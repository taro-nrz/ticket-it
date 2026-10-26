import { z } from "zod";
import { RolUsuario } from "../models/entities/rolUsuario.js";
import { parsearId, validar } from "../utils/validacion.js";

const listarSchema = z.object({
  rol: z.enum(Object.values(RolUsuario)).optional(),
});

export class UsuarioController {
  constructor(usuarioService) {
    this.usuarioService = usuarioService;
  }

  async findAll(req, res, next) {
    try {
      const { rol } = validar(listarSchema, req.query);
      const usuarios = await this.usuarioService.findAll(rol);
      res.json(usuarios);
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const usuario = await this.usuarioService.perfil(req.usuario.id);
      res.json(usuario);
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const usuario = await this.usuarioService.findById(parsearId(req.params.id));
      res.json(usuario);
    } catch (error) {
      next(error);
    }
  }

  async favoritos(req, res, next) {
    try {
      const { page, limit } = req.query;
      const favoritos = await this.usuarioService.favoritos(req.usuario, page, limit);
      res.json(favoritos);
    } catch (error) {
      next(error);
    }
  }

  async agregarFavorito(req, res, next) {
    try {
      const eventoId = parsearId(req.params.eventoId, "eventoId");
      const evento = await this.usuarioService.agregarFavorito(req.usuario, eventoId);
      res.status(201).json(evento);
    } catch (error) {
      next(error);
    }
  }

  async quitarFavorito(req, res, next) {
    try {
      const eventoId = parsearId(req.params.eventoId, "eventoId");
      await this.usuarioService.quitarFavorito(req.usuario, eventoId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
