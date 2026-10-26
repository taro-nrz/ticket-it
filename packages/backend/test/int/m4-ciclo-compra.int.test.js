import request from "supertest";
import {
  AHORA,
  buildTestServer,
  buildTestServerConReloj,
  COMPRADOR_JUAN,
  COMPRADORA_SOFIA,
  ORGANIZADOR_MARTIN,
  ORGANIZADORA_LUCIA,
  auth,
  TARJETA_PRUEBA,
} from "./utils/buildTestServer.js";

// Compras semilla usadas:
// 1 Sofía CONFIRMADA (evento 1, futuro)   2 Sofía PENDIENTE (evento 2, futuro)
// 3 Sofía CANCELADA                        5 Sofía UTILIZADA (evento 7, pasado)
// 8 Juan CONFIRMADA (evento 6, hoy)        9 Juan CONFIRMADA (evento 4, futuro)
describe("M4 - Ciclo de vida de la compra", () => {
  let app;
  beforeEach(async () => {
    app = await buildTestServer();
  });

  // D-37: pagar requiere los datos de una tarjeta (de prueba)
  const accion = (compraId, nombre, usuario) =>
    request(app)
      .post(`/compra/${compraId}/${nombre}`)
      .set(auth(usuario))
      .send(nombre === "pagar" ? { tarjeta: TARJETA_PRUEBA } : {});

  describe("Pagar (PENDIENTE -> CONFIRMADA)", () => {
    test("el comprador paga una compra pendiente", async () => {
      const res = await accion(2, "pagar", COMPRADORA_SOFIA);
      expect(res.status).toBe(200);
      expect(res.body.estado).toBe("CONFIRMADA");
      expect(res.body.diasRestantes).toBe(10);
      expect(res.body.accionesDisponibles).toEqual(["CANCELAR", "TRANSFERIR", "CHATEAR"]);
    });

    test("pagar una compra ya confirmada responde 422", async () => {
      const res = await accion(1, "pagar", COMPRADORA_SOFIA);
      expect(res.status).toBe(422);
    });

    test("otro comprador no puede pagar la compra", async () => {
      const res = await accion(2, "pagar", COMPRADOR_JUAN);
      expect(res.status).toBe(403);
    });
  });

  describe("Utilizar (CONFIRMADA -> UTILIZADA)", () => {
    test("el organizador marca utilizada una entrada el día del evento", async () => {
      const antes = await request(app).get("/compra/8").set(auth(ORGANIZADORA_LUCIA));
      expect(antes.body.accionesDisponibles).toContain("UTILIZAR");

      const res = await accion(8, "utilizar", ORGANIZADORA_LUCIA);
      expect(res.status).toBe(200);
      expect(res.body.estado).toBe("UTILIZADA");
      expect(res.body.historial.at(-1).quien.nombre).toBe("Lucía");
    });

    test("antes del día del evento responde 422", async () => {
      const res = await accion(9, "utilizar", ORGANIZADOR_MARTIN);
      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/día del evento/);
    });

    test("un organizador de otro evento no puede marcarla", async () => {
      const res = await accion(8, "utilizar", ORGANIZADOR_MARTIN);
      expect(res.status).toBe(403);
    });

    test("un comprador no puede marcarla", async () => {
      const res = await accion(8, "utilizar", COMPRADOR_JUAN);
      expect(res.status).toBe(403);
    });
  });

  describe("HU-09 / HU-10: cancelar y obtener el reembolso", () => {
    test("CA-1: cancelar una compra confirmada la reembolsa automáticamente", async () => {
      const res = await accion(1, "cancelar", COMPRADORA_SOFIA);
      expect(res.status).toBe(200);
      expect(res.body.estado).toBe("REEMBOLSADA");
      expect(res.body.historial.map((cambio) => cambio.estado)).toEqual([
        "PENDIENTE",
        "CONFIRMADA",
        "CANCELADA",
        "REEMBOLSADA",
      ]);
      expect(res.body.accionesDisponibles).toEqual(["CHATEAR"]);
    });

    test("CA-2: cancelar una compra pendiente queda CANCELADA (no hubo pago)", async () => {
      const res = await accion(2, "cancelar", COMPRADORA_SOFIA);
      expect(res.status).toBe(200);
      expect(res.body.estado).toBe("CANCELADA");
    });

    test("CA-3: una compra UTILIZADA no se puede cancelar", async () => {
      const res = await accion(5, "cancelar", COMPRADORA_SOFIA);
      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/utilizada/);
    });

    test("CA-4: no se puede cancelar si el evento ya se realizó", async () => {
      // Compra confirmada del evento de hoy (23:30), consultada después de que empezó
      const { app: appConReloj, reloj } = await buildTestServerConReloj();
      reloj.fecha = new Date(AHORA.getTime() + 9 * 60 * 60 * 1000);

      const res = await request(appConReloj).post("/compra/8/cancelar").set(auth(COMPRADOR_JUAN));
      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/ya se realizó/);
    });

    test("CA-5: una compra ya cancelada no se puede volver a cancelar", async () => {
      const res = await accion(3, "cancelar", COMPRADORA_SOFIA);
      expect(res.status).toBe(422);
    });

    test("CA-6: sólo el comprador puede cancelar", async () => {
      const otroComprador = await accion(1, "cancelar", COMPRADOR_JUAN);
      expect(otroComprador.status).toBe(403);
      const organizador = await accion(1, "cancelar", ORGANIZADORA_LUCIA);
      expect(organizador.status).toBe(403);
    });
  });

  test("el historial muestra los cambios de estado con quién y cuándo", async () => {
    const res = await request(app).get("/compra/5/historial").set(auth(COMPRADORA_SOFIA));
    expect(res.status).toBe(200);
    expect(res.body.map((cambio) => [cambio.estado, cambio.quien.nombre])).toEqual([
      ["PENDIENTE", "Sofía"],
      ["CONFIRMADA", "Sofía"],
      ["UTILIZADA", "Lucía"],
    ]);
  });
});
