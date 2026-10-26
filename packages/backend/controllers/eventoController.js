import { z } from "zod";
import { OrdenEvento } from "../services/eventoService.js";
import { parsearId, validar } from "../utils/validacion.js";

const tipoEntradaSchema = z.object({
  nombre: z.string().trim().min(1).max(50),
  descripcion: z.string().trim().max(200).default(""),
  precio: z.number().nonnegative(),
  cupo: z.number().int().positive(),
});

const crearEventoSchema = z.object({
  nombre: z.string().trim().min(3).max(100),
  descripcion: z.string().trim().min(10).max(2000),
  categoriaId: z.number().int().positive(),
  fecha: z.coerce.date(),
  lugar: z.string().trim().min(2).max(100),
  direccion: z.string().trim().min(3).max(200),
  multimedia: z.array(z.url()).max(10).default([]),
  tiposEntrada: z.array(tipoEntradaSchema).min(1).max(10),
});

const booleanoQuery = z
  .enum(["true", "false"])
  .transform((valor) => valor === "true")
  .optional();

const listarEventosSchema = z
  .object({
    texto: z.string().trim().min(1).optional(),
    categoria: z.coerce.number().int().positive().optional(),
    precioMin: z.coerce.number().nonnegative().optional(),
    precioMax: z.coerce.number().nonnegative().optional(),
    fechaDesde: z.coerce.date().optional(),
    fechaHasta: z.coerce.date().optional(),
    incluirPasados: booleanoQuery,
    orden: z.enum(Object.values(OrdenEvento)).default(OrdenEvento.FECHA),
    dir: z.enum(["asc", "desc"]).default("asc"),
    page: z.string().optional(),
    limit: z.string().optional(),
  })
  .refine(
    (filtros) =>
      filtros.precioMin === undefined ||
      filtros.precioMax === undefined ||
      filtros.precioMin <= filtros.precioMax,
    { message: "precioMin no puede ser mayor que precioMax", path: ["precioMin"] },
  );

export class EventoController {
  constructor(eventoService) {
    this.eventoService = eventoService;
  }

  async create(req, res, next) {
    try {
      const datos = validar(crearEventoSchema, req.body);
      const evento = await this.eventoService.crear(datos, req.usuario);
      res.status(201).json(evento);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req, res, next) {
    try {
      const { categoria, ...filtros } = validar(listarEventosSchema, req.query);
      const resultado = await this.eventoService.listar(
        { ...filtros, categoriaId: categoria },
        req.usuario,
      );
      res.json(resultado);
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const evento = await this.eventoService.detalle(parsearId(req.params.id), req.usuario);
      res.json(evento);
    } catch (error) {
      next(error);
    }
  }

  async misEventos(req, res, next) {
    try {
      const { page, limit } = req.query;
      const eventos = await this.eventoService.misEventos(req.usuario, page, limit);
      res.json(eventos);
    } catch (error) {
      next(error);
    }
  }
}
