// D-32: notificaciones dentro de la app (como la rama evolutivo-7-notificaciones de clase, con destinatario)
export const EstadoNotificacion = Object.freeze({
  NO_LEIDA: "NO_LEIDA",
  LEIDA: "LEIDA",
});

export const TipoNotificacion = Object.freeze({
  NUEVA_VENTA: "NUEVA_VENTA",
  COMPRA_CANCELADA: "COMPRA_CANCELADA",
  NUEVO_MENSAJE: "NUEVO_MENSAJE",
  ENTRADA_UTILIZADA: "ENTRADA_UTILIZADA",
  EVENTO_CANCELADO: "EVENTO_CANCELADO",
  NUEVA_RESENIA: "NUEVA_RESENIA",
});

export class Notificacion {
  id;
  estado = EstadoNotificacion.NO_LEIDA;
  // Varias notificaciones iguales sin leer se agrupan (ej. 3 mensajes del mismo chat)
  cantidad = 1;

  constructor({ usuario, tipo, titulo, mensaje, link, fecha }) {
    this.usuario = usuario;
    this.tipo = tipo;
    this.titulo = titulo;
    this.mensaje = mensaje;
    this.link = link;
    this.fecha = new Date(fecha);
  }

  marcarComoLeida() {
    this.estado = EstadoNotificacion.LEIDA;
  }

  estaLeida() {
    return this.estado === EstadoNotificacion.LEIDA;
  }

  esDe(usuario) {
    return this.usuario.id === usuario.id;
  }

  // Se puede agrupar con una nueva si es del mismo tipo y destino y todavía no se leyó
  agrupaCon({ usuario, tipo, link }) {
    return !this.estaLeida() && this.usuario.id === usuario.id && this.tipo === tipo && this.link === link;
  }

  agrupar({ titulo, mensaje, fecha }) {
    this.cantidad += 1;
    this.titulo = titulo;
    this.mensaje = mensaje;
    this.fecha = new Date(fecha);
  }
}
