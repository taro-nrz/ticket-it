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

const recuperarSchema = z.object({ email: emailSchema });

const restablecerSchema = z.object({
  email: emailSchema,
  codigo: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "El código tiene 6 números"),
  passwordNueva: passwordSchema,
});

const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, "Ingresá tu contraseña actual"),
  passwordNueva: passwordSchema,
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

  async recuperar(req, res, next) {
    try {
      const { email } = validar(recuperarSchema, req.body);
      await this.authService.pedirRecuperacion(email);
      res.status(202).json({
        message:
          "Si el email tiene una cuenta, te enviamos un código para restablecer la contraseña.",
      });
    } catch (error) {
      next(error);
    }
  }

  async restablecer(req, res, next) {
    try {
      await this.authService.restablecerPassword(validar(restablecerSchema, req.body));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async cambiarPassword(req, res, next) {
    try {
      const datos = validar(cambiarPasswordSchema, req.body);
      await this.authService.cambiarPassword(req.usuario, datos);
      res.status(204).send();
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
