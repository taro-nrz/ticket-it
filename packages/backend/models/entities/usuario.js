import { RolUsuario } from "./rolUsuario.js";

export class Usuario {
  id;
  favoritos = [];

  // D-29: el hash de la contraseña lo calcula el AuthService (la entidad nunca ve la contraseña en claro)
  constructor(nombre, apellido, rol, email, passwordHash) {
    this.nombre = nombre;
    this.apellido = apellido;
    this.rol = rol;
    this.email = Usuario.normalizarEmail(email);
    this.passwordHash = passwordHash;
  }

  static normalizarEmail(email) {
    return email?.trim().toLowerCase();
  }

  // D-30: el usuario puede corregir su nombre y apellido (el email identifica la cuenta y no cambia)
  actualizarDatos({ nombre, apellido }) {
    if (nombre !== undefined) this.nombre = nombre;
    if (apellido !== undefined) this.apellido = apellido;
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
