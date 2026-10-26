import request from "supertest";
import {
  auth,
  buildTestServerConReloj,
  COMPRADOR_JUAN,
  COMPRADORA_SOFIA,
  ORGANIZADOR_MARTIN,
  ORGANIZADORA_LUCIA,
  TARJETA_PRUEBA,
} from "./utils/buildTestServer.js";

describe("M12 - Notificaciones (D-32)", () => {
  let app;
  let reloj;
  beforeEach(async () => {
    ({ app, reloj } = await buildTestServerConReloj());
  });

  const notificaciones = (usuario, query = {}) =>
    request(app).get("/notificacion").query(query).set(auth(usuario));
  const noLeidas = async (usuario) =>
    (await request(app).get("/notificacion/resumen").set(auth(usuario))).body.noLeidas;
  const avanzar = (minutos) => (reloj.fecha = new Date(reloj.ahora().getTime() + minutos * 60000));

  test("lista las notificaciones propias, más recientes primero, con el total sin leer", async () => {
    const res = await notificaciones(ORGANIZADORA_LUCIA);
    expect(res.status).toBe(200);
    expect(res.body.noLeidas).toBe(2);
    expect(res.body.data.map((n) => n.tipo)).toEqual([
      "NUEVO_MENSAJE",
      "NUEVO_MENSAJE",
      "NUEVA_VENTA",
    ]);
    const fechas = res.body.data.map((n) => new Date(n.fecha).getTime());
    expect(fechas).toEqual([...fechas].sort((a, b) => b - a));
  });

  test("filtra por estado y requiere sesión", async () => {
    const res = await notificaciones(ORGANIZADORA_LUCIA, { estado: "NO_LEIDA" });
    expect(res.body.data.every((n) => n.estado === "NO_LEIDA")).toBe(true);
    expect((await request(app).get("/notificacion")).status).toBe(401);
    expect((await notificaciones(ORGANIZADORA_LUCIA, { estado: "OTRO" })).status).toBe(400);
  });

  test("marcar una como leída, y no las de otro usuario", async () => {
    const [primera] = (await notificaciones(ORGANIZADORA_LUCIA)).body.data;
    const ajena = await request(app)
      .post(`/notificacion/${primera.id}/leer`)
      .set(auth(COMPRADORA_SOFIA));
    expect(ajena.status).toBe(403);

    const res = await request(app)
      .post(`/notificacion/${primera.id}/leer`)
      .set(auth(ORGANIZADORA_LUCIA));
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe("LEIDA");
    expect(await noLeidas(ORGANIZADORA_LUCIA)).toBe(1);
  });

  test("marcar todas como leídas", async () => {
    const res = await request(app).post("/notificacion/leer-todas").set(auth(ORGANIZADORA_LUCIA));
    expect(res.status).toBe(204);
    expect(await noLeidas(ORGANIZADORA_LUCIA)).toBe(0);
  });

  test("pagar una compra notifica al organizador", async () => {
    const compra = await request(app)
      .post("/compra")
      .set(auth(COMPRADORA_SOFIA))
      .send({ eventoId: 1, tipoEntradaId: 1, cantidad: 2 });
    await request(app)
      .post(`/compra/${compra.body.id}/pagar`)
      .set(auth(COMPRADORA_SOFIA))
      .send({ tarjeta: TARJETA_PRUEBA });

    const [ultima] = (await notificaciones(ORGANIZADORA_LUCIA)).body.data;
    expect(ultima).toMatchObject({
      tipo: "NUEVA_VENTA",
      estado: "NO_LEIDA",
      link: `/compra/${compra.body.id}`,
    });
    expect(ultima.mensaje).toMatch(/Sofía Pérez pagó 2 × General/);
  });

  test("los mensajes de un mismo chat se agrupan y se leen al abrir el chat", async () => {
    avanzar(1);
    await request(app)
      .post("/compra/1/mensajes")
      .set(auth(COMPRADORA_SOFIA))
      .send({ mensaje: "Uno" });
    avanzar(1);
    await request(app)
      .post("/compra/1/mensajes")
      .set(auth(COMPRADORA_SOFIA))
      .send({ mensaje: "Dos" });

    const delChat = (await notificaciones(ORGANIZADORA_LUCIA)).body.data.filter(
      (n) => n.link === "/compra/1/chat" && n.estado === "NO_LEIDA",
    );
    expect(delChat).toHaveLength(1);
    expect(delChat[0]).toMatchObject({ cantidad: 3 });
    expect(delChat[0].mensaje).toMatch(/Dos/);

    await request(app).post("/compra/1/mensajes/leidos").set(auth(ORGANIZADORA_LUCIA));
    const despues = (await notificaciones(ORGANIZADORA_LUCIA)).body.data.filter(
      (n) => n.link === "/compra/1/chat" && n.estado === "NO_LEIDA",
    );
    expect(despues).toHaveLength(0);
  });

  test("cancelar un evento notifica a cada comprador afectado", async () => {
    await request(app)
      .post("/evento/1/cancelar")
      .set(auth(ORGANIZADORA_LUCIA))
      .send({ motivo: "Problemas con el lugar" });
    const [ultima] = (await notificaciones(COMPRADORA_SOFIA)).body.data;
    expect(ultima.tipo).toBe("EVENTO_CANCELADO");
    expect(ultima.mensaje).toMatch(/Problemas con el lugar/);
  });

  test("reseñar notifica al organizador", async () => {
    await request(app)
      .post("/evento/7/resenias")
      .set(auth(COMPRADOR_JUAN))
      .send({ puntuacion: 4, detalle: "Muy lindo show acústico." });
    const [ultima] = (await notificaciones(ORGANIZADORA_LUCIA)).body.data;
    expect(ultima).toMatchObject({ tipo: "NUEVA_RESENIA", link: "/evento/7/resenias" });
  });

  test("un organizador sin actividad no tiene notificaciones", async () => {
    const res = await notificaciones(ORGANIZADOR_MARTIN);
    expect(res.body).toMatchObject({ noLeidas: 0, total: 0, data: [] });
  });
});
