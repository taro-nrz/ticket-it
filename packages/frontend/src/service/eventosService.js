import { cliente, datos } from "./api.js";

export const getCategorias = () => datos(cliente.get("/categoria"));

// ---------- EVENTOS ----------
// filtros: { texto, categoria, orden, dir, page, limit, ... }
export const getEventos = (filtros) => datos(cliente.get("/evento", { params: filtros }));
export const getEvento = (id) => datos(cliente.get(`/evento/${id}`));
export const getMisEventos = (page = 1) =>
  datos(cliente.get("/evento/mios", { params: { page, limit: 20 } }));
export const crearEvento = (evento) => datos(cliente.post("/evento", evento));
export const getEstadisticasEvento = (id) => datos(cliente.get(`/evento/${id}/estadisticas`));
export const actualizarEvento = (id, evento) => datos(cliente.put(`/evento/${id}`, evento));
export const cancelarEvento = (id, motivo) =>
  datos(cliente.post(`/evento/${id}/cancelar`, { motivo }));

// ---------- LISTA DE ESPERA (D-40) ----------
export const anotarseEnEspera = (eventoId, tipoEntradaId, cantidad) =>
  datos(cliente.post(`/evento/${eventoId}/espera`, { tipoEntradaId, cantidad }));
export const salirDeEspera = (eventoId, tipoEntradaId) =>
  cliente.delete(`/evento/${eventoId}/espera/${tipoEntradaId}`);
