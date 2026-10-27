import { io } from "socket.io-client";
import request from "supertest";
import {
  auth,
  buildTestServerConSockets,
  COMPRADOR_JUAN,
  COMPRADORA_SOFIA,
  ORGANIZADORA_LUCIA,
} from "./utils/buildTestServer.js";

// Compra 1: Sofía (compradora) y Lucía (organizadora) son las participantes del chat
describe("M24 - Tiempo real con WebSockets (D-45)", () => {
  let servidor;
  const sockets = [];

  beforeEach(async () => {
    servidor = await buildTestServerConSockets();
  });
  afterEach(async () => {
    sockets.splice(0).forEach((socket) => socket.disconnect());
    await servidor.cerrar();
  });

  // Conecta un cliente con el token de un usuario y espera a que la conexión quede establecida
  function conectar(usuarioId) {
    const token = auth(usuarioId).Authorization.replace("Bearer ", "");
    const socket = io(servidor.url, {
      auth: { token },
      transports: ["websocket"],
      reconnection: false,
    });
    sockets.push(socket);
    return new Promise((resolve, reject) => {
      socket.on("connect", () => resolve(socket));
      socket.on("connect_error", reject);
    });
  }
  const esperar = (socket, evento) =>
    new Promise((resolve) => socket.once(evento, (datos) => resolve(datos)));
  const unirse = (socket, compraId) =>
    new Promise((resolve) => socket.emit("chat:unirse", { compraId }, resolve));

  test("sin un token válido no se puede conectar", async () => {
    const socket = io(servidor.url, {
      auth: { token: "token-falso" },
      transports: ["websocket"],
      reconnection: false,
    });
    sockets.push(socket);
    const error = await new Promise((resolve) => socket.on("connect_error", resolve));
    expect(error.message).toMatch(/sesión no es válida/);
  });

  test("un mensaje enviado por REST le llega al instante a la otra parte del chat", async () => {
    const sofia = await conectar(COMPRADORA_SOFIA);
    expect(await unirse(sofia, 1)).toEqual({ ok: true });

    const llega = esperar(sofia, "chat:mensaje");
    await request(servidor.app)
      .post("/compra/1/mensajes")
      .set(auth(ORGANIZADORA_LUCIA))
      .send({ mensaje: "¡Las puertas abren a las 19!" });
    const { compraId, mensaje } = await llega;
    expect(compraId).toBe(1);
    expect(mensaje).toMatchObject({
      mensaje: "¡Las puertas abren a las 19!",
      usuario: { nombre: "Lucía" },
    });
  });

  test("quien no participa de la compra no puede unirse a su chat", async () => {
    const juan = await conectar(COMPRADOR_JUAN);
    const respuesta = await unirse(juan, 1);
    expect(respuesta.ok).toBe(false);
    expect(respuesta.message).toMatch(/No participás/);
  });

  test("'escribiendo…' llega a la otra parte, no a quien escribe", async () => {
    const sofia = await conectar(COMPRADORA_SOFIA);
    const lucia = await conectar(ORGANIZADORA_LUCIA);
    await unirse(sofia, 1);
    await unirse(lucia, 1);

    let ecoPropio = false;
    lucia.on("chat:escribiendo", () => (ecoPropio = true));
    const llega = esperar(sofia, "chat:escribiendo");
    lucia.emit("chat:escribiendo", { compraId: 1 });
    expect(await llega).toEqual({ compraId: 1, usuario: { id: 1, nombre: "Lucía" } });
    expect(ecoPropio).toBe(false);
  });

  test("sin unirse al chat no se puede mandar 'escribiendo…'", async () => {
    const sofia = await conectar(COMPRADORA_SOFIA);
    const juan = await conectar(COMPRADOR_JUAN);
    await unirse(sofia, 1);
    let recibio = false;
    sofia.on("chat:escribiendo", () => (recibio = true));
    juan.emit("chat:escribiendo", { compraId: 1 });
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(recibio).toBe(false);
  });

  test("las notificaciones y el contador llegan sin consultar", async () => {
    const lucia = await conectar(ORGANIZADORA_LUCIA);
    const notificacion = esperar(lucia, "notificaciones:nueva");
    const resumen = esperar(lucia, "notificaciones:resumen");
    await request(servidor.app)
      .post("/compra/1/mensajes")
      .set(auth(COMPRADORA_SOFIA))
      .send({ mensaje: "¿Hay guardarropa?" });
    expect(await notificacion).toMatchObject({ tipo: "NUEVO_MENSAJE" });
    expect((await resumen).noLeidas).toBeGreaterThanOrEqual(1);

    // Marcar todas como leídas actualiza el contador al instante
    const enCero = esperar(lucia, "notificaciones:resumen");
    await request(servidor.app).post("/notificacion/leer-todas").set(auth(ORGANIZADORA_LUCIA));
    expect(await enCero).toEqual({ noLeidas: 0 });
  });
});
