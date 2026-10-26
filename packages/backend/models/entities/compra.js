import { BusinessRuleError } from "../../error/appError.js";
import { diasCalendarioEntre } from "../../utils/reloj.js";
import { CambioEstadoCompra } from "./cambioEstadoCompra.js";
import { EstadoCompra, TRANSICIONES_VALIDAS } from "./estadoCompra.js";
import { Mensaje } from "./mensaje.js";

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
  // D-26: hasta cuándo leyó el chat cada participante (id de usuario -> fecha)
  ultimaLectura = new Map();

  // La reserva del cupo la hace el service antes de crear la compra
  constructor(comprador, evento, tipoEntrada, cantidad, fechaCompra) {
    this.comprador = comprador;
    this.evento = evento;
    this.tipoEntrada = tipoEntrada;
    this.cantidad = cantidad;
    this.total = tipoEntrada.precio * cantidad;
    this.fechaCompra = new Date(fechaCompra);
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

  pagar(quien, ahora) {
    if (this.evento.yaSeRealizo(ahora)) {
      throw new BusinessRuleError("No se puede pagar una compra de un evento que ya se realizó");
    }
    this.actualizarEstado(EstadoCompra.CONFIRMADA, quien, ahora);
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
  cancelar(quien, ahora) {
    if (this.estado === EstadoCompra.UTILIZADA) {
      throw new BusinessRuleError("No se puede cancelar una compra cuya entrada ya fue utilizada");
    }
    if (this.evento.yaSeRealizo(ahora)) {
      throw new BusinessRuleError("No se puede cancelar una compra de un evento que ya se realizó");
    }
    const estabaPagada = this.estado === EstadoCompra.CONFIRMADA;
    this.actualizarEstado(EstadoCompra.CANCELADA, quien, ahora);
    this.tipoEntrada.liberar(this.cantidad);
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
      if (this.estado === EstadoCompra.PENDIENTE && !this.evento.yaSeRealizo(ahora)) {
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
