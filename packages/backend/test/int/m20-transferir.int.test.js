import request from "supertest";
import {
  auth,
  buildTestServer,
  COMPRADOR_JUAN,
  COMPRADORA_SOFIA,
  ORGANIZADORA_LUCIA,
} from "./utils/buildTestServer.js";

// Semilla: compra 1 de Sofía CONFIRMADA (evento 1, futuro) con código TK-SOFA-2N7D y chat
describe("M20 - Transferir una entrada (D-41)", () => {
  let app;
  beforeEach(async () => {
    app = await buildTestServer();
  });

  const transferir = (compraId, email, usuario = COMPRADORA_SOFIA) =>
    request(app).post(`/compra/${compraId}/transferir`).set(auth(usuario)).send({ email });

  test("la entrada pasa a Juan con un código nuevo y el anterior deja de servir", async () => {
    const antes = (await request(app).get("/compra/1").set(auth(COMPRADORA_SOFIA))).body;
    expect(antes.accionesDisponibles).toContain("TRANSFERIR");

    const res = await transferir(1, "JUAN@ticketit.com");
    expect(res.status).toBe(200);
    expect(res.body.transferidaA).toEqual({ nombre: "Juan", apellido: "Rodríguez" });

    const deJuan = (await request(app).get("/compra/1").set(auth(COMPRADOR_JUAN))).body;
    expect(deJuan.comprador.nombre).toBe("Juan");
    expect(deJuan.codigo).toMatch(/^TK-/);
    expect(deJuan.codigo).not.toBe("TK-SOFA-2N7D");
    expect(deJuan.transferencias[0]).toMatchObject({
      de: { nombre: "Sofía" },
      a: { nombre: "Juan" },
    });

    // Sofía ya no la ve ni puede usar el código viejo
    expect((await request(app).get("/compra/1").set(auth(COMPRADORA_SOFIA))).status).toBe(403);
    const mias = (await request(app).get("/compra/mias").set(auth(COMPRADORA_SOFIA))).body;
    expect(mias.data.map((compra) => compra.id)).not.toContain(1);
  });

  test("el chat empieza de cero y Juan recibe una notificación", async () => {
    await transferir(1, "juan@ticketit.com");
    const mensajes = await request(app).get("/compra/1/mensajes").set(auth(COMPRADOR_JUAN));
    expect(mensajes.body).toEqual([]);
    const [aviso] = (await request(app).get("/notificacion").set(auth(COMPRADOR_JUAN))).body.data;
    expect(aviso).toMatchObject({ tipo: "ENTRADA_RECIBIDA", link: "/compra/1" });
  });

  test("reglas: sólo entradas pagadas y vigentes, a otro comprador que exista", async () => {
    expect((await transferir(2, "juan@ticketit.com")).status).toBe(422); // pendiente
    expect((await transferir(5, "juan@ticketit.com")).status).toBe(422); // utilizada
    expect((await transferir(1, "nadie@ticketit.com")).status).toBe(404);
    expect((await transferir(1, "sofia@ticketit.com")).status).toBe(422); // a sí misma
    expect((await transferir(1, "lucia@ticketit.com")).status).toBe(422); // organizadora
    expect((await transferir(1, "no-es-email")).status).toBe(400);
    expect((await transferir(1, "juan@ticketit.com", COMPRADOR_JUAN)).status).toBe(403);
  });

  test("el organizador ve al nuevo titular", async () => {
    await transferir(1, "juan@ticketit.com");
    const vista = await request(app).get("/compra/1").set(auth(ORGANIZADORA_LUCIA));
    expect(vista.body.comprador.nombre).toBe("Juan");
  });
});
