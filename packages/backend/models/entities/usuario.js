import { RolUsuario } from "./rolUsuario.js";

export class Usuario {
  id;
  favoritos = [];

  constructor(nombre, apellido, rol) {
    this.nombre = nombre;
    this.apellido = apellido;
    this.rol = rol;
  }

  esOrganizador() {
    return this.rol === RolUsuario.ORGANIZADOR;
  }

  esComprador() {
    return this.rol === RolUsuario.COMPRADOR;
  }

  tieneFavorito(evento) {
    return this.favoritos.some((favorito) => favorito.id === evento.id);
  }

  // Idempotente: agregar un favorito que ya existe no lo duplica
  agregarFavorito(evento) {
    if (!this.tieneFavorito(evento)) {
      this.favoritos.push(evento);
    }
  }

  quitarFavorito(evento) {
    this.favoritos = this.favoritos.filter((favorito) => favorito.id !== evento.id);
  }
}
