import { Server as SocketServer } from "socket.io";

// D-45: tiempo real con WebSockets (Socket.IO). Los mensajes se siguen ENVIANDO por REST (validación, permisos
// y persistencia en un solo lugar); el socket sólo EMPUJA lo nuevo a quien corresponde:
// - sala "usuario:<id>": notificaciones y contador de no leídas de esa persona
// - sala "compra:<id>": mensajes del chat y "escribiendo…" (sólo para los participantes de la compra)
// Si el servidor HTTP todavía no tiene sockets (ej. en los tests unitarios), emitir no hace nada.
export const EventosSocket = Object.freeze({
  UNIRSE_CHAT: "chat:unirse",
  SALIR_CHAT: "chat:salir",
  ESCRIBIENDO: "chat:escribiendo",
  MENSAJE: "chat:mensaje",
  NOTIFICACION: "notificaciones:nueva",
  RESUMEN: "notificaciones:resumen",
});

const salaUsuario = (id) => `usuario:${id}`;
const salaCompra = (id) => `compra:${id}`;

export class TiempoRealService {
  #io = null;

  // Se conecta al servidor HTTP al arrancar. `authService` valida el JWT del handshake y
  // `compraService` dice si alguien participa de una compra (el mismo control que la API REST).
  adjuntar(servidorHttp, { authService, compraService, allowedOrigins = "*" }) {
    this.#io = new SocketServer(servidorHttp, {
      cors: {
        origin: allowedOrigins === "*" ? "*" : allowedOrigins.split(",").map((o) => o.trim()),
      },
    });

    // Autenticación en el handshake: sin un token válido no hay conexión
    this.#io.use(async (socket, next) => {
      try {
        socket.data.usuario = await authService.usuarioDelToken(socket.handshake.auth?.token ?? "");
        next();
      } catch (error) {
        next(new Error(error.message));
      }
    });

    this.#io.on("connection", (socket) => {
      const usuario = socket.data.usuario;
      socket.join(salaUsuario(usuario.id));

      socket.on(EventosSocket.UNIRSE_CHAT, async ({ compraId } = {}, responder = () => {}) => {
        try {
          await compraService.obtenerParaParticipante(Number(compraId), usuario);
          socket.join(salaCompra(compraId));
          responder({ ok: true });
        } catch (error) {
          responder({ ok: false, message: error.message });
        }
      });

      socket.on(EventosSocket.SALIR_CHAT, ({ compraId } = {}) =>
        socket.leave(salaCompra(compraId)),
      );

      // "Escribiendo…": sólo a los demás que están en la sala, y sólo si este socket ya se unió (tiene permiso)
      socket.on(EventosSocket.ESCRIBIENDO, ({ compraId } = {}) => {
        if (!socket.rooms.has(salaCompra(compraId))) return;
        socket.to(salaCompra(compraId)).emit(EventosSocket.ESCRIBIENDO, {
          compraId: Number(compraId),
          usuario: { id: usuario.id, nombre: usuario.nombre },
        });
      });
    });
    return this.#io;
  }

  mensajeNuevo(compraId, mensaje) {
    this.#io?.to(salaCompra(compraId)).emit(EventosSocket.MENSAJE, { compraId, mensaje });
  }

  notificacion(usuarioId, notificacion) {
    this.#io?.to(salaUsuario(usuarioId)).emit(EventosSocket.NOTIFICACION, notificacion);
  }

  resumenNotificaciones(usuarioId, resumen) {
    this.#io?.to(salaUsuario(usuarioId)).emit(EventosSocket.RESUMEN, resumen);
  }

  cerrar() {
    this.#io?.close();
    this.#io = null;
  }
}

// Para services y tests que no usan tiempo real
export const SIN_TIEMPO_REAL = new Proxy({}, { get: () => () => {} });
