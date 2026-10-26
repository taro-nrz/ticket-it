export class Resenia {
  id;

  constructor(comprador, evento, detalle, puntuacion, fecha) {
    this.comprador = comprador;
    this.evento = evento;
    this.detalle = detalle;
    this.puntuacion = puntuacion;
    this.fecha = new Date(fecha);
  }
}
