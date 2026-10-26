import express from "express";
import { ReseniaController } from "../controllers/reseniaController.js";
import { RolUsuario } from "../models/entities/rolUsuario.js";

export default function reseniaRoutes(getController, auth) {
  const router = express.Router();
  const { requiereUsuario, requiereRol } = auth;

  router.get("/evento/:id/resenias", (req, res, next) => {
    getController(ReseniaController).deEvento(req, res, next);
  });

  router.post(
    "/evento/:id/resenias",
    requiereUsuario,
    requiereRol(RolUsuario.COMPRADOR),
    (req, res, next) => {
      getController(ReseniaController).create(req, res, next);
    },
  );

  // HU-12: reseñas de los eventos de un organizador
  router.get("/usuario/:id/resenias", (req, res, next) => {
    getController(ReseniaController).deOrganizador(req, res, next);
  });

  return router;
}
