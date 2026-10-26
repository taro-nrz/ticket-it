import { z } from "zod";
import { parsearId, validar } from "../utils/validacion.js";

const crearReseniaSchema = z.object({
  puntuacion: z.number().int().min(1).max(5),
  detalle: z.string().trim().min(1).max(1000),
});

export class ReseniaController {
  constructor(reseniaService) {
    this.reseniaService = reseniaService;
  }

  async create(req, res, next) {
    try {
      const datos = validar(crearReseniaSchema, req.body);
      const resenia = await this.reseniaService.crear(parsearId(req.params.id), req.usuario, datos);
      res.status(201).json(resenia);
    } catch (error) {
      next(error);
    }
  }

  async deEvento(req, res, next) {
    try {
      const { page, limit } = req.query;
      const resenias = await this.reseniaService.deEvento(parsearId(req.params.id), page, limit);
      res.json(resenias);
    } catch (error) {
      next(error);
    }
  }

  async deOrganizador(req, res, next) {
    try {
      const { page, limit } = req.query;
      const resenias = await this.reseniaService.deOrganizador(
        parsearId(req.params.id),
        page,
        limit,
      );
      res.json(resenias);
    } catch (error) {
      next(error);
    }
  }
}
