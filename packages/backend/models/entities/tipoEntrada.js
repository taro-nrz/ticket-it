import { BusinessRuleError } from "../../error/appError.js";

export class TipoEntrada {
  id;
  // Entradas reservadas por compras activas (PENDIENTE, CONFIRMADA o UTILIZADA)
  vendidas = 0;
  // D-40: entradas liberadas que se guardan para quien está primero en la lista de espera
  retenidas = 0;

  constructor(nombre, descripcion, precio, cupo) {
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio = precio;
    this.cupo = cupo;
  }

  disponibles() {
    return this.cupo - this.vendidas - this.retenidas;
  }

  retener(cantidad) {
    this.retenidas += cantidad;
  }

  soltar(cantidad) {
    this.retenidas = Math.max(0, this.retenidas - cantidad);
  }

  hayCupoPara(cantidad) {
    return cantidad > 0 && cantidad <= this.disponibles();
  }

  reservar(cantidad) {
    if (!this.hayCupoPara(cantidad)) {
      throw new BusinessRuleError(
        `No hay cupo suficiente para "${this.nombre}": quedan ${this.disponibles()} entradas disponibles`,
      );
    }
    this.vendidas += cantidad;
  }

  liberar(cantidad) {
    this.vendidas = Math.max(0, this.vendidas - cantidad);
  }
}
