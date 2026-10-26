import jwt from "jsonwebtoken";
import request from "supertest";
import { auth, buildTestServer, CONFIG_TEST } from "./utils/buildTestServer.js";

describe("M9 - Autenticación (D-29)", () => {
  let app;
  beforeEach(async () => {
    app = await buildTestServer();
  });

  const login = (email, password) => request(app).post("/auth/login").send({ email, password });
  const registrar = (datos) =>
    request(app)
      .post("/auth/registro")
      .send({
        nombre: "Ana",
        apellido: "Suárez",
        email: "ana@mail.com",
        password: "secreta123",
        rol: "COMPRADOR",
        ...datos,
      });

  describe("POST /auth/login", () => {
    test("con credenciales correctas devuelve un token y el usuario", async () => {
      const res = await login("sofia@ticketit.com", "ticketit123");
      expect(res.status).toBe(200);
      expect(res.body.usuario).toMatchObject({ id: 3, email: "sofia@ticketit.com" });
      expect(res.body.usuario.passwordHash).toBeUndefined();

      // El token sirve para las rutas protegidas
      const me = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${res.body.token}`);
      expect(me.status).toBe(200);
      expect(me.body.nombre).toBe("Sofía");
    });

    test("el email no distingue mayúsculas ni espacios", async () => {
      const res = await login("  SOFIA@TicketIt.com ", "ticketit123");
      expect(res.status).toBe(200);
    });

    test("contraseña incorrecta y email inexistente dan el mismo 401", async () => {
      const mala = await login("sofia@ticketit.com", "otra1234");
      const inexistente = await login("nadie@ticketit.com", "ticketit123");
      expect(mala.status).toBe(401);
      expect(inexistente.status).toBe(401);
      expect(mala.body.message).toBe(inexistente.body.message);
    });

    test("valida el formato del body", async () => {
      const res = await request(app).post("/auth/login").send({ email: "no-es-email" });
      expect(res.status).toBe(400);
      expect(res.body.errores.map((e) => e.campo)).toEqual(
        expect.arrayContaining(["email", "password"]),
      );
    });

    test("después de varios intentos fallidos responde 429", async () => {
      for (let i = 0; i < CONFIG_TEST.loginMaxIntentos; i++) {
        expect((await login("sofia@ticketit.com", "mala12345")).status).toBe(401);
      }
      const bloqueado = await login("sofia@ticketit.com", "ticketit123");
      expect(bloqueado.status).toBe(429);
      expect(bloqueado.body.status).toBe("fail");
    });
  });

  describe("POST /auth/registro", () => {
    test("crea la cuenta y deja la sesión iniciada", async () => {
      const res = await registrar();
      expect(res.status).toBe(201);
      expect(res.body.usuario).toMatchObject({
        nombre: "Ana",
        email: "ana@mail.com",
        rol: "COMPRADOR",
      });
      expect((await login("ana@mail.com", "secreta123")).status).toBe(200);
    });

    test("un organizador nuevo puede publicar eventos", async () => {
      const res = await registrar({ email: "org@mail.com", rol: "ORGANIZADOR" });
      const mios = await request(app)
        .get("/evento/mios")
        .set("Authorization", `Bearer ${res.body.token}`);
      expect(mios.status).toBe(200);
      expect(mios.body.total).toBe(0);
    });

    test("un email ya registrado responde 409", async () => {
      const res = await registrar({ email: "Lucia@ticketit.com" });
      expect(res.status).toBe(409);
    });

    test("rechaza contraseñas débiles y datos inválidos", async () => {
      expect((await registrar({ password: "corta1" })).status).toBe(400);
      expect((await registrar({ password: "sinnumeros" })).status).toBe(400);
      expect((await registrar({ password: "12345678" })).status).toBe(400);
      expect((await registrar({ email: "mal" })).status).toBe(400);
      expect((await registrar({ rol: "ADMIN" })).status).toBe(400);
    });
  });

  describe("Tokens", () => {
    test("un token vencido responde 401 con un mensaje claro", async () => {
      const res = await request(app).get("/auth/me").set(auth(3, { expiresIn: -10 }));
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/venció/);
    });

    test("un token firmado con otro secreto responde 401", async () => {
      const falso = jwt.sign({ sub: "1" }, "otro-secreto");
      const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${falso}`);
      expect(res.status).toBe(401);
    });

    test("un header sin el formato Bearer responde 401", async () => {
      const res = await request(app).get("/auth/me").set("Authorization", "Basic abc");
      expect(res.status).toBe(401);
    });

    test("los listados públicos no exponen el email", async () => {
      const res = await request(app).get("/usuario");
      expect(res.body.every((usuario) => usuario.email === undefined)).toBe(true);
    });
  });
});
