import request from "supertest";
import {
  AHORA,
  auth,
  buildTestServerConReloj,
  COMPRADORA_SOFIA,
  TARJETA_PRUEBA,
} from "./utils/buildTestServer.js";

const MINUTO = 60 * 1000;

// Semilla: la compra 2 de Sofía (Hamlet, evento 2) está PENDIENTE desde hace 5 minutos
describe("M15 - Reserva con vencimiento (D-36)", () => {
  let app;
  let reloj;
  beforeEach(async () => {
    ({ app, reloj } = await buildTestServerConReloj());
  });

  const verCompra = (id) => request(app).get(`/compra/${id}`).set(auth(COMPRADORA_SOFIA));
  const disponiblesHamlet = async () =>
    (await request(app).get("/evento/2")).body.tiposEntrada[0].disponibles;
  const comprar = (body) => request(app).post("/compra").set(auth(COMPRADORA_SOFIA)).send(body);

  test("una compra nueva informa hasta cuándo se puede pagar (15 minutos)", async () => {
    const res = await comprar({ eventoId: 1, tipoEntradaId: 1, cantidad: 1 });
    expect(new Date(res.body.venceEn).getTime() - AHORA.getTime()).toBe(15 * MINUTO);
    expect(res.body.accionesDisponibles).toContain("PAGAR");
  });

  test("al pasar el plazo la reserva vence sola y libera el cupo", async () => {
    const antes = await disponiblesHamlet();
    reloj.fecha = new Date(AHORA.getTime() + 11 * MINUTO); // la reserva tenía 5 minutos

    const compra = await verCompra(2);
    expect(compra.body.estado).toBe("VENCIDA");
    expect(compra.body.venceEn).toBeNull();
    expect(compra.body.accionesDisponibles).not.toContain("PAGAR");
    expect(compra.body.historial.at(-1)).toMatchObject({ estado: "VENCIDA", quien: null });
    expect(await disponiblesHamlet()).toBe(antes + 1);
  });

  test("antes del plazo sigue pendiente y se puede pagar", async () => {
    reloj.fecha = new Date(AHORA.getTime() + 9 * MINUTO);
    expect((await verCompra(2)).body.estado).toBe("PENDIENTE");
    const pago = await request(app)
      .post("/compra/2/pagar")
      .set(auth(COMPRADORA_SOFIA))
      .send({ tarjeta: TARJETA_PRUEBA });
    expect(pago.status).toBe(200);
    expect(pago.body.estado).toBe("CONFIRMADA");
  });

  test("pagar una reserva vencida responde 422 con un mensaje claro", async () => {
    reloj.fecha = new Date(AHORA.getTime() + 20 * MINUTO);
    const pago = await request(app)
      .post("/compra/2/pagar")
      .set(auth(COMPRADORA_SOFIA))
      .send({ tarjeta: TARJETA_PRUEBA });
    expect(pago.status).toBe(422);
    expect(pago.body.message).toMatch(/venció/);
  });

  test("una compra pagada no vence", async () => {
    reloj.fecha = new Date(AHORA.getTime() + 60 * MINUTO);
    expect((await verCompra(1)).body.estado).toBe("CONFIRMADA");
  });

  test("al vencer se avisa al comprador", async () => {
    reloj.fecha = new Date(AHORA.getTime() + 11 * MINUTO);
    await verCompra(2);
    const [ultima] = (await request(app).get("/notificacion").set(auth(COMPRADORA_SOFIA))).body
      .data;
    expect(ultima).toMatchObject({ tipo: "RESERVA_VENCIDA", link: "/evento/2" });
  });

  test("la vencida aparece filtrando por estado", async () => {
    reloj.fecha = new Date(AHORA.getTime() + 11 * MINUTO);
    const res = await request(app)
      .get("/compra/mias")
      .query({ estado: "VENCIDA" })
      .set(auth(COMPRADORA_SOFIA));
    expect(res.body.data.map((compra) => compra.id)).toEqual([2]);
  });
});
