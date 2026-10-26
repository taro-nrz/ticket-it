import request from "supertest";
import { buildTestServer, auth } from "./utils/buildTestServer.js";

describe("M0 - Núcleo", () => {
  let app;
  beforeEach(async () => {
    app = await buildTestServer();
  });

  test("CA-1: GET /health responde ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  test("CA-2: una ruta inexistente responde 404 con el formato de error", async () => {
    const res = await request(app).get("/no-existe");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: "fail", message: "La ruta solicitada no existe" });
  });

  test("CA-3: un AppError se traduce a su status code", async () => {
    const res = await request(app).get("/categoria/999");
    expect(res.status).toBe(404);
    expect(res.body.status).toBe("fail");
    expect(res.body.message).toMatch(/categoría/);
  });

  test("CA-5: un body inválido responde 400 con errores por campo", async () => {
    const res = await request(app)
      .post("/compra")
      .set(auth("3"))
      .send({ eventoId: "uno", cantidad: 0 });
    expect(res.status).toBe(400);
    const campos = res.body.errores.map((error) => error.campo);
    expect(campos).toEqual(expect.arrayContaining(["eventoId", "tipoEntradaId", "cantidad"]));
  });

  test("un JSON mal formado responde 400", async () => {
    const res = await request(app)
      .post("/compra")
      .set(auth("3"))
      .set("Content-Type", "application/json")
      .send("{ no es json");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("El body no es un JSON válido");
  });

  test("CA-6: la especificación OpenAPI está disponible", async () => {
    const res = await request(app).get("/api-docs.json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.1.1");
    expect(Object.keys(res.body.paths)).toContain("/evento");
  });
});

describe("M0 - Seguridad y trazabilidad (D-35)", () => {
  let app;
  beforeEach(async () => {
    app = await buildTestServer();
  });

  test("responde con headers de seguridad y sin X-Powered-By", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  test("cada respuesta lleva un X-Request-Id (y respeta el que llega)", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
    const propio = await request(app).get("/health").set("X-Request-Id", "abc-123");
    expect(propio.headers["x-request-id"]).toBe("abc-123");
  });

  test("un body demasiado grande responde 413", async () => {
    const res = await request(app)
      .post("/auth/login")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ email: "a@b.com", password: "x".repeat(200_000) }));
    expect(res.status).toBe(413);
  });
});
