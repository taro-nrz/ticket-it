import express from "express";
import { NotificacionController } from "../controllers/notificacionController.js";

const pathNotificacion = "/notificacion";

export default function notificacionRoutes(getController, auth) {
  const router = express.Router();
  const { requiereUsuario } = auth;

  router.get(pathNotificacion, requiereUsuario, (req, res, next) => {
    getController(NotificacionController).findAll(req, res, next);
  });

  // Rutas estáticas antes que /notificacion/:id
  router.get(pathNotificacion + "/resumen", requiereUsuario, (req, res, next) => {
    getController(NotificacionController).resumen(req, res, next);
  });

  router.post(pathNotificacion + "/leer-todas", requiereUsuario, (req, res, next) => {
    getController(NotificacionController).marcarTodasLeidas(req, res, next);
  });

  router.post(pathNotificacion + "/:id/leer", requiereUsuario, (req, res, next) => {
    getController(NotificacionController).marcarLeida(req, res, next);
  });

  return router;
}
