import express from "express";
import { DevController } from "../controllers/devController.js";

export default function devRoutes(getController) {
  const router = express.Router();

  router.post("/dev/reset", (req, res, next) => {
    getController(DevController).reset(req, res, next);
  });

  router.get("/dev/emails", (req, res, next) => {
    getController(DevController).emails(req, res, next);
  });

  return router;
}
