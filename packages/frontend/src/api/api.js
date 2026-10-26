import { cliente } from "./cliente.js";

// Una función por endpoint (como src/api/api.js de clase). Devuelven directamente response.data.
const datos = (promesa) => promesa.then((response) => response.data);

// ---------- USUARIOS Y CATEGORÍAS ----------
// ---------- AUTENTICACIÓN (D-29) ----------
export const login = (email, password) => datos(cliente.post("/auth/login", { email, password }));
export const registrarse = (datosRegistro) => datos(cliente.post("/auth/registro", datosRegistro));
export const getUsuarioActual = () => datos(cliente.get("/auth/me"));
export const cambiarPassword = (passwordActual, passwordNueva) =>
  cliente.post("/auth/cambiar-password", { passwordActual, passwordNueva });
export const actualizarPerfil = (cambios) => datos(cliente.patch("/usuario/me", cambios));
export const getCategorias = () => datos(cliente.get("/categoria"));

// ---------- FAVORITOS ----------
export const getFavoritos = () =>
  datos(cliente.get("/usuario/me/favoritos", { params: { limit: 100 } }));
export const agregarFavorito = (eventoId) =>
  datos(cliente.post(`/usuario/me/favoritos/${eventoId}`));
export const quitarFavorito = (eventoId) => cliente.delete(`/usuario/me/favoritos/${eventoId}`);

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

// ---------- COMPRAS ----------
export const comprar = (eventoId, tipoEntradaId, cantidad, codigoCupon) =>
  datos(cliente.post("/compra", { eventoId, tipoEntradaId, cantidad, codigoCupon }));

// ---------- LISTA DE ESPERA (D-40) ----------
export const anotarseEnEspera = (eventoId, tipoEntradaId, cantidad) =>
  datos(cliente.post(`/evento/${eventoId}/espera`, { tipoEntradaId, cantidad }));
export const salirDeEspera = (eventoId, tipoEntradaId) =>
  cliente.delete(`/evento/${eventoId}/espera/${tipoEntradaId}`);

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

// ---------- MENSAJES ----------
export const getMensajes = (compraId, desde) =>
  datos(cliente.get(`/compra/${compraId}/mensajes`, { params: { desde } }));
export const enviarMensaje = (compraId, mensaje) =>
  datos(cliente.post(`/compra/${compraId}/mensajes`, { mensaje }));
export const marcarMensajesLeidos = (compraId) =>
  cliente.post(`/compra/${compraId}/mensajes/leidos`);

// ---------- NOTIFICACIONES (D-32) ----------
export const getNotificaciones = () =>
  datos(cliente.get("/notificacion", { params: { limit: 50 } }));
export const getResumenNotificaciones = () => datos(cliente.get("/notificacion/resumen"));
export const marcarNotificacionLeida = (id) => datos(cliente.post(`/notificacion/${id}/leer`));
export const marcarTodasLeidas = () => cliente.post("/notificacion/leer-todas");

// ---------- RESEÑAS ----------
export const reseniarEvento = (eventoId, puntuacion, detalle) =>
  datos(cliente.post(`/evento/${eventoId}/resenias`, { puntuacion, detalle }));
export const getReseniasDeEvento = (eventoId) =>
  datos(cliente.get(`/evento/${eventoId}/resenias`, { params: { limit: 50 } }));
export const getReseniasDeOrganizador = (organizadorId) =>
  datos(cliente.get(`/usuario/${organizadorId}/resenias`, { params: { limit: 50 } }));
