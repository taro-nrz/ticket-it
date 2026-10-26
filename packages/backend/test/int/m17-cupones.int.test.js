import request from "supertest";
import {
  auth,
  buildTestServer,
  COMPRADORA_SOFIA,
  ORGANIZADOR_MARTIN,
  ORGANIZADORA_LUCIA,
} from "./utils/buildTestServer.js";

// Semilla: evento 1 (Lucía) con INDIE20 (20 %) e INDIE2X1 (2×1, 5 usos); General a $ 15.000
describe("M17 - Cupones de descuento (D-38)", () => {
  let app;
  beforeEach(async () => {
    app = await buildTestServer();
  });

  const comprar = (body) =>
    request(app)
      .post("/compra")
      .set(auth(COMPRADORA_SOFIA))
      .send({ eventoId: 1, tipoEntradaId: 1, ...body });
  const crearCupon = (body, eventoId = 1, usuario = ORGANIZADORA_LUCIA) =>
    request(app).post(`/evento/${eventoId}/cupones`).set(auth(usuario)).send(body);

  test("comprar con un cupón de porcentaje guarda subtotal, descuento y total", async () => {
    const res = await comprar({ cantidad: 2, codigoCupon: "indie20" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      subtotal: 30000,
      descuento: 6000,
      total: 24000,
      cupon: { codigo: "INDIE20", descripcion: "20% de descuento" },
    });
  });

  test("el 2×1 sobre 3 entradas cobra 2", async () => {
    const res = await comprar({ cantidad: 3, codigoCupon: "INDIE2X1" });
    expect(res.body).toMatchObject({ subtotal: 45000, descuento: 15000, total: 30000 });
  });

  test("vista previa del descuento antes de comprar", async () => {
    const res = await request(app)
      .get("/evento/1/cupones/validar")
      .query({ codigo: "INDIE20", tipoEntradaId: 1, cantidad: 1 })
      .set(auth(COMPRADORA_SOFIA));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ subtotal: 15000, descuento: 3000, total: 12000 });
  });

  test("un código inexistente o de otro evento responde 404 y no reserva cupo", async () => {
    const antes = (await request(app).get("/evento/1")).body.tiposEntrada[0].disponibles;
    expect((await comprar({ cantidad: 1, codigoCupon: "NOEXISTE" })).status).toBe(404);
    expect((await comprar({ cantidad: 1, codigoCupon: "RISAS" })).status).toBe(404);
    expect((await request(app).get("/evento/1")).body.tiposEntrada[0].disponibles).toBe(antes);
  });

  test("los usos se agotan y cancelar la compra devuelve el uso", async () => {
    await crearCupon({ tipo: "PORCENTAJE", codigo: "UNAVEZ", porcentaje: 50, usosMaximos: 1 });
    const primera = await comprar({ cantidad: 1, codigoCupon: "UNAVEZ" });
    expect(primera.status).toBe(201);
    const segunda = await comprar({ cantidad: 1, codigoCupon: "UNAVEZ" });
    expect(segunda.status).toBe(422);
    expect(segunda.body.message).toMatch(/límite de usos/);

    await request(app).post(`/compra/${primera.body.id}/cancelar`).set(auth(COMPRADORA_SOFIA));
    expect((await comprar({ cantidad: 1, codigoCupon: "UNAVEZ" })).status).toBe(201);
  });

  test("el organizador crea, lista y desactiva cupones de su evento", async () => {
    const creado = await crearCupon({ tipo: "MONTO_FIJO", codigo: "promo500", monto: 500 });
    expect(creado.status).toBe(201);
    expect(creado.body).toMatchObject({ codigo: "PROMO500", descripcion: "$ 500 de descuento" });

    const lista = await request(app).get("/evento/1/cupones").set(auth(ORGANIZADORA_LUCIA));
    expect(lista.body.map((cupon) => cupon.codigo)).toEqual(["INDIE20", "INDIE2X1", "PROMO500"]);

    const baja = await request(app)
      .delete(`/evento/1/cupones/${creado.body.id}`)
      .set(auth(ORGANIZADORA_LUCIA));
    expect(baja.body).toMatchObject({ activo: false, disponible: false });
    expect((await comprar({ cantidad: 1, codigoCupon: "PROMO500" })).status).toBe(422);
  });

  test("valida el cupón según su tipo", async () => {
    expect((await crearCupon({ tipo: "PORCENTAJE", codigo: "MAL", porcentaje: 150 })).status).toBe(
      400,
    );
    expect((await crearCupon({ tipo: "MONTO_FIJO", codigo: "SINMONTO" })).status).toBe(400);
    expect((await crearCupon({ tipo: "REGALO", codigo: "OTRO" })).status).toBe(400);
    expect((await crearCupon({ tipo: "DOS_POR_UNO", codigo: "con espacio" })).status).toBe(400);
    expect((await crearCupon({ tipo: "DOS_POR_UNO", codigo: "indie20" })).status).toBe(409);
  });

  test("sólo el organizador del evento administra sus cupones", async () => {
    expect(
      (await crearCupon({ tipo: "DOS_POR_UNO", codigo: "AJENO" }, 1, ORGANIZADOR_MARTIN)).status,
    ).toBe(403);
    expect((await request(app).get("/evento/1/cupones").set(auth(COMPRADORA_SOFIA))).status).toBe(
      403,
    );
  });
});
