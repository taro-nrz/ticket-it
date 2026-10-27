import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { MODO_MSW } from "../mocks/iniciar.js";
import { API_URL } from "./cliente.js";

// D-45: conexión de tiempo real (Socket.IO) con el token de la sesión. Hay UNA conexión para toda la app;
// las pantallas se suscriben a eventos con `escuchar` y la conexión se recrea al cambiar de sesión.
// Si se cae, Socket.IO reconecta solo; mientras tanto las pantallas vuelven al sondeo (polling).
let socket = null;
const oyentes = new Map(); // evento → Set de funciones
const oyentesEstado = new Set();

const avisarEstado = () => oyentesEstado.forEach((funcion) => funcion(estaConectado()));

export function conectarTiempoReal(token) {
  desconectarTiempoReal();
  // En el modo "sin backend" (MSW) no hay servidor de sockets: la app usa sólo el sondeo
  if (MODO_MSW === "sin-backend") return;
  socket = io(API_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
  });
  socket.onAny((evento, datos) => oyentes.get(evento)?.forEach((funcion) => funcion(datos)));
  socket.on("connect", avisarEstado);
  socket.on("disconnect", avisarEstado);
}

export function desconectarTiempoReal() {
  socket?.disconnect();
  socket = null;
  avisarEstado();
}

export const estaConectado = () => Boolean(socket?.connected);

// Devuelve la función para dejar de escuchar (para usar en el cleanup de un useEffect)
export function escuchar(evento, funcion) {
  if (!oyentes.has(evento)) oyentes.set(evento, new Set());
  oyentes.get(evento).add(funcion);
  return () => oyentes.get(evento)?.delete(funcion);
}

export function emitir(evento, datos) {
  return new Promise((resolve) => {
    if (!socket?.connected) return resolve({ ok: false });
    socket
      .timeout(5000)
      .emit(evento, datos, (error, respuesta) => resolve(error ? { ok: false } : respuesta));
  });
}

// Hook: si hay conexión en vivo ahora (para mostrarlo y para decidir si hace falta el sondeo)
export function useConexionEnVivo() {
  const [conectado, setConectado] = useState(estaConectado());
  useEffect(() => {
    oyentesEstado.add(setConectado);
    setConectado(estaConectado());
    return () => oyentesEstado.delete(setConectado);
  }, []);
  return conectado;
}
