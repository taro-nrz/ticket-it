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
