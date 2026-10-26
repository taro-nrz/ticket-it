import { BusinessRuleError } from "../../error/appError.js";
import { diasCalendarioEntre } from "../../utils/reloj.js";
import { CambioEstadoCompra } from "./cambioEstadoCompra.js";
import { EstadoCompra, TRANSICIONES_VALIDAS } from "./estadoCompra.js";
import { Mensaje } from "./mensaje.js";
import { generarCodigoEntrada } from "../../utils/codigo.js";

export const MINUTOS_RESERVA = 15;

export const AccionCompra = Object.freeze({
  PAGAR: "PAGAR",
  CANCELAR: "CANCELAR",
  UTILIZAR: "UTILIZAR",
  RESENIAR: "RESENIAR",
  CHATEAR: "CHATEAR",
});

export class Compra {
  id;
  mensajes = [];
  historial = [];
  codigo = null;
  // D-37: datos no sensibles del pago (marca, últimos 4 dígitos, autorización)
  pago = null;
  // D-26: hasta cuándo leyó el chat cada participante (id de usuario -> fecha)
  ultimaLectura = new Map();

  // La reserva del cupo la hace el service antes de crear la compra.
  // D-36: la compra nace PENDIENTE y hay que pagarla dentro del plazo de reserva (15 minutos por defecto).
  constructor(
    comprador,
    evento,
    tipoEntrada,
    cantidad,
    fechaCompra,
    { minutosReserva = MINUTOS_RESERVA, cupon = null, ahora = fechaCompra } = {},
  ) {
    this.comprador = comprador;
    this.evento = evento;
    this.tipoEntrada = tipoEntrada;
    this.cantidad = cantidad;
    // D-38: el precio se fija al comprar; con cupón se guarda el subtotal y el descuento aplicado
    const precio = cupon
      ? cupon.aplicar(tipoEntrada.precio, cantidad, new Date(ahora))
      : { subtotal: tipoEntrada.precio * cantidad, descuento: 0 };
    this.subtotal = precio.subtotal;
    this.descuento = precio.descuento;
    this.total = precio.subtotal - precio.descuento;
    this.cupon = cupon;
    cupon?.usar();
    this.fechaCompra = new Date(fechaCompra);
    this.venceEn = new Date(this.fechaCompra.getTime() + minutosReserva * 60 * 1000);
    this.estado = EstadoCompra.PENDIENTE;
    this.historial.push(
      new CambioEstadoCompra(this, EstadoCompra.PENDIENTE, comprador, this.fechaCompra),
    );
  }

  // Método del diagrama: valida la transición y registra el cambio en el historial
  actualizarEstado(nuevoEstado, quien, ahora) {
    if (!TRANSICIONES_VALIDAS[this.estado].includes(nuevoEstado)) {
      throw new BusinessRuleError(
        `No se puede pasar una compra de ${this.estado} a ${nuevoEstado}`,
      );
    }
    this.estado = nuevoEstado;
    this.historial.push(new CambioEstadoCompra(this, nuevoEstado, quien, ahora));
  }

  // D-33: al pagarse, la compra recibe el código de la entrada (el que se muestra como QR en la puerta)
  pagar(quien, ahora, { codigo = generarCodigoEntrada(), pago = null } = {}) {
    if (this.estado === EstadoCompra.VENCIDA || this.reservaVencida(ahora)) {
      throw new BusinessRuleError(
        "La reserva venció porque no se pagó a tiempo. Volvé a comprar las entradas.",
      );
    }
    if (this.evento.cancelado) {
      throw new BusinessRuleError("No se puede pagar una compra de un evento cancelado");
    }
    if (this.evento.yaSeRealizo(ahora)) {
      throw new BusinessRuleError("No se puede pagar una compra de un evento que ya se realizó");
    }
    this.actualizarEstado(EstadoCompra.CONFIRMADA, quien, ahora);
    this.codigo = codigo;
    this.pago = pago;
  }

  // D-36: una reserva pendiente vence al cumplirse el plazo sin pagar
  reservaVencida(ahora) {
    return this.estado === EstadoCompra.PENDIENTE && ahora >= this.venceEn;
  }

  // Lo hace el sistema (quien = null): libera el cupo para que otros puedan comprar
  vencer(ahora) {
    this.actualizarEstado(EstadoCompra.VENCIDA, null, ahora);
    this.tipoEntrada.liberar(this.cantidad);
    this.cupon?.liberarUso();
  }

  // Sólo una entrada pagada y todavía no usada sirve para entrar
  tieneEntradaVigente() {
    return this.estado === EstadoCompra.CONFIRMADA;
  }

  utilizar(quien, ahora) {
    if (!this.evento.esElDiaOPosterior(ahora)) {
      throw new BusinessRuleError(
        "Sólo se puede marcar una entrada como utilizada a partir del día del evento",
      );
    }
    this.actualizarEstado(EstadoCompra.UTILIZADA, quien, ahora);
  }

  // HU-10: cancelable si no está utilizada (ni ya cancelada/reembolsada) y el evento no se realizó
  puedeCancelarse(ahora) {
    const estadoCancelable = [EstadoCompra.PENDIENTE, EstadoCompra.CONFIRMADA].includes(
      this.estado,
    );
    return estadoCancelable && !this.evento.yaSeRealizo(ahora);
  }

  // HU-09: si estaba pagada se reembolsa automáticamente; en ambos casos se libera el cupo
  // D-31: `porCancelacionDelEvento` la usa el organizador al cancelar el evento entero
  cancelar(quien, ahora, { porCancelacionDelEvento = false } = {}) {
    if (this.estado === EstadoCompra.UTILIZADA) {
      throw new BusinessRuleError("No se puede cancelar una compra cuya entrada ya fue utilizada");
    }
    if (!porCancelacionDelEvento && this.evento.yaSeRealizo(ahora)) {
      throw new BusinessRuleError("No se puede cancelar una compra de un evento que ya se realizó");
    }
    const estabaPagada = this.estado === EstadoCompra.CONFIRMADA;
    this.actualizarEstado(EstadoCompra.CANCELADA, quien, ahora);
    this.tipoEntrada.liberar(this.cantidad);
    this.cupon?.liberarUso();
    if (estabaPagada) {
      this.actualizarEstado(EstadoCompra.REEMBOLSADA, quien, ahora);
    }
  }

  // Sólo tiene sentido para compras confirmadas (HU-05)
  diasParaElEvento(ahora) {
    return Math.max(0, diasCalendarioEntre(ahora, this.evento.fecha));
  }

  esDelComprador(usuario) {
    return this.comprador.id === usuario.id;
  }

  esParticipante(usuario) {
    return this.esDelComprador(usuario) || this.evento.esOrganizadoPor(usuario);
  }

  agregarMensaje(usuario, texto, ahora) {
    const mensaje = new Mensaje(usuario, texto, ahora);
    mensaje.id = this.mensajes.length + 1;
    this.mensajes.push(mensaje);
    // Quien escribe ya leyó la conversación hasta su propio mensaje
    this.marcarMensajesLeidos(usuario, ahora);
    return mensaje;
  }

  marcarMensajesLeidos(usuario, ahora) {
    this.ultimaLectura.set(usuario.id, new Date(ahora));
  }

  // Mensajes de la otra parte enviados después de la última lectura (los propios nunca cuentan)
  mensajesSinLeerPara(usuario) {
    const leidoHasta = this.ultimaLectura.get(usuario.id);
    return this.mensajes.filter(
      (mensaje) =>
        mensaje.usuario.id !== usuario.id && (!leidoHasta || mensaje.enviado > leidoHasta),
    ).length;
  }

  mensajesDesde(fecha) {
    if (!fecha) return this.mensajes;
    return this.mensajes.filter((mensaje) => mensaje.enviado > fecha);
  }

  // Acciones que el usuario puede realizar sobre la compra en este momento (para el front)
  accionesDisponiblesPara(usuario, ahora, { yaResenio = false } = {}) {
    const acciones = [];
    if (!this.esParticipante(usuario)) return acciones;

    if (this.esDelComprador(usuario)) {
      if (
        this.estado === EstadoCompra.PENDIENTE &&
        !this.reservaVencida(ahora) &&
        !this.evento.yaSeRealizo(ahora)
      ) {
        acciones.push(AccionCompra.PAGAR);
      }
      if (this.puedeCancelarse(ahora)) {
        acciones.push(AccionCompra.CANCELAR);
      }
      if (this.estado === EstadoCompra.UTILIZADA && !yaResenio) {
        acciones.push(AccionCompra.RESENIAR);
      }
    }

    if (
      this.evento.esOrganizadoPor(usuario) &&
      this.estado === EstadoCompra.CONFIRMADA &&
      this.evento.esElDiaOPosterior(ahora)
    ) {
      acciones.push(AccionCompra.UTILIZAR);
    }

    acciones.push(AccionCompra.CHATEAR);
    return acciones;
  }
}
