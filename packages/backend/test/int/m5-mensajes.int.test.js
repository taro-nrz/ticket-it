import request from "supertest";
import {
  AHORA,
  buildTestServer,
  COMPRADOR_JUAN,
  COMPRADORA_SOFIA,
  ORGANIZADOR_MARTIN,
  ORGANIZADORA_LUCIA,
  auth,
} from "./utils/buildTestServer.js";

describe("M5 - Mensajería de la compra", () => {
  let app;
  beforeEach(async () => {
    app = await buildTestServer();
  });

  const enviar = (compraId, usuario, mensaje) =>
    request(app).post(`/compra/${compraId}/mensajes`).set(auth(usuario)).send({ mensaje });

  test("HU-07: el comprador envía un mensaje", async () => {
    const res = await enviar(1, COMPRADORA_SOFIA, "¿Hay estacionamiento cerca?");
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: 4,
      mensaje: "¿Hay estacionamiento cerca?",
      usuario: { id: 3, rol: "COMPRADOR" },
    });
  });

  test("HU-08: el organizador responde y ambos ven la conversación en orden", async () => {
    await enviar(1, COMPRADORA_SOFIA, "¿Hay estacionamiento cerca?");
    await enviar(1, ORGANIZADORA_LUCIA, "Sí, sobre Av. del Libertador.");

    const res = await request(app).get("/compra/1/mensajes").set(auth(COMPRADORA_SOFIA));
    expect(res.status).toBe(200);
    expect(res.body.map((mensaje) => mensaje.usuario.nombre)).toEqual([
      "Sofía",
      "Lucía",
      "Sofía",
      "Sofía",
      "Lucía",
    ]);
  });

  test("se puede chatear en cualquier estado de la compra", async () => {
    // compra 3: CANCELADA, compra 5: UTILIZADA
    expect((await enviar(3, COMPRADORA_SOFIA, "¿Cuándo veo el reintegro?")).status).toBe(201);
    expect((await enviar(5, ORGANIZADORA_LUCIA, "¡Gracias por venir!")).status).toBe(201);
  });

  test("desde devuelve sólo los mensajes nuevos (polling)", async () => {
    await enviar(1, COMPRADORA_SOFIA, "Mensaje nuevo");
    const res = await request(app)
      .get("/compra/1/mensajes")
      .query({ desde: new Date(AHORA.getTime() - 60 * 1000).toISOString() })
      .set(auth(ORGANIZADORA_LUCIA));
    expect(res.body.map((mensaje) => mensaje.mensaje)).toEqual(["Mensaje nuevo"]);
  });

  test("un mensaje vacío o sólo con espacios responde 400", async () => {
    expect((await enviar(1, COMPRADORA_SOFIA, "   ")).status).toBe(400);
    expect((await enviar(1, COMPRADORA_SOFIA, "x".repeat(1001))).status).toBe(400);
  });

  test("un usuario que no participa de la compra no puede leer ni escribir", async () => {
    expect((await enviar(1, COMPRADOR_JUAN, "Hola")).status).toBe(403);
    const leer = await request(app).get("/compra/1/mensajes").set(auth(ORGANIZADOR_MARTIN));
    expect(leer.status).toBe(403);
  });

  test("una compra inexistente responde 404", async () => {
    expect((await enviar(99, COMPRADORA_SOFIA, "Hola")).status).toBe(404);
  });

  test("la compra informa la cantidad de mensajes", async () => {
    const res = await request(app).get("/compra/1").set(auth(COMPRADORA_SOFIA));
    expect(res.body.cantidadMensajes).toBe(3);
  });
});
