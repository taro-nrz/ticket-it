import { z } from "zod";
import { TipoCupon } from "../models/entities/cupon.js";
import { parsearId, validar } from "../utils/validacion.js";

const comunes = {
  codigo: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{3,20}$/, "Usá entre 3 y 20 letras o números, sin espacios"),
  usosMaximos: z.number().int().positive().nullable().default(null),
  vence: z.coerce.date().nullable().default(null),
};

// D-38: cada tipo de cupón tiene sus propios datos (el porcentaje, el monto o nada)
const crearCuponSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal(TipoCupon.PORCENTAJE),
    porcentaje: z.number().int().min(1).max(100),
    ...comunes,
  }),
  z.object({ tipo: z.literal(TipoCupon.MONTO_FIJO), monto: z.number().positive(), ...comunes }),
  z.object({ tipo: z.literal(TipoCupon.DOS_POR_UNO), ...comunes }),
]);

const validarCuponSchema = z.object({
  codigo: z.string().trim().min(1, "Ingresá el código del cupón"),
  tipoEntradaId: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().int().positive(),
});

export class CuponController {
  constructor(cuponService) {
    this.cuponService = cuponService;
  }

  async findAll(req, res, next) {
    try {
      res.json(await this.cuponService.listar(parsearId(req.params.id), req.usuario));
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const datos = validar(crearCuponSchema, req.body);
      const cupon = await this.cuponService.crear(parsearId(req.params.id), datos, req.usuario);
      res.status(201).json(cupon);
    } catch (error) {
      next(error);
    }
  }

  async desactivar(req, res, next) {
    try {
      const cupon = await this.cuponService.desactivar(
        parsearId(req.params.id),
        parsearId(req.params.cuponId, "cuponId"),
        req.usuario,
      );
      res.json(cupon);
    } catch (error) {
      next(error);
    }
  }

  async validar(req, res, next) {
    try {
      const datos = validar(validarCuponSchema, req.query);
      res.json(await this.cuponService.validar(parsearId(req.params.id), datos));
    } catch (error) {
      next(error);
    }
  }
}
