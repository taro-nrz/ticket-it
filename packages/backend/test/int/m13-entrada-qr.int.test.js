import request from "supertest";
import {
  auth,
  buildTestServer,
  COMPRADOR_JUAN,
  COMPRADORA_SOFIA,
  ORGANIZADOR_MARTIN,
  ORGANIZADORA_LUCIA,
} from "./utils/buildTestServer.js";

// Semilla: Juan tiene la entrada TK-JUAN-H7Y5 (CONFIRMADA) para el stand-up de hoy (evento 6, de Lucía)
const CODIGO_JUAN = "TK-JUAN-H7Y5";

describe("M13 - Entrada con QR y validación en la puerta (D-33)", () => {
  let app;
  beforeEach(async () => {
    app = await buildTestServer();
  });

  const validarEntrada = (eventoId, codigo, usuario = ORGANIZADORA_LUCIA) =>
    request(app).post(`/evento/${eventoId}/validar`).set(auth(usuario)).send({ codigo });

  test("al pagar, la compra recibe un código con formato TK-XXXX-XXXX que sólo ve el comprador", async () => {
    const compra = await request(app)
      .post("/compra")
      .set(auth(COMPRADORA_SOFIA))
      .send({ eventoId: 1, tipoEntradaId: 1, cantidad: 1 });
    expect(compra.body.codigo).toBeNull();

    const pagada = await request(app)
      .post(`/compra/${compra.body.id}/pagar`)
      .set(auth(COMPRADORA_SOFIA));
    expect(pagada.body.codigo).toMatch(/^TK-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);

    const vistaOrganizador = await request(app)
      .get(`/compra/${compra.body.id}`)
      .set(auth(ORGANIZADORA_LUCIA));
    expect(vistaOrganizador.body.codigo).toBeNull();
  });

  test("el organizador valida una entrada vigente y queda UTILIZADA", async () => {
    const res = await validarEntrada(6, CODIGO_JUAN);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ estado: "UTILIZADA", comprador: { nombre: "Juan" } });

    const comprador = await request(app).get(`/compra/${res.body.id}`).set(auth(COMPRADOR_JUAN));
    expect(comprador.body.estado).toBe("UTILIZADA");
  });

  test("acepta el código escrito a mano (minúsculas, espacios, sin guiones)", async () => {
    const res = await validarEntrada(6, "  tk juanh7y5 ");
    expect(res.status).toBe(200);
  });

  test("una entrada ya usada se rechaza diciendo de quién era", async () => {
    await validarEntrada(6, CODIGO_JUAN);
    const segunda = await validarEntrada(6, CODIGO_JUAN);
    expect(segunda.status).toBe(422);
    expect(segunda.body.message).toMatch(/ya se usó.*Juan Rodríguez/);
  });

  test("códigos inexistentes, de otro evento o antes del día del evento", async () => {
    expect((await validarEntrada(6, "TK-AAAA-BBBB")).status).toBe(404);
    expect((await validarEntrada(6, "cualquier cosa")).status).toBe(404);

    const otroEvento = await validarEntrada(1, CODIGO_JUAN);
    expect(otroEvento.status).toBe(422);
    expect(otroEvento.body.message).toMatch(/otro evento/);

    // La entrada de Sofía para el evento 1 (futuro): todavía no es el día
    const antes = await validarEntrada(1, "TK-SOFA-2N7D");
    expect(antes.status).toBe(422);
    expect(antes.body.message).toMatch(/a partir del día del evento/);
  });

  test("sólo el organizador del evento valida sus entradas", async () => {
    expect((await validarEntrada(6, CODIGO_JUAN, ORGANIZADOR_MARTIN)).status).toBe(403);
    expect((await validarEntrada(6, CODIGO_JUAN, COMPRADORA_SOFIA)).status).toBe(403);
    expect((await validarEntrada(6, "")).status).toBe(400);
  });
});
