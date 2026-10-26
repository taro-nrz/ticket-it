import express from "express";

export default function healthRoutes() {
  const router = express.Router();

  // La raíz lleva a la documentación de la API
  router.get("/", (_req, res) => {
    res.redirect("/api-docs/");
  });

  router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return router;
}
