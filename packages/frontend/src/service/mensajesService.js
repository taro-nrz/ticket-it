import { cliente, datos } from "./api.js";

// ---------- MENSAJES ----------
export const getMensajes = (compraId, desde) =>
  datos(cliente.get(`/compra/${compraId}/mensajes`, { params: { desde } }));
export const enviarMensaje = (compraId, mensaje) =>
  datos(cliente.post(`/compra/${compraId}/mensajes`, { mensaje }));
export const marcarMensajesLeidos = (compraId) =>
  cliente.post(`/compra/${compraId}/mensajes/leidos`);
