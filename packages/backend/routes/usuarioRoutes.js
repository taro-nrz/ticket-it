import express from "express";
import { UsuarioController } from "../controllers/usuarioController.js";
import { RolUsuario } from "../models/entities/rolUsuario.js";

const pathUsuario = "/usuario";

export default function usuarioRoutes(getController, auth) {
  const router = express.Router();
  const { requiereUsuario, requiereRol } = auth;
  const soloComprador = [requiereUsuario, requiereRol(RolUsuario.COMPRADOR)];

  router.get(pathUsuario, (req, res, next) => {
    getController(UsuarioController).findAll(req, res, next);
  });

  // Rutas estáticas antes que /usuario/:id
  router.get(pathUsuario + "/me", requiereUsuario, (req, res, next) => {
    getController(UsuarioController).me(req, res, next);
  });

  router.patch(pathUsuario + "/me", requiereUsuario, (req, res, next) => {
    getController(UsuarioController).actualizarPerfil(req, res, next);
  });

  router.get(pathUsuario + "/me/favoritos", ...soloComprador, (req, res, next) => {
    getController(UsuarioController).favoritos(req, res, next);
  });

  router.post(pathUsuario + "/me/favoritos/:eventoId", ...soloComprador, (req, res, next) => {
    getController(UsuarioController).agregarFavorito(req, res, next);
  });

  router.delete(pathUsuario + "/me/favoritos/:eventoId", ...soloComprador, (req, res, next) => {
    getController(UsuarioController).quitarFavorito(req, res, next);
  });

  router.get(pathUsuario + "/:id", (req, res, next) => {
    getController(UsuarioController).findById(req, res, next);
  });

  return router;
}
