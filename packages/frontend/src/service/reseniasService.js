import { cliente, datos } from "./api.js";

// ---------- RESEÑAS ----------
export const reseniarEvento = (eventoId, puntuacion, detalle) =>
  datos(cliente.post(`/evento/${eventoId}/resenias`, { puntuacion, detalle }));
export const getReseniasDeEvento = (eventoId) =>
  datos(cliente.get(`/evento/${eventoId}/resenias`, { params: { limit: 50 } }));
export const getReseniasDeOrganizador = (organizadorId) =>
  datos(cliente.get(`/usuario/${organizadorId}/resenias`, { params: { limit: 50 } }));
