import { categoriaDTO } from "../dtos/usuarioDTO.js";
import { NotFoundError } from "../error/appError.js";

export class CategoriaService {
  constructor(categoriaRepository) {
    this.categoriaRepository = categoriaRepository;
  }

  async findAll() {
    const categorias = await this.categoriaRepository.findAll();
    return categorias.map(categoriaDTO);
  }

  async findById(id) {
    const categoria = await this.categoriaRepository.findById(id);
    if (!categoria) {
      throw new NotFoundError(`No existe la categoría con id ${id}`);
    }
    return categoriaDTO(categoria);
  }
}
