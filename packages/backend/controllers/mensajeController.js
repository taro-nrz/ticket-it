import { z } from "zod";
import { parsearId, validar } from "../utils/validacion.js";

const enviarMensajeSchema = z.object({
  mensaje: z.string().trim().min(1).max(1000),
});

const listarMensajesSchema = z.object({
  desde: z.coerce.date().optional(),
});

export class MensajeController {
  constructor(mensajeService) {
    this.mensajeService = mensajeService;
  }

  async findAll(req, res, next) {
    try {
      const { desde } = validar(listarMensajesSchema, req.query);
      const mensajes = await this.mensajeService.listar(
        parsearId(req.params.id),
        req.usuario,
        desde,
      );
      res.json(mensajes);
    } catch (error) {
      next(error);
    }
  }

  async marcarLeidos(req, res, next) {
    try {
      await this.mensajeService.marcarLeidos(parsearId(req.params.id), req.usuario);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { mensaje } = validar(enviarMensajeSchema, req.body);
      const enviado = await this.mensajeService.enviar(
        parsearId(req.params.id),
        req.usuario,
        mensaje,
      );
      res.status(201).json(enviado);
    } catch (error) {
      next(error);
    }
  }
}
