import { z } from "zod";
import { EstadoCompra } from "../models/entities/estadoCompra.js";
import { numeroDeTarjetaValido } from "../services/pasarelaPago.js";
import { parsearId, validar } from "../utils/validacion.js";

const comprarSchema = z.object({
  eventoId: z.number().int().positive(),
  tipoEntradaId: z.number().int().positive(),
  cantidad: z.number().int().positive(),
});

const listarComprasSchema = z.object({
  estado: z.enum(Object.values(EstadoCompra)).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

// D-37: datos de la tarjeta (simulada). El número se acepta con espacios o guiones.
const tarjetaSchema = z.object({
  numero: z
    .string()
    .transform((valor) => valor.replace(/[\s-]/g, ""))
    .refine(numeroDeTarjetaValido, "El número de tarjeta no es válido"),
  titular: z.string().trim().min(3, "Ingresá el nombre como figura en la tarjeta").max(60),
  vencimiento: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Usá el formato MM/AA")
    .refine(tarjetaNoVencida, "La tarjeta está vencida"),
  cvv: z.string().regex(/^\d{3,4}$/, "El código de seguridad tiene 3 o 4 números"),
});

const pagarSchema = z.object({ tarjeta: tarjetaSchema.optional() });

// Una tarjeta "MM/AA" vale hasta el último día de ese mes
function tarjetaNoVencida(vencimiento) {
  const [mes, anio] = vencimiento.split("/").map(Number);
  return new Date(2000 + anio, mes, 1) > new Date();
}

const validarEntradaSchema = z.object({
  codigo: z.string().trim().min(1, "Ingresá el código de la entrada").max(30),
});

export class CompraController {
  constructor(compraService) {
    this.compraService = compraService;
  }

  async create(req, res, next) {
    try {
      const datos = validar(comprarSchema, req.body);
      const compra = await this.compraService.comprar(req.usuario, datos);
      res.status(201).json(compra);
    } catch (error) {
      next(error);
    }
  }

  async misCompras(req, res, next) {
    try {
      const filtros = validar(listarComprasSchema, req.query);
      const compras = await this.compraService.misCompras(req.usuario, filtros);
      res.json(compras);
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const compra = await this.compraService.detalle(parsearId(req.params.id), req.usuario);
      res.json(compra);
    } catch (error) {
      next(error);
    }
  }

  async comprasDeEvento(req, res, next) {
    try {
      const filtros = validar(listarComprasSchema, req.query);
      const resultado = await this.compraService.comprasDeEvento(
        parsearId(req.params.id),
        req.usuario,
        filtros,
      );
      res.json(resultado);
    } catch (error) {
      next(error);
    }
  }

  async pagar(req, res, next) {
    try {
      const datos = validar(pagarSchema, req.body ?? {});
      const compra = await this.compraService.pagar(parsearId(req.params.id), req.usuario, datos);
      res.json(compra);
    } catch (error) {
      next(error);
    }
  }

  async utilizar(req, res, next) {
    try {
      const compra = await this.compraService.utilizar(parsearId(req.params.id), req.usuario);
      res.json(compra);
    } catch (error) {
      next(error);
    }
  }

  async validarEntrada(req, res, next) {
    try {
      const { codigo } = validar(validarEntradaSchema, req.body);
      const compra = await this.compraService.validarEntrada(
        parsearId(req.params.id),
        codigo,
        req.usuario,
      );
      res.json(compra);
    } catch (error) {
      next(error);
    }
  }

  async cancelar(req, res, next) {
    try {
      const compra = await this.compraService.cancelar(parsearId(req.params.id), req.usuario);
      res.json(compra);
    } catch (error) {
      next(error);
    }
  }

  async historial(req, res, next) {
    try {
      const historial = await this.compraService.historial(parsearId(req.params.id), req.usuario);
      res.json(historial);
    } catch (error) {
      next(error);
    }
  }
}
