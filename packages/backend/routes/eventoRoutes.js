import express from "express";
import { EventoController } from "../controllers/eventoController.js";
import { RolUsuario } from "../models/entities/rolUsuario.js";

const pathEvento = "/evento";

export default function eventoRoutes(getController, auth) {
  const router = express.Router();
  const { usuarioOpcional, requiereUsuario, requiereRol } = auth;
  const soloOrganizador = [requiereUsuario, requiereRol(RolUsuario.ORGANIZADOR)];

  router.get(pathEvento, usuarioOpcional, (req, res, next) => {
    getController(EventoController).findAll(req, res, next);
  });

  router.post(pathEvento, ...soloOrganizador, (req, res, next) => {
    getController(EventoController).create(req, res, next);
  });

  // Ruta estática antes que /evento/:id
  router.get(pathEvento + "/mios", ...soloOrganizador, (req, res, next) => {
    getController(EventoController).misEventos(req, res, next);
  });

  router.get(pathEvento + "/:id", usuarioOpcional, (req, res, next) => {
    getController(EventoController).findById(req, res, next);
  });

  return router;
}
