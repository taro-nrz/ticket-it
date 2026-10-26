import { ForbiddenError } from "../error/appError.js";

// Sólo para desarrollo / demo: vuelve a cargar los datos semilla en memoria
export class DevController {
  constructor(recargarDatos) {
    this.recargarDatos = recargarDatos;
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
