import { z } from "zod";
import { EstadoCompra } from "../models/entities/estadoCompra.js";
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
      const compra = await this.compraService.pagar(parsearId(req.params.id), req.usuario);
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
