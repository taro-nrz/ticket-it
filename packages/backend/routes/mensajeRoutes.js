import express from "express";
import { MensajeController } from "../controllers/mensajeController.js";

const pathMensajes = "/compra/:id/mensajes";

export default function mensajeRoutes(getController, auth) {
  const router = express.Router();
  const { requiereUsuario } = auth;

  router.get(pathMensajes, requiereUsuario, (req, res, next) => {
    getController(MensajeController).findAll(req, res, next);
  });

  router.post(pathMensajes, requiereUsuario, (req, res, next) => {
    getController(MensajeController).create(req, res, next);
  });

  router.post(pathMensajes + "/leidos", requiereUsuario, (req, res, next) => {
    getController(MensajeController).marcarLeidos(req, res, next);
  });

  return router;
}
