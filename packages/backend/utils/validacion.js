import { z } from "zod";
import { ValidationError } from "../error/appError.js";

// Mensajes de Zod en español
z.config(z.locales.es());

// Valida con un schema de Zod y devuelve los datos parseados, o lanza ValidationError
// con el formato único de errores: [{ campo, mensaje }]
export function validar(schema, data) {
  const resultado = schema.safeParse(data);
  if (!resultado.success) {
    const errores = resultado.error.issues.map((issue) => ({
      campo: issue.path.join(".") || "body",
      mensaje: issue.message,
    }));
    throw new ValidationError("Datos de validación inválidos", errores);
  }
  return resultado.data;
}

const idSchema = z.coerce.number().int().positive();

export function parsearId(valor, campo = "id") {
  const resultado = idSchema.safeParse(valor);
  if (!resultado.success) {
    throw new ValidationError("Datos de validación inválidos", [
      { campo, mensaje: "Debe ser un número entero positivo" },
    ]);
  }
  return resultado.data;
}
