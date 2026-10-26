import express from "express";
import { CategoriaController } from "../controllers/categoriaController.js";

const pathCategoria = "/categoria";

export default function categoriaRoutes(getController) {
  const router = express.Router();

  router.get(pathCategoria, (req, res, next) => {
    getController(CategoriaController).findAll(req, res, next);
  });

  router.get(pathCategoria + "/:id", (req, res, next) => {
    getController(CategoriaController).findById(req, res, next);
  });

  return router;
}
