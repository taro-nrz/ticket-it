import express from "express";
import swaggerUiExpress from "swagger-ui-express";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

const swaggerDocument = parse(
  readFileSync(new URL("../docs/api-docs.yaml", import.meta.url), "utf8"),
);

export default function swaggerRoutes() {
  const router = express.Router();
  router.get("/api-docs.json", (_req, res) => res.json(swaggerDocument));
  router.use("/api-docs", swaggerUiExpress.serve);
  router.get(
    "/api-docs",
    swaggerUiExpress.setup(swaggerDocument, {
      swaggerOptions: { persistAuthorization: true },
    }),
  );
  return router;
}
