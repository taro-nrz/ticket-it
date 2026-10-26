// Persistencia en memoria (requerimiento del enunciado). Todos los repositorios exponen una interfaz async,
// igual a la que tendría un repositorio sobre una base de datos: cambiar la persistencia sólo toca esta capa.
export class InMemoryRepository {
  #items = [];
  #proximoId = 1;

  async findAll() {
    return [...this.#items];
  }

  async findById(id) {
    return this.#items.find((item) => item.id === id) ?? null;
  }

  async findBy(criterio) {
    return this.#items.filter(criterio);
  }

  async findOneBy(criterio) {
    return this.#items.find(criterio) ?? null;
  }

  // Si la entidad no tiene id la crea; si lo tiene la reemplaza
  async save(entidad) {
    if (entidad.id === undefined || entidad.id === null) {
      entidad.id = this.#proximoId++;
      this.#items.push(entidad);
      return entidad;
    }
    const indice = this.#items.findIndex((item) => item.id === entidad.id);
    if (indice === -1) {
      this.#items.push(entidad);
      this.#proximoId = Math.max(this.#proximoId, entidad.id + 1);
    } else {
      this.#items[indice] = entidad;
    }
    return entidad;
  }

  async delete(id) {
    const indice = this.#items.findIndex((item) => item.id === id);
    if (indice === -1) return null;
    const [eliminado] = this.#items.splice(indice, 1);
    return eliminado;
  }

  async count() {
    return this.#items.length;
  }

  // Vacía el repositorio (usado al recargar los datos semilla)
  async clear() {
    this.#items = [];
    this.#proximoId = 1;
  }
}
