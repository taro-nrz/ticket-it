export class CambioEstadoCompra {
  constructor(compra, estado, quien, fechaHora) {
    this.compra = compra;
    this.estado = estado;
    this.quien = quien;
    this.fechaHora = new Date(fechaHora);
  }
}
