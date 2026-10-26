import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { usuarioPropioDTO } from "../dtos/usuarioDTO.js";
import { ConflictError, UnauthorizedError } from "../error/appError.js";
import { Usuario } from "../models/entities/usuario.js";

const CREDENCIALES_INVALIDAS = "Email o contraseña incorrectos";

// D-29: registro, login y emisión/verificación de tokens JWT
export class AuthService {
  constructor(usuarioRepository, config) {
    this.usuarioRepository = usuarioRepository;
    this.config = config;
  }

  async registrar({ nombre, apellido, email, password, rol }) {
    if (await this.usuarioRepository.findByEmail(email)) {
      throw new ConflictError("Ya existe una cuenta con ese email");
    }
    const usuario = new Usuario(nombre, apellido, rol, email, await this.hashear(password));
    const guardado = await this.usuarioRepository.save(usuario);
    return this.sesion(guardado);
  }

  async login({ email, password }) {
    const usuario = await this.usuarioRepository.findByEmail(email);
    // Mismo mensaje si no existe el email o si la contraseña es incorrecta (no revela qué cuentas existen)
    const valida = usuario && (await bcrypt.compare(password, usuario.passwordHash));
    if (!valida) {
      throw new UnauthorizedError(CREDENCIALES_INVALIDAS);
    }
    return this.sesion(usuario);
  }

  hashear(password) {
    return bcrypt.hash(password, this.config.bcryptRondas);
  }

  sesion(usuario) {
    return { token: this.firmarToken(usuario), usuario: usuarioPropioDTO(usuario) };
  }

  firmarToken(usuario) {
    return jwt.sign({ sub: String(usuario.id), rol: usuario.rol }, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiracion,
    });
  }

  // Devuelve el usuario del token o lanza 401 si el token es inválido, venció o el usuario ya no existe
  async usuarioDelToken(token) {
    let payload;
    try {
      payload = jwt.verify(token, this.config.jwtSecret);
    } catch (error) {
      throw new UnauthorizedError(
        error.name === "TokenExpiredError"
          ? "Tu sesión venció. Volvé a ingresar"
          : "La sesión no es válida. Volvé a ingresar",
      );
    }
    const usuario = await this.usuarioRepository.findById(Number(payload.sub));
    if (!usuario) {
      throw new UnauthorizedError("La sesión no es válida. Volvé a ingresar");
    }
    return usuario;
  }
}
