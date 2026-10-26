import { usuarioResumenDTO } from "./usuarioDTO.js";

export function reseniaDTO(resenia) {
  return {
    id: resenia.id,
    puntuacion: resenia.puntuacion,
    detalle: resenia.detalle,
    fecha: resenia.fecha,
    comprador: usuarioResumenDTO(resenia.comprador),
    evento: {
      id: resenia.evento.id,
      nombre: resenia.evento.nombre,
      fecha: resenia.evento.fecha,
    },
  };
}
