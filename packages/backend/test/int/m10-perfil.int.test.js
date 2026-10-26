import request from "supertest";
import { auth, buildTestServer, COMPRADORA_SOFIA } from "./utils/buildTestServer.js";

describe("M10 - Perfil (D-30)", () => {
  let app;
  beforeEach(async () => {
    app = await buildTestServer();
  });

  const cambiarPassword = (body) =>
    request(app).post("/auth/cambiar-password").set(auth(COMPRADORA_SOFIA)).send(body);
  const login = (password) =>
    request(app).post("/auth/login").send({ email: "sofia@ticketit.com", password });

  test("actualiza nombre y apellido y se ve en el resto de la app", async () => {
    const res = await request(app)
      .patch("/usuario/me")
      .set(auth(COMPRADORA_SOFIA))
      .send({ nombre: "  Sofi ", apellido: "Pérez Gil" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ nombre: "Sofi", apellido: "Pérez Gil" });

    const compra = await request(app).get("/compra/1").set(auth(COMPRADORA_SOFIA));
    expect(compra.body.comprador.nombre).toBe("Sofi");
  });

  test("el perfil valida los datos y requiere sesión", async () => {
    const vacio = await request(app).patch("/usuario/me").set(auth(COMPRADORA_SOFIA)).send({});
    expect(vacio.status).toBe(400);
    const corto = await request(app)
      .patch("/usuario/me")
      .set(auth(COMPRADORA_SOFIA))
      .send({ nombre: "S" });
    expect(corto.status).toBe(400);
    expect((await request(app).patch("/usuario/me").send({ nombre: "Sofi" })).status).toBe(401);
  });

  test("cambia la contraseña con la actual correcta", async () => {
    const res = await cambiarPassword({
      passwordActual: "ticketit123",
      passwordNueva: "nueva4567",
    });
    expect(res.status).toBe(204);
    expect((await login("ticketit123")).status).toBe(401);
    expect((await login("nueva4567")).status).toBe(200);
  });

  test("con la contraseña actual incorrecta responde 400 en ese campo", async () => {
    const res = await cambiarPassword({ passwordActual: "otra1234", passwordNueva: "nueva4567" });
    expect(res.status).toBe(400);
    expect(res.body.errores[0].campo).toBe("passwordActual");
  });

  test("la contraseña nueva tiene que ser válida y distinta", async () => {
    const debil = await cambiarPassword({ passwordActual: "ticketit123", passwordNueva: "corta" });
    expect(debil.status).toBe(400);
    const igual = await cambiarPassword({
      passwordActual: "ticketit123",
      passwordNueva: "ticketit123",
    });
    expect(igual.status).toBe(400);
    expect(igual.body.errores[0].campo).toBe("passwordNueva");
  });
});
