import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomInt } from "node:crypto";
import { CodigoRecuperacion, MINUTOS_CODIGO } from "../models/entities/codigoRecuperacion.js";
import { usuarioPropioDTO } from "../dtos/usuarioDTO.js";
import { ConflictError, UnauthorizedError, ValidationError } from "../error/appError.js";
import { Usuario } from "../models/entities/usuario.js";

const CREDENCIALES_INVALIDAS = "Email o contraseña incorrectos";

// D-29: registro, login y emisión/verificación de tokens JWT
const CODIGO_INVALIDO = "El código no es válido o venció. Pedí uno nuevo.";

export class AuthService {
  constructor(
    usuarioRepository,
    config,
    { codigoRepository = null, email = null, reloj = null } = {},
  ) {
    this.usuarioRepository = usuarioRepository;
    this.config = config;
    this.codigoRepository = codigoRepository;
    this.email = email;
    this.reloj = reloj ?? { ahora: () => new Date() };
  }

  // D-44: pedir un código para restablecer la contraseña. La respuesta es la misma exista o no la cuenta
  // (no revela qué emails están registrados); si existe, se envía el código por email.
  async pedirRecuperacion(email) {
    const usuario = await this.usuarioRepository.findByEmail(email);
    if (!usuario) return;
    await this.codigoRepository.invalidarDe(usuario.id);
    const codigo = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await this.codigoRepository.save(
      new CodigoRecuperacion({
        usuario,
        hash: await bcrypt.hash(codigo, this.config.bcryptRondas),
        creado: this.reloj.ahora(),
      }),
    );
    await this.email.enviar({
      para: usuario.email,
      asunto: "Tu código para restablecer la contraseña",
      texto: `Hola ${usuario.nombre}:\nTu código es ${codigo}. Vence en ${MINUTOS_CODIGO} minutos.\nSi no lo pediste, ignorá este mensaje: tu contraseña no cambió.`,
    });
  }

  async restablecerPassword({ email, codigo, passwordNueva }) {
    const usuario = await this.usuarioRepository.findByEmail(email);
    const pendiente = usuario && (await this.codigoRepository.ultimoDe(usuario.id));
    if (!pendiente || !pendiente.vigente(this.reloj.ahora())) {
      throw new ValidationError(CODIGO_INVALIDO, [{ campo: "codigo", mensaje: CODIGO_INVALIDO }]);
    }
    if (!(await bcrypt.compare(codigo, pendiente.hash))) {
      pendiente.registrarIntentoFallido();
      await this.codigoRepository.save(pendiente);
      const mensaje = pendiente.vigente(this.reloj.ahora())
        ? "El código no es correcto"
        : CODIGO_INVALIDO;
      throw new ValidationError(mensaje, [{ campo: "codigo", mensaje }]);
    }
    pendiente.usar();
    await this.codigoRepository.save(pendiente);
    usuario.passwordHash = await this.hashear(passwordNueva);
    await this.usuarioRepository.save(usuario);
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

  // D-30: cambiar la contraseña exige la actual (si alguien toma el celular desbloqueado no puede cambiarla)
  async cambiarPassword(usuario, { passwordActual, passwordNueva }) {
    if (!(await bcrypt.compare(passwordActual, usuario.passwordHash))) {
      throw new ValidationError("La contraseña actual no es correcta", [
        { campo: "passwordActual", mensaje: "La contraseña actual no es correcta" },
      ]);
    }
    if (passwordActual === passwordNueva) {
      throw new ValidationError("La contraseña nueva tiene que ser distinta de la actual", [
        { campo: "passwordNueva", mensaje: "Tiene que ser distinta de la actual" },
      ]);
    }
    usuario.passwordHash = await this.hashear(passwordNueva);
    await this.usuarioRepository.save(usuario);
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
