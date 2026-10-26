import request from "supertest";
import {
  AHORA,
  auth,
  buildTestServerConReloj,
  COMPRADOR_JUAN,
  COMPRADORA_SOFIA,
  COMPRADORA_VALENTINA,
  ORGANIZADOR_MARTIN,
} from "./utils/buildTestServer.js";

// Semilla: superclásico (evento 5, de Martín), Platea (tipo 2) con cupo 2 y 1 libre
const EVENTO = 5;
const PLATEA = 2;
const MINUTO = 60 * 1000;

describe("M19 - Lista de espera (D-40)", () => {
  let app;
  let reloj;
  beforeEach(async () => {
    ({ app, reloj } = await buildTestServerConReloj());
  });

  const comprar = (usuario, cantidad = 1) =>
    request(app)
      .post("/compra")
      .set(auth(usuario))
      .send({ eventoId: EVENTO, tipoEntradaId: PLATEA, cantidad });
  const anotarse = (usuario, cantidad = 1) =>
    request(app)
      .post(`/evento/${EVENTO}/espera`)
      .set(auth(usuario))
      .send({ tipoEntradaId: PLATEA, cantidad });
  const cancelar = (compraId, usuario) =>
    request(app).post(`/compra/${compraId}/cancelar`).set(auth(usuario));
  const miEspera = async (usuario) =>
    (await request(app).get(`/evento/${EVENTO}`).set(auth(usuario))).body.listaEspera.mias[0];
  const avanzar = (minutos) => (reloj.fecha = new Date(AHORA.getTime() + minutos * MINUTO));
  const ultimaNotificacion = async (usuario) =>
    (await request(app).get("/notificacion").set(auth(usuario))).body.data[0];

  // Juan compra la última platea: queda agotada
  async function agotarPlatea() {
    const compra = await comprar(COMPRADOR_JUAN);
    expect(compra.status).toBe(201);
    return compra.body.id;
  }

  test("sólo se puede anotar a un tipo agotado, una vez, y con el puesto en la cola", async () => {
    expect((await anotarse(COMPRADORA_SOFIA)).status).toBe(422); // todavía hay 1 libre
    await agotarPlatea();

    const primera = await anotarse(COMPRADORA_SOFIA);
    expect(primera.status).toBe(201);
    expect(primera.body).toMatchObject({ estado: "ESPERANDO", tipoEntrada: "Platea" });
    expect((await anotarse(COMPRADORA_VALENTINA)).status).toBe(201);
    expect((await anotarse(COMPRADORA_SOFIA)).status).toBe(409);

    expect(await miEspera(COMPRADORA_SOFIA)).toMatchObject({ posicion: 1 });
    expect(await miEspera(COMPRADORA_VALENTINA)).toMatchObject({ posicion: 2 });
    expect((await anotarse(ORGANIZADOR_MARTIN)).status).toBe(403);
  });

  test("al liberarse cupo se avisa al primero y se le retiene la entrada 30 minutos", async () => {
    const compraJuan = await agotarPlatea();
    await anotarse(COMPRADORA_SOFIA);
    await cancelar(compraJuan, COMPRADOR_JUAN);

    const espera = await miEspera(COMPRADORA_SOFIA);
    expect(espera.estado).toBe("AVISADA");
    expect(new Date(espera.prioridadHasta) - AHORA).toBe(30 * MINUTO);
    expect(await ultimaNotificacion(COMPRADORA_SOFIA)).toMatchObject({ tipo: "LUGAR_DISPONIBLE" });

    // Para el resto sigue agotada; Sofía puede comprarla
    const detalle = await request(app).get(`/evento/${EVENTO}`);
    expect(detalle.body.tiposEntrada[1].disponibles).toBe(0);
    expect((await comprar(COMPRADORA_VALENTINA)).status).toBe(422);
    expect((await comprar(COMPRADORA_SOFIA)).status).toBe(201);
    expect(await miEspera(COMPRADORA_SOFIA)).toBeUndefined(); // ya no está activa (CONVERTIDA)
  });

  test("si no compra a tiempo, la prioridad pasa al siguiente", async () => {
    const compraJuan = await agotarPlatea();
    await anotarse(COMPRADORA_SOFIA);
    await anotarse(COMPRADORA_VALENTINA);
    await cancelar(compraJuan, COMPRADOR_JUAN);

    avanzar(31);
    expect(await miEspera(COMPRADORA_VALENTINA)).toMatchObject({ estado: "AVISADA" });
    expect(await miEspera(COMPRADORA_SOFIA)).toBeUndefined();
    // (a esa hora también vence la reserva pendiente de Sofía de la semilla: se busca en la lista)
    const avisos = (await request(app).get("/notificacion").set(auth(COMPRADORA_SOFIA))).body.data;
    expect(avisos.map((aviso) => aviso.tipo)).toContain("PRIORIDAD_VENCIDA");
  });

  test("una reserva que vence también libera el cupo para la lista", async () => {
    await agotarPlatea(); // la compra de Juan queda pendiente
    await anotarse(COMPRADORA_SOFIA);
    avanzar(16);
    expect(await miEspera(COMPRADORA_SOFIA)).toMatchObject({ estado: "AVISADA" });
  });

  test("retirarse con la prioridad la pasa al siguiente", async () => {
    const compraJuan = await agotarPlatea();
    await anotarse(COMPRADORA_SOFIA);
    await anotarse(COMPRADORA_VALENTINA);
    await cancelar(compraJuan, COMPRADOR_JUAN);

    const baja = await request(app)
      .delete(`/evento/${EVENTO}/espera/${PLATEA}`)
      .set(auth(COMPRADORA_SOFIA));
    expect(baja.status).toBe(204);
    expect(await miEspera(COMPRADORA_VALENTINA)).toMatchObject({ estado: "AVISADA" });
  });

  test("orden estricto: si el primero pide más de lo liberado, la cola espera", async () => {
    const compraJuan = await agotarPlatea();
    await anotarse(COMPRADORA_SOFIA, 2);
    await anotarse(COMPRADORA_VALENTINA, 1);
    await cancelar(compraJuan, COMPRADOR_JUAN); // se libera 1
    expect(await miEspera(COMPRADORA_SOFIA)).toMatchObject({ estado: "ESPERANDO" });
    expect(await miEspera(COMPRADORA_VALENTINA)).toMatchObject({ estado: "ESPERANDO" });
  });

  test("el organizador ve cuántos esperan y cancelar el evento cierra la lista", async () => {
    await agotarPlatea();
    await anotarse(COMPRADORA_SOFIA);
    const compras = await request(app)
      .get(`/evento/${EVENTO}/compras`)
      .set(auth(ORGANIZADOR_MARTIN));
    expect(compras.body.disponibilidad[1]).toMatchObject({ nombre: "Platea", enEspera: 1 });

    await request(app)
      .post(`/evento/${EVENTO}/cancelar`)
      .set(auth(ORGANIZADOR_MARTIN))
      .send({ motivo: "Suspendido por lluvia" });
    expect(await miEspera(COMPRADORA_SOFIA)).toBeUndefined();
  });
});
