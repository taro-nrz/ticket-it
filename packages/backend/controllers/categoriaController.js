import { parsearId } from "../utils/validacion.js";

export class CategoriaController {
  constructor(categoriaService) {
    this.categoriaService = categoriaService;
  }

  async findAll(_req, res, next) {
    try {
      const categorias = await this.categoriaService.findAll();
      res.json(categorias);
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const categoria = await this.categoriaService.findById(parsearId(req.params.id));
      res.json(categoria);
    } catch (error) {
      next(error);
    }
  }
}
