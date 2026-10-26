import request from "supertest";
import {
  AHORA,
  buildTestServer,
  COMPRADORA_SOFIA,
  ORGANIZADORA_LUCIA,
} from "./utils/buildTestServer.js";

const eventoValido = () => ({
  nombre: "Recital de Rock Nacional",
  descripcion: "Una noche con los grandes clásicos del rock nacional.",
  categoriaId: 1,
  fecha: new Date(AHORA.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  lugar: "Luna Park",
  direccion: "Av. Madero 420, CABA",
  multimedia: ["https://picsum.photos/seed/rock/800/450"],
  tiposEntrada: [
    { nombre: "General", descripcion: "Campo", precio: 20000, cupo: 1000 },
    { nombre: "VIP", precio: 60000, cupo: 50 },
  ],
});

describe("M2 - Eventos", () => {
  let app;
  beforeEach(async () => {
    app = await buildTestServer();
  });

  describe("HU-01: crear evento con tipos de entrada", () => {
    test("CA-1: un organizador crea un evento con varios tipos de entrada", async () => {
      const res = await request(app)
        .post("/evento")
        .set("x-user-id", ORGANIZADORA_LUCIA)
        .send(eventoValido());
      expect(res.status).toBe(201);
      expect(res.body.id).toBe(10);
      expect(res.body.organizador).toMatchObject({ id: 1, nombre: "Lucía" });
      expect(res.body.tiposEntrada).toEqual([
        expect.objectContaining({
          id: 1,
          nombre: "General",
          precio: 20000,
          cupo: 1000,
          disponibles: 1000,
        }),
        expect.objectContaining({ id: 2, nombre: "VIP", precio: 60000, cupo: 50, disponibles: 50 }),
      ]);
      expect(res.body.precioDesde).toBe(20000);

      const detalle = await request(app).get("/evento/10");
      expect(detalle.status).toBe(200);
    });

    test("CA-2: un comprador no puede crear eventos", async () => {
      const res = await request(app)
        .post("/evento")
        .set("x-user-id", COMPRADORA_SOFIA)
        .send(eventoValido());
      expect(res.status).toBe(403);
    });

    test("CA-3: sin tipos de entrada responde 400", async () => {
      const res = await request(app)
        .post("/evento")
        .set("x-user-id", ORGANIZADORA_LUCIA)
        .send({ ...eventoValido(), tiposEntrada: [] });
      expect(res.status).toBe(400);
      expect(res.body.errores[0].campo).toBe("tiposEntrada");
    });

    test("CA-4: precio negativo o cupo no entero responde 400", async () => {
      const res = await request(app)
        .post("/evento")
        .set("x-user-id", ORGANIZADORA_LUCIA)
        .send({
          ...eventoValido(),
          tiposEntrada: [{ nombre: "General", precio: -1, cupo: 1.5 }],
        });
      expect(res.status).toBe(400);
      const campos = res.body.errores.map((error) => error.campo);
      expect(campos).toEqual(["tiposEntrada.0.precio", "tiposEntrada.0.cupo"]);
    });

    test("CA-5: tipos de entrada con nombre repetido responden 400", async () => {
      const res = await request(app)
        .post("/evento")
        .set("x-user-id", ORGANIZADORA_LUCIA)
        .send({
          ...eventoValido(),
          tiposEntrada: [
            { nombre: "General", precio: 1, cupo: 1 },
            { nombre: "general", precio: 2, cupo: 2 },
          ],
        });
      expect(res.status).toBe(400);
    });

    test("CA-6: una fecha pasada responde 400", async () => {
      const res = await request(app)
        .post("/evento")
        .set("x-user-id", ORGANIZADORA_LUCIA)
        .send({ ...eventoValido(), fecha: "2020-01-01T21:00:00.000Z" });
      expect(res.status).toBe(400);
      expect(res.body.errores[0].campo).toBe("fecha");
    });

    test("CA-7: una categoría inexistente responde 404", async () => {
      const res = await request(app)
        .post("/evento")
        .set("x-user-id", ORGANIZADORA_LUCIA)
        .send({ ...eventoValido(), categoriaId: 99 });
      expect(res.status).toBe(404);
    });

    test("CA-8: el mismo evento (nombre y fecha) dos veces responde 409", async () => {
      const evento = eventoValido();
      await request(app).post("/evento").set("x-user-id", ORGANIZADORA_LUCIA).send(evento);
      const res = await request(app)
        .post("/evento")
        .set("x-user-id", ORGANIZADORA_LUCIA)
        .send(evento);
      expect(res.status).toBe(409);
    });
  });

  describe("HU-02: búsqueda textual y por categoría", () => {
    test("CA-1: por defecto lista sólo eventos futuros, ordenados por fecha", async () => {
      const res = await request(app).get("/evento");
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(6);
      const fechas = res.body.data.map((evento) => new Date(evento.fecha));
      expect(fechas).toEqual([...fechas].sort((a, b) => a - b));
      expect(res.body.data.every((evento) => !evento.yaSeRealizo)).toBe(true);
    });

    test("CA-2: busca por texto sin distinguir mayúsculas ni acentos", async () => {
      const res = await request(app).get("/evento").query({ texto: "HAMLET" });
      expect(res.body.data.map((evento) => evento.nombre)).toEqual(["Hamlet"]);

      const sinAcento = await request(app).get("/evento").query({ texto: "san martin" });
      expect(sinAcento.body.data.map((evento) => evento.nombre)).toEqual(["Hamlet"]);
    });

    test("CA-3: filtra por categoría", async () => {
      const res = await request(app).get("/evento?categoria=2");
      expect(res.body.data.map((evento) => evento.nombre).sort()).toEqual([
        "Hamlet",
        "Stand-up de los jueves",
      ]);
    });

    test("CA-4: incluirPasados muestra también los eventos realizados", async () => {
      const res = await request(app).get("/evento?incluirPasados=true&limit=20");
      expect(res.body.total).toBe(9);
    });

    test("filtra por rango de precio (Evento.tuPrecioEstaEntre)", async () => {
      const res = await request(app).get("/evento?precioMin=60000&precioMax=80000");
      expect(res.body.data.map((evento) => evento.nombre)).toEqual(["Festival Primavera"]);
    });

    test("precioMin mayor que precioMax responde 400", async () => {
      const res = await request(app).get("/evento?precioMin=10&precioMax=5");
      expect(res.status).toBe(400);
    });

    test("pagina los resultados", async () => {
      const res = await request(app).get("/evento?page=2&limit=4");
      expect(res.body).toMatchObject({ pagina: 2, perPage: 4, total: 6, totalPaginas: 2 });
      expect(res.body.data).toHaveLength(2);
    });

    test("sin resultados devuelve una lista vacía", async () => {
      const res = await request(app).get("/evento?texto=inexistente");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ total: 0, totalPaginas: 0, data: [] });
    });
  });

  describe("HU-03: ordenar por precio, fecha y puntaje del organizador", () => {
    test("CA-1: ordena por precio ascendente y descendente", async () => {
      const asc = await request(app).get("/evento?orden=precio");
      const preciosAsc = asc.body.data.map((evento) => evento.precioDesde);
      expect(preciosAsc).toEqual([...preciosAsc].sort((a, b) => a - b));

      const desc = await request(app).get("/evento?orden=precio&dir=desc");
      const preciosDesc = desc.body.data.map((evento) => evento.precioDesde);
      expect(preciosDesc).toEqual([...preciosDesc].sort((a, b) => b - a));
    });

    test("CA-2: ordena por fecha descendente", async () => {
      const res = await request(app).get("/evento?orden=fecha&dir=desc");
      expect(res.body.data[0].nombre).toBe("Festival Primavera");
    });

    test("CA-3: ordena por puntaje del organizador", async () => {
      const res = await request(app).get("/evento?orden=puntaje&dir=desc");
      const puntajes = res.body.data.map((evento) => evento.organizador.puntajePromedio);
      expect(puntajes).toEqual([4.5, 4.5, 4.5, 3.5, 3.5, 3.5]);
    });

    test("un orden inválido responde 400", async () => {
      const res = await request(app).get("/evento?orden=nombre");
      expect(res.status).toBe(400);
    });
  });

  describe("Detalle y mis eventos", () => {
    test("el detalle incluye disponibilidad por tipo y reputación del organizador", async () => {
      const res = await request(app).get("/evento/5");
      expect(res.status).toBe(200);
      expect(res.body.tiposEntrada).toEqual([
        expect.objectContaining({ nombre: "Popular", cupo: 2000, vendidas: 0, disponibles: 2000 }),
        expect.objectContaining({ nombre: "Platea", cupo: 2, vendidas: 1, disponibles: 1 }),
      ]);
      expect(res.body.organizador).toMatchObject({ puntajePromedio: 3.5, cantidadResenias: 2 });
      expect(res.body.ultimasResenias).toHaveLength(2);
    });

    test("un evento inexistente responde 404 y un id inválido 400", async () => {
      expect((await request(app).get("/evento/999")).status).toBe(404);
      expect((await request(app).get("/evento/abc")).status).toBe(400);
    });

    test("el organizador ve sus eventos con el resumen de ventas", async () => {
      const res = await request(app).get("/evento/mios").set("x-user-id", ORGANIZADORA_LUCIA);
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(5);
      expect(res.body.data[0].nombre).toBe("Stand-up de los jueves");
      const indie = res.body.data.find((evento) => evento.id === 1);
      expect(indie.ventas).toEqual({
        cupoTotal: 720,
        entradasVendidas: 3,
        cantidadCompras: 2,
        comprasPendientes: 1,
        recaudacion: 30000,
        mensajesSinLeer: 1,
      });
    });

    test("un comprador no puede ver /evento/mios", async () => {
      const res = await request(app).get("/evento/mios").set("x-user-id", COMPRADORA_SOFIA);
      expect(res.status).toBe(403);
    });
  });
});
