import express from "express";
import { CuponController } from "../controllers/cuponController.js";
import { RolUsuario } from "../models/entities/rolUsuario.js";

const pathCupones = "/evento/:id/cupones";

export default function cuponRoutes(getController, auth) {
  const router = express.Router();
  const { requiereUsuario, requiereRol } = auth;
  const soloOrganizador = [requiereUsuario, requiereRol(RolUsuario.ORGANIZADOR)];

  // Ruta estática antes que /cupones/:cuponId
  router.get(pathCupones + "/validar", requiereUsuario, (req, res, next) => {
    getController(CuponController).validar(req, res, next);
  });

  router.get(pathCupones, ...soloOrganizador, (req, res, next) => {
    getController(CuponController).findAll(req, res, next);
  });

  router.post(pathCupones, ...soloOrganizador, (req, res, next) => {
    getController(CuponController).create(req, res, next);
  });

  router.delete(pathCupones + "/:cuponId", ...soloOrganizador, (req, res, next) => {
    getController(CuponController).desactivar(req, res, next);
  });

  return router;
}
