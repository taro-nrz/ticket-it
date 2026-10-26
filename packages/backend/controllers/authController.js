import { z } from "zod";
import { RolUsuario } from "../models/entities/rolUsuario.js";
import { validar } from "../utils/validacion.js";

// bcrypt sólo usa los primeros 72 bytes: se limita para que la contraseña completa cuente
export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "La contraseña puede tener hasta 72 caracteres")
  .regex(/[A-Za-zÁÉÍÓÚáéíóúÑñ]/, "La contraseña debe tener al menos una letra")
  .regex(/\d/, "La contraseña debe tener al menos un número");

const nombreSchema = z.string().trim().min(2).max(50);

// Se normaliza antes de validar: "  Ana@Mail.com " es el mismo email que "ana@mail.com"
const emailSchema = z
  .string("Ingresá un email válido")
  .trim()
  .toLowerCase()
  .pipe(z.email("Ingresá un email válido").max(120));

const registroSchema = z.object({
  nombre: nombreSchema,
  apellido: nombreSchema,
  email: emailSchema,
  password: passwordSchema,
  rol: z.enum([RolUsuario.COMPRADOR, RolUsuario.ORGANIZADOR]),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export class AuthController {
  constructor(authService, usuarioService) {
    this.authService = authService;
    this.usuarioService = usuarioService;
  }

  async registro(req, res, next) {
    try {
      const datos = validar(registroSchema, req.body);
      const sesion = await this.authService.registrar(datos);
      res.status(201).json(sesion);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const credenciales = validar(loginSchema, req.body);
      const sesion = await this.authService.login(credenciales);
      res.json(sesion);
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      res.json(await this.usuarioService.perfil(req.usuario.id));
    } catch (error) {
      next(error);
    }
  }
}
