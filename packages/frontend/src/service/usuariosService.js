import { cliente, datos } from "./api.js";

export const actualizarPerfil = (cambios) => datos(cliente.patch("/usuario/me", cambios));

// ---------- FAVORITOS ----------
export const getFavoritos = () =>
  datos(cliente.get("/usuario/me/favoritos", { params: { limit: 100 } }));
export const agregarFavorito = (eventoId) =>
  datos(cliente.post(`/usuario/me/favoritos/${eventoId}`));
export const quitarFavorito = (eventoId) => cliente.delete(`/usuario/me/favoritos/${eventoId}`);
