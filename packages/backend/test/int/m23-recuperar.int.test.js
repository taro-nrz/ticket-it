import request from "supertest";
import { AHORA, buildTestServerConReloj } from "./utils/buildTestServer.js";

const MINUTO = 60 * 1000;

describe("M23 - Recuperar la contraseña (D-44)", () => {
  let app;
  let reloj;
  beforeEach(async () => {
    ({ app, reloj } = await buildTestServerConReloj());
  });

  const pedir = (email) => request(app).post("/auth/recuperar").send({ email });
  const restablecer = (codigo, passwordNueva = "nueva4567", email = "sofia@ticketit.com") =>
    request(app).post("/auth/restablecer").send({ email, codigo, passwordNueva });
  const login = (password) =>
    request(app).post("/auth/login").send({ email: "sofia@ticketit.com", password });
  // El código llega por el email simulado
  const codigoEnviado = async () => {
    const [email] = (await request(app).get("/dev/emails")).body;
    return email.texto.match(/\b(\d{6})\b/)[1];
  };

  test("pedir un código, restablecer y entrar con la contraseña nueva", async () => {
    const res = await pedir("SOFIA@ticketit.com");
    expect(res.status).toBe(202);
    const [email] = (await request(app).get("/dev/emails")).body;
    expect(email).toMatchObject({ para: "sofia@ticketit.com" });
    expect(email.asunto).toMatch(/restablecer la contraseña/);

    expect((await restablecer(await codigoEnviado())).status).toBe(204);
    expect((await login("ticketit123")).status).toBe(401);
    expect((await login("nueva4567")).status).toBe(200);
  });

  test("con un email sin cuenta responde igual y no envía nada", async () => {
    const res = await pedir("nadie@ticketit.com");
    expect(res.status).toBe(202);
    expect(res.body.message).toBe((await pedir("sofia@ticketit.com")).body.message);
    const bandeja = (await request(app).get("/dev/emails")).body;
    expect(bandeja.map((e) => e.para)).toEqual(["sofia@ticketit.com"]);
  });

  test("el código es de un solo uso y sólo vale el último pedido", async () => {
    await pedir("sofia@ticketit.com");
    const primero = await codigoEnviado();
    await pedir("sofia@ticketit.com");
    const segundo = await codigoEnviado();
    if (primero !== segundo) expect((await restablecer(primero)).status).toBe(400);
    expect((await restablecer(segundo)).status).toBe(204);
    expect((await restablecer(segundo, "otra45678")).status).toBe(400);
  });

  test("el código vence a los 15 minutos", async () => {
    await pedir("sofia@ticketit.com");
    const codigo = await codigoEnviado();
    reloj.fecha = new Date(AHORA.getTime() + 16 * MINUTO);
    const res = await restablecer(codigo);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/venció/);
  });

  test("después de 5 intentos fallidos el código deja de valer", async () => {
    // Sin el límite por IP (que corta antes), para probar el límite propio del código
    ({ app } = await buildTestServerConReloj({ loginMaxIntentos: 100 }));
    await pedir("sofia@ticketit.com");
    const codigo = await codigoEnviado();
    const incorrecto = codigo === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++) {
      expect((await restablecer(incorrecto)).status).toBe(400);
    }
    expect((await restablecer(codigo)).status).toBe(400);
  });

  test("el límite de intentos por IP también protege la recuperación", async () => {
    for (let i = 0; i < 5; i++) await restablecer("000000");
    expect((await restablecer("000000")).status).toBe(429);
  });

  test("valida el código y la contraseña nueva", async () => {
    expect((await restablecer("12ab")).status).toBe(400);
    expect((await restablecer("123456", "corta")).status).toBe(400);
  });
});
