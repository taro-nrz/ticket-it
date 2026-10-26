import { EstadoCompra } from "../models/entities/estadoCompra.js";
import { eventoReferenciaDTO } from "./eventoDTO.js";
import { usuarioResumenDTO } from "./usuarioDTO.js";

export function cambioEstadoDTO(cambio) {
  return {
    estado: cambio.estado,
    // null cuando el cambio lo hizo el sistema (ej. una reserva que venció)
    quien: cambio.quien ? usuarioResumenDTO(cambio.quien) : null,
    fechaHora: cambio.fechaHora,
  };
}

export function mensajeDTO(mensaje) {
  return {
    id: mensaje.id,
    usuario: usuarioResumenDTO(mensaje.usuario),
    mensaje: mensaje.mensaje,
    enviado: mensaje.enviado,
  };
}

// Vista de una compra para un usuario en particular (las acciones dependen de quién la mira)
export function compraDTO(compra, { usuario, ahora, yaResenio = false, conDetalle = false }) {
  const dto = {
    id: compra.id,
    evento: eventoReferenciaDTO(compra.evento),
    comprador: usuarioResumenDTO(compra.comprador),
    tipoEntrada: {
      id: compra.tipoEntrada.id,
      nombre: compra.tipoEntrada.nombre,
      precio: compra.tipoEntrada.precio,
    },
    cantidad: compra.cantidad,
    // D-38: subtotal y descuento por cupón (si no hubo cupón, descuento 0 y subtotal = total)
    subtotal: compra.subtotal,
    descuento: compra.descuento,
    cupon: compra.cupon
      ? { codigo: compra.cupon.codigo, descripcion: compra.cupon.descripcion() }
      : null,
    total: compra.total,
    estado: compra.estado,
    fechaCompra: compra.fechaCompra,
    // D-36: hasta cuándo se puede pagar (sólo mientras está pendiente)
    venceEn: compra.estado === EstadoCompra.PENDIENTE ? compra.venceEn : null,
    // HU-05: días que faltan sólo si está confirmada
    diasRestantes:
      compra.estado === EstadoCompra.CONFIRMADA ? compra.diasParaElEvento(ahora) : null,
    cantidadMensajes: compra.mensajes.length,
    mensajesSinLeer: compra.mensajesSinLeerPara(usuario),
    // D-33: el código de la entrada sólo lo ve su dueño (es lo que se muestra como QR en la puerta)
    codigo: compra.esDelComprador(usuario) ? compra.codigo : null,
    // D-37: con qué se pagó (sólo marca y últimos 4 dígitos, y sólo para el comprador)
    pago:
      compra.pago && compra.esDelComprador(usuario)
        ? { marca: compra.pago.marca, ultimos4: compra.pago.ultimos4 }
        : null,
    accionesDisponibles: compra.accionesDisponiblesPara(usuario, ahora, { yaResenio }),
  };
  if (conDetalle) {
    dto.organizador = usuarioResumenDTO(compra.evento.organizador);
    dto.historial = compra.historial.map(cambioEstadoDTO);
  }
  return dto;
}
