import { ForbiddenError, NotFoundError, UnauthorizedError } from "../error/appError.js";

const HEADER_USUARIO = "x-user-id";

// D-03: el usuario se identifica con el header x-user-id (sin login real).
// Devuelve los middlewares que usan las rutas para exigir usuario y rol.
export function crearMiddlewaresDeUsuario(usuarioRepository) {
  async function resolverUsuario(req) {
    const valor = req.get(HEADER_USUARIO);
    if (valor === undefined || valor.trim() === "") return null;

    const id = Number(valor);
    if (!Number.isInteger(id) || id <= 0) {
      throw new UnauthorizedError(`El header ${HEADER_USUARIO} debe ser un id numérico`);
    }
    const usuario = await usuarioRepository.findById(id);
    if (!usuario) {
      throw new NotFoundError(`No existe el usuario con id ${id}`);
    }
    return usuario;
  }

  // Endpoints públicos: si viene el header se usa (ej. para marcar favoritos), si no, sigue sin usuario
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
        throw new UnauthorizedError(
          `Falta el header ${HEADER_USUARIO} para identificar al usuario`,
        );
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
