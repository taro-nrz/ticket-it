import { cliente, datos } from "./api.js";

// ---------- NOTIFICACIONES (D-32) ----------
export const getNotificaciones = () =>
  datos(cliente.get("/notificacion", { params: { limit: 50 } }));
export const getResumenNotificaciones = () => datos(cliente.get("/notificacion/resumen"));
export const marcarNotificacionLeida = (id) => datos(cliente.post(`/notificacion/${id}/leer`));
export const marcarTodasLeidas = () => cliente.post("/notificacion/leer-todas");
