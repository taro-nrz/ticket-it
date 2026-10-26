import rateLimit from "express-rate-limit";
import { ForbiddenError, TooManyRequestsError, UnauthorizedError } from "../error/appError.js";

const PREFIJO_BEARER = "Bearer ";

// D-29: el usuario se identifica con un JWT en el header Authorization: Bearer <token>.
// Devuelve los middlewares que usan las rutas para exigir usuario y rol (las rutas no cambian).
export function crearMiddlewaresDeUsuario(authService) {
  async function resolverUsuario(req) {
    const header = req.get("authorization");
    if (header === undefined || header.trim() === "") return null;
    if (!header.startsWith(PREFIJO_BEARER)) {
      throw new UnauthorizedError("El header Authorization debe tener el formato Bearer <token>");
    }
    return authService.usuarioDelToken(header.slice(PREFIJO_BEARER.length).trim());
  }

  // Endpoints públicos: si viene el token se usa (ej. para marcar favoritos), si no, sigue sin usuario
  async function usuarioOpcional(req, _res, next) {
    try {
      req.usuario = await resolverUsuario(req);
      next();
    } catch (error) {
      next(error);
    }
  }

  async function requiereUsuario(req, _res, next) {
    try {
      const usuario = await resolverUsuario(req);
      if (!usuario) {
        throw new UnauthorizedError("Tenés que iniciar sesión para realizar esta acción");
      }
      req.usuario = usuario;
      next();
    } catch (error) {
      next(error);
    }
  }

  // Se usa después de requiereUsuario
  function requiereRol(...roles) {
    return (req, _res, next) => {
      if (!roles.includes(req.usuario.rol)) {
        return next(
          new ForbiddenError(`Esta acción es sólo para usuarios con rol ${roles.join(" o ")}`),
        );
      }
      next();
    };
  }

  return { usuarioOpcional, requiereUsuario, requiereRol };
}

// D-29: límite de intentos de login por IP (contra ataques de fuerza bruta). Responde con el formato de errores.
export function crearLimiteDeLogin({ loginMaxIntentos, loginVentanaMs }) {
  return rateLimit({
    windowMs: loginVentanaMs,
    limit: loginMaxIntentos,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (_req, _res, next) => next(new TooManyRequestsError()),
  });
}
