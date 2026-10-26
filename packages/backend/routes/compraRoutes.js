import express from "express";
import { CompraController } from "../controllers/compraController.js";
import { RolUsuario } from "../models/entities/rolUsuario.js";

const pathCompra = "/compra";

export default function compraRoutes(getController, auth) {
  const router = express.Router();
  const { requiereUsuario, requiereRol } = auth;
  const soloComprador = [requiereUsuario, requiereRol(RolUsuario.COMPRADOR)];
  const soloOrganizador = [requiereUsuario, requiereRol(RolUsuario.ORGANIZADOR)];

  router.post(pathCompra, ...soloComprador, (req, res, next) => {
    getController(CompraController).create(req, res, next);
  });

  // Ruta estática antes que /compra/:id
  router.get(pathCompra + "/mias", ...soloComprador, (req, res, next) => {
    getController(CompraController).misCompras(req, res, next);
  });

  router.get(pathCompra + "/:id", requiereUsuario, (req, res, next) => {
    getController(CompraController).findById(req, res, next);
  });

  router.get(pathCompra + "/:id/historial", requiereUsuario, (req, res, next) => {
    getController(CompraController).historial(req, res, next);
  });

  router.post(pathCompra + "/:id/pagar", ...soloComprador, (req, res, next) => {
    getController(CompraController).pagar(req, res, next);
  });

  router.post(pathCompra + "/:id/cancelar", ...soloComprador, (req, res, next) => {
    getController(CompraController).cancelar(req, res, next);
  });

  router.post(pathCompra + "/:id/utilizar", ...soloOrganizador, (req, res, next) => {
    getController(CompraController).utilizar(req, res, next);
  });

  // HU-06: compras de un evento (organizador)
  router.get("/evento/:id/compras", ...soloOrganizador, (req, res, next) => {
    getController(CompraController).comprasDeEvento(req, res, next);
  });

  return router;
}
