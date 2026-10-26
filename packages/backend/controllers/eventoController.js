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

// D-31: al editar, los tipos de entrada existentes llevan su id; los nuevos no
const editarEventoSchema = crearEventoSchema.extend({
  tiposEntrada: z
    .array(tipoEntradaSchema.extend({ id: z.number().int().positive().optional() }))
    .min(1)
    .max(10),
});

const cancelarEventoSchema = z.object({
  motivo: z.string().trim().min(5, "Contá brevemente el motivo (al menos 5 caracteres)").max(300),
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
  constructor(eventoService, { webUrl = "http://localhost:8081" } = {}) {
    this.eventoService = eventoService;
    this.webUrl = webUrl;
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

  async update(req, res, next) {
    try {
      const datos = validar(editarEventoSchema, req.body);
      const evento = await this.eventoService.actualizar(
        parsearId(req.params.id),
        datos,
        req.usuario,
      );
      res.json(evento);
    } catch (error) {
      next(error);
    }
  }

  async cancelar(req, res, next) {
    try {
      const { motivo } = validar(cancelarEventoSchema, req.body);
      const { compras: _compras, ...resultado } = await this.eventoService.cancelar(
        parsearId(req.params.id),
        motivo,
        req.usuario,
      );
      res.json(resultado);
    } catch (error) {
      next(error);
    }
  }

  async estadisticas(req, res, next) {
    try {
      const estadisticas = await this.eventoService.estadisticas(
        parsearId(req.params.id),
        req.usuario,
      );
      res.json(estadisticas);
    } catch (error) {
      next(error);
    }
  }

  async calendario(req, res, next) {
    try {
      const id = parsearId(req.params.id);
      // El link del evento en la app web (WEB_URL), para que el calendario lleve de vuelta al evento
      const urlEvento = `${this.webUrl}/evento/${id}`;
      const { contenido, archivo } = await this.eventoService.calendario(id, urlEvento);
      res
        .type("text/calendar; charset=utf-8")
        .set("Content-Disposition", `attachment; filename="${archivo}"`)
        .set("Cross-Origin-Resource-Policy", "cross-origin")
        .send(contenido);
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
