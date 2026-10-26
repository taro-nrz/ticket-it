import { ForbiddenError } from "../error/appError.js";

// Sólo para desarrollo / demo: vuelve a cargar los datos semilla en memoria
export class DevController {
  constructor(recargarDatos, email = null) {
    this.recargarDatos = recargarDatos;
    this.email = email;
  }

  // D-44: bandeja de los emails simulados (para la demo y los tests)
  async emails(_req, res, next) {
    try {
      if (process.env.NODE_ENV === "production") {
        throw new ForbiddenError("La bandeja de emails simulados no está disponible en producción");
      }
      res.json(this.email?.bandeja() ?? []);
    } catch (error) {
      next(error);
    }
  }

  async reset(_req, res, next) {
    try {
      if (process.env.NODE_ENV === "production") {
        throw new ForbiddenError("El reset de datos no está disponible en producción");
      }
      const resumen = await this.recargarDatos();
      res.json({ message: "Datos semilla recargados", ...resumen });
    } catch (error) {
      next(error);
    }
  }
}
