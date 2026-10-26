// Jerarquía de errores operacionales (esperables): el errorHandler global los traduce a su statusCode.
export class AppError extends Error {
  constructor(message, statusCode, errores = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.errores = errores;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Datos de validación inválidos", errores = undefined) {
    super(message, 400, errores);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Usuario no identificado") {
    super(message, 401);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Demasiados intentos. Probá de nuevo en unos minutos") {
    super(message, 429);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "No tenés permisos para realizar esta acción") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflicto con el recurso existente") {
    super(message, 409);
  }
}

// Violación de una regla de negocio (ej. sin cupo, transición de estado inválida)
export class BusinessRuleError extends AppError {
  constructor(message = "La operación no cumple las reglas de negocio") {
    super(message, 422);
  }
}
