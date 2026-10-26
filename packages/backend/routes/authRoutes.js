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

  // D-44: con el mismo límite de intentos que el login (evita adivinar códigos o mandar mails en masa)
  router.post(pathAuth + "/recuperar", limitarLogin, (req, res, next) => {
    getController(AuthController).recuperar(req, res, next);
  });

  router.post(pathAuth + "/restablecer", limitarLogin, (req, res, next) => {
    getController(AuthController).restablecer(req, res, next);
  });

  router.get(pathAuth + "/me", requiereUsuario, (req, res, next) => {
    getController(AuthController).me(req, res, next);
  });

  return router;
}
