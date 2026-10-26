import request from "supertest";
import {
  buildTestServer,
  COMPRADOR_JUAN,
  COMPRADORA_SOFIA,
  COMPRADORA_VALENTINA,
  ORGANIZADORA_LUCIA,
  auth,
} from "./utils/buildTestServer.js";

describe("M6 - Reseñas y reputación", () => {
  let app;
  beforeEach(async () => {
    app = await buildTestServer();
  });

  const reseniar = (eventoId, usuario, body) =>
    request(app).post(`/evento/${eventoId}/resenias`).set(auth(usuario)).send(body);

  describe("HU-11: puntuar y comentar con la entrada utilizada", () => {
    test("CA-1: un comprador con la entrada utilizada reseña el evento", async () => {
      const antes = await request(app).get("/compra/6").set(auth(COMPRADOR_JUAN));
      expect(antes.body.accionesDisponibles).toContain("RESENIAR");

      const res = await reseniar(7, COMPRADOR_JUAN, { puntuacion: 3, detalle: "Estuvo bien." });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        puntuacion: 3,
        detalle: "Estuvo bien.",
        comprador: { id: 4 },
        evento: { id: 7 },
      });

      const despues = await request(app).get("/compra/6").set(auth(COMPRADOR_JUAN));
      expect(despues.body.accionesDisponibles).not.toContain("RESENIAR");
    });

    test("CA-2: sin una compra utilizada en el evento responde 422", async () => {
      // Sofía tiene una compra CONFIRMADA del evento 1, no utilizada
      const res = await reseniar(1, COMPRADORA_SOFIA, { puntuacion: 5, detalle: "Genial" });
      expect(res.status).toBe(422);
    });

    test("CA-3: reseñar dos veces el mismo evento responde 409", async () => {
      const res = await reseniar(7, COMPRADORA_SOFIA, { puntuacion: 4, detalle: "Otra vez" });
      expect(res.status).toBe(409);
    });

    test("CA-4: la puntuación debe ser un entero de 1 a 5", async () => {
      for (const puntuacion of [0, 6, 3.5]) {
        const res = await reseniar(7, COMPRADOR_JUAN, { puntuacion, detalle: "Ok" });
        expect(res.status).toBe(400);
      }
    });

    test("CA-5: un organizador no puede reseñar", async () => {
      const res = await reseniar(7, ORGANIZADORA_LUCIA, { puntuacion: 5, detalle: "Ok" });
      expect(res.status).toBe(403);
    });

    test("un evento inexistente responde 404", async () => {
      const res = await reseniar(99, COMPRADOR_JUAN, { puntuacion: 5, detalle: "Ok" });
      expect(res.status).toBe(404);
    });
  });

  describe("HU-12: reseñas del organizador antes de comprar", () => {
    test("CA-1: lista las reseñas de los eventos del organizador con su reputación", async () => {
      const res = await request(app).get("/usuario/1/resenias");
      expect(res.status).toBe(200);
      expect(res.body.organizador).toMatchObject({
        id: 1,
        puntajePromedio: 4.5,
        cantidadResenias: 2,
      });
      expect(res.body.data.map((resenia) => resenia.evento.nombre)).toEqual([
        "Recital Acústico en el Konex",
        "Festival de Verano 2026",
      ]);
    });

    test("CA-2: el detalle de un evento futuro muestra las reseñas de eventos anteriores del organizador", async () => {
      const res = await request(app).get("/evento/1");
      expect(res.body.ultimasResenias.map((resenia) => resenia.comprador.nombre)).toEqual([
        "Sofía",
        "Valentina",
      ]);
    });

    test("CA-3: una nueva reseña actualiza la reputación y el orden por puntaje", async () => {
      await reseniar(7, COMPRADOR_JUAN, { puntuacion: 1, detalle: "No me gustó" });
      const res = await request(app).get("/usuario/1/resenias");
      expect(res.body.organizador).toMatchObject({ puntajePromedio: 3.33, cantidadResenias: 3 });

      const eventos = await request(app).get("/evento?orden=puntaje&dir=desc");
      expect(eventos.body.data[0].organizador.id).toBe(2);
    });

    test("las reseñas de un evento se listan paginadas", async () => {
      const res = await request(app).get("/evento/8/resenias?limit=1");
      expect(res.body).toMatchObject({ total: 2, totalPaginas: 2 });
      expect(res.body.data[0].comprador.id).toBe(Number(COMPRADORA_VALENTINA));
    });

    test("un usuario que no es organizador responde 404", async () => {
      const res = await request(app).get("/usuario/3/resenias");
      expect(res.status).toBe(404);
    });
  });
});
