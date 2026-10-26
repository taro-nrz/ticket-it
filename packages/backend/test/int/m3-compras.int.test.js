import request from "supertest";
import {
  buildTestServer,
  COMPRADOR_JUAN,
  COMPRADORA_SOFIA,
  ORGANIZADOR_MARTIN,
  ORGANIZADORA_LUCIA,
} from "./utils/buildTestServer.js";

describe("M3 - Compras", () => {
  let app;
  beforeEach(async () => {
    app = await buildTestServer();
  });

  const comprar = (usuario, body) =>
    request(app).post("/compra").set("x-user-id", usuario).send(body);

  describe("HU-04: comprar sin superar el cupo", () => {
    test("CA-1: crea la compra PENDIENTE, calcula el total y reserva el cupo", async () => {
      const res = await comprar(COMPRADORA_SOFIA, { eventoId: 1, tipoEntradaId: 2, cantidad: 3 });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        estado: "PENDIENTE",
        cantidad: 3,
        total: 75000,
        tipoEntrada: { id: 2, nombre: "Platea", precio: 25000 },
        accionesDisponibles: ["PAGAR", "CANCELAR", "CHATEAR"],
      });
      expect(res.body.historial).toHaveLength(1);

      const evento = await request(app).get("/evento/1");
      expect(evento.body.tiposEntrada[1]).toMatchObject({ vendidas: 3, disponibles: 197 });
    });

    test("CA-2: superar el cupo disponible responde 422", async () => {
      // Superclásico, Platea: cupo 2 con 1 vendida
      const res = await comprar(COMPRADORA_SOFIA, { eventoId: 5, tipoEntradaId: 2, cantidad: 2 });
      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/quedan 1/);
    });

    test("CA-3: se puede comprar exactamente el cupo restante y el tipo queda agotado", async () => {
      const res = await comprar(COMPRADORA_SOFIA, { eventoId: 5, tipoEntradaId: 2, cantidad: 1 });
      expect(res.status).toBe(201);
      const evento = await request(app).get("/evento/5");
      expect(evento.body.tiposEntrada[1].agotado).toBe(true);
    });

    test("CA-4: más de 10 entradas por compra responde 400", async () => {
      const res = await comprar(COMPRADORA_SOFIA, { eventoId: 1, tipoEntradaId: 1, cantidad: 11 });
      expect(res.status).toBe(400);
      expect(res.body.errores[0].campo).toBe("cantidad");
    });

    test("CA-5: un evento ya realizado responde 422", async () => {
      const res = await comprar(COMPRADORA_SOFIA, { eventoId: 7, tipoEntradaId: 1, cantidad: 1 });
      expect(res.status).toBe(422);
    });

    test("CA-6: tipo de entrada o evento inexistente responde 404", async () => {
      expect(
        (await comprar(COMPRADORA_SOFIA, { eventoId: 1, tipoEntradaId: 9, cantidad: 1 })).status,
      ).toBe(404);
      expect(
        (await comprar(COMPRADORA_SOFIA, { eventoId: 99, tipoEntradaId: 1, cantidad: 1 })).status,
      ).toBe(404);
    });

    test("CA-7: un organizador no puede comprar", async () => {
      const res = await comprar(ORGANIZADORA_LUCIA, { eventoId: 2, tipoEntradaId: 1, cantidad: 1 });
      expect(res.status).toBe(403);
    });
  });

  describe("HU-05: mis compras con estado y días restantes", () => {
    test("CA-1: lista las compras del comprador con su estado", async () => {
      const res = await request(app).get("/compra/mias").set("x-user-id", COMPRADORA_SOFIA);
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(5);
      const estados = res.body.data.map((compra) => compra.estado).sort();
      expect(estados).toEqual(["CANCELADA", "CONFIRMADA", "PENDIENTE", "REEMBOLSADA", "UTILIZADA"]);
    });

    test("CA-2: sólo las CONFIRMADAS informan los días que faltan", async () => {
      const res = await request(app).get("/compra/mias").set("x-user-id", COMPRADORA_SOFIA);
      for (const compra of res.body.data) {
        if (compra.estado === "CONFIRMADA") {
          expect(compra.diasRestantes).toBe(20);
        } else {
          expect(compra.diasRestantes).toBeNull();
        }
      }
    });

    test("CA-3: un evento de hoy informa 0 días restantes", async () => {
      const res = await request(app)
        .get("/compra/mias?estado=CONFIRMADA")
        .set("x-user-id", COMPRADOR_JUAN);
      const standup = res.body.data.find(
        (compra) => compra.evento.nombre === "Stand-up de los jueves",
      );
      expect(standup.diasRestantes).toBe(0);
    });

    test("CA-4: filtra por estado y ordena los próximos eventos primero", async () => {
      const res = await request(app)
        .get("/compra/mias?estado=UTILIZADA")
        .set("x-user-id", COMPRADOR_JUAN);
      expect(res.body.data.map((compra) => compra.evento.nombre)).toEqual([
        "Recital Acústico en el Konex",
        "Esperando la carroza",
      ]);

      const todas = await request(app).get("/compra/mias").set("x-user-id", COMPRADOR_JUAN);
      expect(todas.body.data[0].evento.nombre).toBe("Stand-up de los jueves");
    });

    test("un estado inválido responde 400", async () => {
      const res = await request(app)
        .get("/compra/mias?estado=OTRO")
        .set("x-user-id", COMPRADORA_SOFIA);
      expect(res.status).toBe(400);
    });
  });

  describe("Detalle de una compra", () => {
    test("el comprador y el organizador ven la compra con su historial", async () => {
      const comprador = await request(app).get("/compra/4").set("x-user-id", COMPRADORA_SOFIA);
      expect(comprador.status).toBe(200);
      expect(comprador.body.historial.map((cambio) => cambio.estado)).toEqual([
        "PENDIENTE",
        "CONFIRMADA",
        "CANCELADA",
        "REEMBOLSADA",
      ]);
      const organizador = await request(app).get("/compra/4").set("x-user-id", ORGANIZADORA_LUCIA);
      expect(organizador.status).toBe(200);
    });

    test("un tercero no puede ver la compra", async () => {
      const otroComprador = await request(app).get("/compra/1").set("x-user-id", COMPRADOR_JUAN);
      expect(otroComprador.status).toBe(403);
      const otroOrganizador = await request(app)
        .get("/compra/1")
        .set("x-user-id", ORGANIZADOR_MARTIN);
      expect(otroOrganizador.status).toBe(403);
    });
  });

  describe("HU-06: compras de un evento para el organizador", () => {
    test("CA-1: muestra compras, disponibilidad por tipo y resumen por estado", async () => {
      const res = await request(app).get("/evento/1/compras").set("x-user-id", ORGANIZADORA_LUCIA);
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.resumenPorEstado).toEqual({
        PENDIENTE: 1,
        CONFIRMADA: 1,
        UTILIZADA: 0,
        CANCELADA: 0,
        REEMBOLSADA: 0,
      });
      expect(res.body.disponibilidad.map((tipo) => [tipo.nombre, tipo.disponibles])).toEqual([
        ["General", 498],
        ["Platea", 200],
        ["VIP", 19],
      ]);
    });

    test("CA-2: filtra por estado", async () => {
      const res = await request(app)
        .get("/evento/1/compras?estado=CONFIRMADA")
        .set("x-user-id", ORGANIZADORA_LUCIA);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].comprador.nombre).toBe("Sofía");
    });

    test("CA-3: otro organizador no puede ver las compras del evento", async () => {
      const res = await request(app).get("/evento/1/compras").set("x-user-id", ORGANIZADOR_MARTIN);
      expect(res.status).toBe(403);
    });

    test("CA-4: una compra cancelada libera el cupo en la disponibilidad", async () => {
      await request(app).post("/compra/1/cancelar").set("x-user-id", COMPRADORA_SOFIA);
      const res = await request(app).get("/evento/1/compras").set("x-user-id", ORGANIZADORA_LUCIA);
      expect(res.body.disponibilidad[0].disponibles).toBe(500);
      expect(res.body.resumenPorEstado.REEMBOLSADA).toBe(1);
    });
  });
});
