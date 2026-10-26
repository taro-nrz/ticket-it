export function notificacionDTO(notificacion) {
  return {
    id: notificacion.id,
    tipo: notificacion.tipo,
    titulo: notificacion.titulo,
    mensaje: notificacion.mensaje,
    link: notificacion.link,
    fecha: notificacion.fecha,
    estado: notificacion.estado,
    cantidad: notificacion.cantidad,
  };
}
