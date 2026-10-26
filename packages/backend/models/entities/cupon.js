import { BusinessRuleError } from "../../error/appError.js";

// D-38: cupones de descuento de un evento. Igual que los descuentos de domain.js de clase, cada tipo de cupón
// sabe calcular su descuento (polimorfismo): CompraService no pregunta "qué tipo es", sólo pide el descuento.
export const TipoCupon = Object.freeze({
  PORCENTAJE: "PORCENTAJE",
  MONTO_FIJO: "MONTO_FIJO",
  DOS_POR_UNO: "DOS_POR_UNO",
});

export class Cupon {
  id;
  usos = 0;
  activo = true;

  constructor({ codigo, evento, usosMaximos = null, vence = null }) {
    this.codigo = Cupon.normalizarCodigo(codigo);
    this.evento = evento;
    this.usosMaximos = usosMaximos;
    this.vence = vence ? new Date(vence) : null;
  }

  static normalizarCodigo(codigo) {
    return String(codigo ?? "")
      .trim()
      .toUpperCase();
  }

  // Cada subclase define cuánto descuenta sobre el subtotal (precio unitario × cantidad)
  descuentoPara(_precioUnitario, _cantidad) {
    throw new Error("Cada tipo de cupón implementa su descuento");
  }

  descripcion() {
    throw new Error("Cada tipo de cupón implementa su descripción");
  }

  usosRestantes() {
    return this.usosMaximos === null ? null : Math.max(0, this.usosMaximos - this.usos);
  }

  // Motivo por el que no se puede usar, o null si se puede
  motivoNoDisponible(ahora) {
    if (!this.activo) return "El cupón ya no está activo";
    if (this.vence && ahora > this.vence) return "El cupón está vencido";
    if (this.usosRestantes() === 0) return "El cupón ya alcanzó su límite de usos";
    return null;
  }

  // Calcula el precio final sin usarlo todavía (para mostrar el resumen antes de comprar)
  aplicar(precioUnitario, cantidad, ahora) {
    const motivo = this.motivoNoDisponible(ahora);
    if (motivo) throw new BusinessRuleError(motivo);
    const subtotal = precioUnitario * cantidad;
    const descuento = Math.min(subtotal, Math.round(this.descuentoPara(precioUnitario, cantidad)));
    if (descuento <= 0) {
      throw new BusinessRuleError(this.motivoSinDescuento());
    }
    return { subtotal, descuento, total: subtotal - descuento };
  }

  motivoSinDescuento() {
    return "El cupón no aplica a esta compra";
  }

  usar() {
    this.usos += 1;
  }

  // Si la compra se cancela o vence, el uso vuelve a estar disponible
  liberarUso() {
    this.usos = Math.max(0, this.usos - 1);
  }

  desactivar() {
    this.activo = false;
  }
}

export class CuponPorcentaje extends Cupon {
  tipo = TipoCupon.PORCENTAJE;

  constructor({ porcentaje, ...datos }) {
    super(datos);
    this.porcentaje = porcentaje;
  }

  descuentoPara(precioUnitario, cantidad) {
    return (precioUnitario * cantidad * this.porcentaje) / 100;
  }

  descripcion() {
    return `${this.porcentaje}% de descuento`;
  }
}

export class CuponMontoFijo extends Cupon {
  tipo = TipoCupon.MONTO_FIJO;

  constructor({ monto, ...datos }) {
    super(datos);
    this.monto = monto;
  }

  descuentoPara() {
    return this.monto;
  }

  descripcion() {
    return `$ ${this.monto.toLocaleString("es-AR")} de descuento`;
  }
}

// Una entrada gratis cada dos (con 5 entradas, se pagan 3)
export class CuponDosPorUno extends Cupon {
  tipo = TipoCupon.DOS_POR_UNO;

  descuentoPara(precioUnitario, cantidad) {
    return Math.floor(cantidad / 2) * precioUnitario;
  }

  descripcion() {
    return "2×1: una entrada gratis cada dos";
  }

  motivoSinDescuento() {
    return "El 2×1 se aplica comprando al menos 2 entradas";
  }
}

const CLASES = {
  [TipoCupon.PORCENTAJE]: CuponPorcentaje,
  [TipoCupon.MONTO_FIJO]: CuponMontoFijo,
  [TipoCupon.DOS_POR_UNO]: CuponDosPorUno,
};

// Fábrica: a partir de los datos validados crea la subclase que corresponde
export function crearCupon({ tipo, ...datos }) {
  return new CLASES[tipo](datos);
}
