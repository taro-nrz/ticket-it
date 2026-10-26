export class Mensaje {
  id;

  constructor(usuario, mensaje, enviado) {
    this.usuario = usuario;
    this.mensaje = mensaje;
    this.enviado = new Date(enviado);
  }
}
