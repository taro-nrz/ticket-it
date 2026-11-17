import { cliente, datos } from "./api.js";

// ---------- COMPRAS ----------
export const comprar = (eventoId, tipoEntradaId, cantidad) =>
  datos(cliente.post("/compra", { eventoId, tipoEntradaId, cantidad }));

export const getMisCompras = (estado) =>
  datos(cliente.get("/compra/mias", { params: { estado, limit: 100 } }));
export const getCompra = (id) => datos(cliente.get(`/compra/${id}`));
export const getComprasDeEvento = (eventoId, estado) =>
  datos(cliente.get(`/evento/${eventoId}/compras`, { params: { estado, limit: 100 } }));

// ---------- CICLO DE VIDA ----------
// D-37: con los datos de la tarjeta de prueba (sin tarjeta si la compra es gratis)
export const pagarCompra = (id, tarjeta) =>
  datos(cliente.post(`/compra/${id}/pagar`, tarjeta ? { tarjeta } : {}));
export const transferirCompra = (id, email) =>
  datos(cliente.post(`/compra/${id}/transferir`, { email }));
export const cancelarCompra = (id) => datos(cliente.post(`/compra/${id}/cancelar`));
export const utilizarCompra = (id) => datos(cliente.post(`/compra/${id}/utilizar`));
export const validarEntrada = (eventoId, codigo) =>
  datos(cliente.post(`/evento/${eventoId}/validar`, { codigo }));
