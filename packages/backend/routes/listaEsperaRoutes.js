import express from "express";
import { ListaEsperaController } from "../controllers/listaEsperaController.js";
import { RolUsuario } from "../models/entities/rolUsuario.js";

const pathEspera = "/evento/:id/espera";

export default function listaEsperaRoutes(getController, auth) {
  const router = express.Router();
  const { requiereUsuario, requiereRol } = auth;
  const soloComprador = [requiereUsuario, requiereRol(RolUsuario.COMPRADOR)];

  router.post(pathEspera, ...soloComprador, (req, res, next) => {
    getController(ListaEsperaController).inscribir(req, res, next);
  });

  router.delete(pathEspera + "/:tipoEntradaId", ...soloComprador, (req, res, next) => {
    getController(ListaEsperaController).retirarse(req, res, next);
  });

  return router;
}
