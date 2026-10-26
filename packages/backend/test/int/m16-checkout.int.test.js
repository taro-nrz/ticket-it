import request from "supertest";
import {
  auth,
  buildTestServer,
  COMPRADORA_SOFIA,
  ORGANIZADORA_LUCIA,
  TARJETA_PRUEBA,
} from "./utils/buildTestServer.js";

// Semilla: la compra 2 de Sofía está PENDIENTE
describe("M16 - Checkout con tarjeta de prueba (D-37)", () => {
  let app;
  beforeEach(async () => {
    app = await buildTestServer();
  });

  const pagar = (body, compraId = 2) =>
    request(app).post(`/compra/${compraId}/pagar`).set(auth(COMPRADORA_SOFIA)).send(body);
  const conTarjeta = (cambios) => ({ tarjeta: { ...TARJETA_PRUEBA, ...cambios } });

  test("con una tarjeta aprobada confirma y guarda sólo la marca y los últimos 4 dígitos", async () => {
    const res = await pagar(conTarjeta());
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      estado: "CONFIRMADA",
      pago: { marca: "Visa", ultimos4: "4242" },
    });
    expect(JSON.stringify(res.body)).not.toMatch(/4242424242424242|"cvv"/);
  });

  test("una tarjeta rechazada deja la compra pendiente y explica el motivo", async () => {
    const res = await pagar(conTarjeta({ numero: "4000 0000 0000 0002" }));
    expect(res.status).toBe(422);
    expect(res.body.message).toBe("Pago rechazado: la tarjeta no tiene fondos suficientes");
    const compra = await request(app).get("/compra/2").set(auth(COMPRADORA_SOFIA));
    expect(compra.body.estado).toBe("PENDIENTE");
  });

  test("valida número (Luhn), vencimiento, CVV y titular", async () => {
    const campos = async (cambios) =>
      (await pagar(conTarjeta(cambios))).body.errores?.map((error) => error.campo);
    expect(await campos({ numero: "4242 4242 4242 4241" })).toEqual(["tarjeta.numero"]);
    expect(await campos({ vencimiento: "13/30" })).toEqual(["tarjeta.vencimiento"]);
    expect(await campos({ vencimiento: "01/20" })).toEqual(["tarjeta.vencimiento"]);
    expect(await campos({ cvv: "12" })).toEqual(["tarjeta.cvv"]);
    expect(await campos({ titular: "" })).toEqual(["tarjeta.titular"]);
  });

  test("sin tarjeta responde 400 si la compra no es gratis", async () => {
    const res = await pagar({});
    expect(res.status).toBe(400);
    expect(res.body.errores[0].campo).toBe("tarjeta");
  });

  test("una compra ya pagada no se vuelve a cobrar", async () => {
    const res = await pagar(conTarjeta(), 1);
    expect(res.status).toBe(422);
  });

  test("el organizador no ve los datos del pago", async () => {
    // Compra 1: pagada por Sofía, de un evento de Lucía
    const vista = await request(app).get("/compra/1").set(auth(ORGANIZADORA_LUCIA));
    expect(vista.status).toBe(200);
    expect(vista.body.pago).toBeNull();
    const propia = await request(app).get("/compra/1").set(auth(COMPRADORA_SOFIA));
    expect(propia.body.pago).toEqual({ marca: "Visa", ultimos4: "4242" });
  });

  test("una entrada gratis se confirma sin tarjeta", async () => {
    const publicado = await request(app)
      .post("/evento")
      .set(auth(ORGANIZADORA_LUCIA))
      .send({
        nombre: "Charla abierta",
        descripcion: "Una charla gratuita para todo público.",
        categoriaId: 4,
        fecha: new Date(Date.now() + 10 * 864e5).toISOString(),
        lugar: "Centro Cultural",
        direccion: "Sarmiento 1551, CABA",
        tiposEntrada: [{ nombre: "General", precio: 0, cupo: 50 }],
      });
    const compra = await request(app)
      .post("/compra")
      .set(auth(COMPRADORA_SOFIA))
      .send({ eventoId: publicado.body.id, tipoEntradaId: 1, cantidad: 2 });
    const res = await pagar({}, compra.body.id);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ estado: "CONFIRMADA", pago: null });
  });
});
