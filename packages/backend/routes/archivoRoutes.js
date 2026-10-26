import express from "express";
import multer from "multer";
import { ArchivoController } from "../controllers/archivoController.js";
import { PayloadTooLargeError } from "../error/appError.js";
import { RolUsuario } from "../models/entities/rolUsuario.js";
import { MAX_BYTES_IMAGEN } from "../services/archivoService.js";

// En memoria: se valida la firma del archivo antes de escribirlo en disco
const subida = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES_IMAGEN, files: 1 },
});

function recibirImagen(req, res, next) {
  subida.single("imagen")(req, res, (error) => {
    if (error?.code === "LIMIT_FILE_SIZE") {
      return next(new PayloadTooLargeError("La imagen puede pesar hasta 5 MB"));
    }
    next(error);
  });
}

export default function archivoRoutes(getController, auth, { uploadsDir } = {}) {
  const router = express.Router();
  const { requiereUsuario, requiereRol } = auth;

  router.post(
    "/archivos/imagenes",
    requiereUsuario,
    requiereRol(RolUsuario.ORGANIZADOR),
    recibirImagen,
    (req, res, next) => getController(ArchivoController).subirImagen(req, res, next),
  );

  // Las imágenes las muestra la app web desde otro origen: se permite cargarlas cross-origin
  router.use(
    "/uploads",
    (_req, res, next) => {
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
      next();
    },
    express.static(uploadsDir, { maxAge: "7d", immutable: true, fallthrough: true }),
  );

  return router;
}
