import { z } from "zod";
import { parsearId, validar } from "../utils/validacion.js";

const inscribirSchema = z.object({
  tipoEntradaId: z.number().int().positive(),
  cantidad: z.number().int().min(1).max(10).default(1),
});

export class ListaEsperaController {
  constructor(listaEsperaService) {
    this.listaEsperaService = listaEsperaService;
  }

  async inscribir(req, res, next) {
    try {
      const datos = validar(inscribirSchema, req.body);
      const inscripcion = await this.listaEsperaService.inscribir(
        parsearId(req.params.id),
        req.usuario,
        datos,
      );
      res.status(201).json(inscripcion);
    } catch (error) {
      next(error);
    }
  }

  async retirarse(req, res, next) {
    try {
      await this.listaEsperaService.retirarse(
        parsearId(req.params.id),
        req.usuario,
        parsearId(req.params.tipoEntradaId, "tipoEntradaId"),
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
