import request from "supertest";
import {
  buildTestServer,
  COMPRADORA_SOFIA,
  ORGANIZADOR_MARTIN,
  ORGANIZADORA_LUCIA,
  auth,
} from "./utils/buildTestServer.js";

describe("M8 - Mensajes sin leer y reseñas por evento", () => {
  let app;
  beforeEach(async () => {
    app = await buildTestServer();
  });

  const verCompra = (compraId, usuario) =>
    request(app).get(`/compra/${compraId}`).set(auth(usuario));
  const marcarLeidos = (compraId, usuario) =>
    request(app).post(`/compra/${compraId}/mensajes/leidos`).set(auth(usuario));

  describe("D-26: mensajes sin leer", () => {
    test("cada participante ve sólo los mensajes de la otra parte que no leyó", async () => {
      // Semilla: el último mensaje de la compra 1 es de Sofía, después de la respuesta de Lucía
      expect((await verCompra(1, ORGANIZADORA_LUCIA)).body.mensajesSinLeer).toBe(1);
      expect((await verCompra(1, COMPRADORA_SOFIA)).body.mensajesSinLeer).toBe(0);
    });

    test("un mensaje nuevo suma para el otro participante y no para quien lo envía", async () => {
      await request(app)
        .post("/compra/1/mensajes")
        .set(auth(COMPRADORA_SOFIA))
        .send({ mensaje: "¿Se puede llevar cámara?" });

      expect((await verCompra(1, ORGANIZADORA_LUCIA)).body.mensajesSinLeer).toBe(2);
      expect((await verCompra(1, COMPRADORA_SOFIA)).body.mensajesSinLeer).toBe(0);
    });

    test("marcar como leídos deja el contador en 0", async () => {
      const res = await marcarLeidos(1, ORGANIZADORA_LUCIA);
      expect(res.status).toBe(204);
      expect((await verCompra(1, ORGANIZADORA_LUCIA)).body.mensajesSinLeer).toBe(0);
    });

    test("leer el chat con GET no lo marca como leído (lo usa el sondeo)", async () => {
      await request(app).get("/compra/1/mensajes").set(auth(ORGANIZADORA_LUCIA));
      expect((await verCompra(1, ORGANIZADORA_LUCIA)).body.mensajesSinLeer).toBe(1);
    });

    test("sólo los participantes pueden marcar como leídos", async () => {
      expect((await marcarLeidos(1, ORGANIZADOR_MARTIN)).status).toBe(403);
      expect((await marcarLeidos(99, ORGANIZADORA_LUCIA)).status).toBe(404);
      expect((await request(app).post("/compra/1/mensajes/leidos")).status).toBe(401);
    });

    test("Mis eventos suma los mensajes sin leer de las compras de cada evento", async () => {
      const antes = await request(app).get("/evento/mios").set(auth(ORGANIZADORA_LUCIA));
      const total = (res) =>
        res.body.data.reduce((suma, evento) => suma + evento.ventas.mensajesSinLeer, 0);
      expect(total(antes)).toBeGreaterThanOrEqual(1);

      await marcarLeidos(1, ORGANIZADORA_LUCIA);
      const despues = await request(app).get("/evento/mios").set(auth(ORGANIZADORA_LUCIA));
      expect(total(despues)).toBe(total(antes) - 1);
    });
  });

  describe("D-28: reseñas de un evento", () => {
    test("las reseñas de un evento traen el evento y su promedio", async () => {
      const mios = await request(app).get("/evento/mios").set(auth(ORGANIZADORA_LUCIA));
      const conResenias = mios.body.data.find((evento) => evento.resenias.cantidadResenias > 0);
      expect(conResenias).toBeDefined();

      const res = await request(app).get(`/evento/${conResenias.id}/resenias`);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        evento: { id: conResenias.id, nombre: conResenias.nombre },
        puntajePromedio: conResenias.resenias.puntajePromedio,
        cantidadResenias: conResenias.resenias.cantidadResenias,
      });
      expect(res.body.data).toHaveLength(conResenias.resenias.cantidadResenias);
    });

    test("un evento sin reseñas no tiene puntaje", async () => {
      const res = await request(app).get("/evento/1/resenias");
      expect(res.body).toMatchObject({ puntajePromedio: null, cantidadResenias: 0, data: [] });
    });
  });
});
