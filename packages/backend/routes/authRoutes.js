import express from "express";
import { AuthController } from "../controllers/authController.js";

const pathAuth = "/auth";

export default function authRoutes(getController, auth) {
  const router = express.Router();
  const { requiereUsuario, limitarLogin } = auth;

  router.post(pathAuth + "/registro", (req, res, next) => {
    getController(AuthController).registro(req, res, next);
  });

  router.post(pathAuth + "/login", limitarLogin, (req, res, next) => {
    getController(AuthController).login(req, res, next);
  });

  router.post(pathAuth + "/cambiar-password", requiereUsuario, (req, res, next) => {
    getController(AuthController).cambiarPassword(req, res, next);
  });

  router.get(pathAuth + "/me", requiereUsuario, (req, res, next) => {
    getController(AuthController).me(req, res, next);
  });

  return router;
}
