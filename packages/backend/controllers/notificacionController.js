import { z } from "zod";
import { EstadoNotificacion } from "../models/entities/notificacion.js";
import { parsearId, validar } from "../utils/validacion.js";

const listarSchema = z.object({
  estado: z.enum(Object.values(EstadoNotificacion)).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export class NotificacionController {
  constructor(notificacionService) {
    this.notificacionService = notificacionService;
  }

  async findAll(req, res, next) {
    try {
      const filtros = validar(listarSchema, req.query);
      res.json(await this.notificacionService.listar(req.usuario, filtros));
    } catch (error) {
      next(error);
    }
  }

  async resumen(req, res, next) {
    try {
      res.json(await this.notificacionService.resumen(req.usuario));
    } catch (error) {
      next(error);
    }
  }

  async marcarLeida(req, res, next) {
    try {
      const id = parsearId(req.params.id);
      res.json(await this.notificacionService.marcarLeida(id, req.usuario));
    } catch (error) {
      next(error);
    }
  }

  async marcarTodasLeidas(req, res, next) {
    try {
      await this.notificacionService.marcarTodasLeidas(req.usuario);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
