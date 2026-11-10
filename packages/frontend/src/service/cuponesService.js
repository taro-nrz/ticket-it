import { cliente, datos } from "./api.js";

// ---------- CUPONES (D-38) ----------
export const validarCupon = (eventoId, codigo, tipoEntradaId, cantidad) =>
  datos(
    cliente.get(`/evento/${eventoId}/cupones/validar`, {
      params: { codigo, tipoEntradaId, cantidad },
    }),
  );
export const getCupones = (eventoId) => datos(cliente.get(`/evento/${eventoId}/cupones`));
export const crearCupon = (eventoId, cupon) =>
  datos(cliente.post(`/evento/${eventoId}/cupones`, cupon));
export const desactivarCupon = (eventoId, cuponId) =>
  datos(cliente.delete(`/evento/${eventoId}/cupones/${cuponId}`));
