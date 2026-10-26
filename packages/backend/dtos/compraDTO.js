import { EstadoCompra } from "../models/entities/estadoCompra.js";
import { eventoReferenciaDTO } from "./eventoDTO.js";
import { usuarioResumenDTO } from "./usuarioDTO.js";

export function cambioEstadoDTO(cambio) {
  return {
    estado: cambio.estado,
    quien: usuarioResumenDTO(cambio.quien),
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
    total: compra.total,
    estado: compra.estado,
    fechaCompra: compra.fechaCompra,
    // HU-05: días que faltan sólo si está confirmada
    diasRestantes:
      compra.estado === EstadoCompra.CONFIRMADA ? compra.diasParaElEvento(ahora) : null,
    cantidadMensajes: compra.mensajes.length,
    mensajesSinLeer: compra.mensajesSinLeerPara(usuario),
    // D-33: el código de la entrada sólo lo ve su dueño (es lo que se muestra como QR en la puerta)
    codigo: compra.esDelComprador(usuario) ? compra.codigo : null,
    accionesDisponibles: compra.accionesDisponiblesPara(usuario, ahora, { yaResenio }),
  };
  if (conDetalle) {
    dto.organizador = usuarioResumenDTO(compra.evento.organizador);
    dto.historial = compra.historial.map(cambioEstadoDTO);
  }
  return dto;
}
