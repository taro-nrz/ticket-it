import request from "supertest";
import { buildTestServer, COMPRADORA_SOFIA, ORGANIZADORA_LUCIA } from "./utils/buildTestServer.js";

describe("M1 - Usuarios, categorías e identificación", () => {
  let app;
  beforeEach(async () => {
    app = await buildTestServer();
  });

  describe("Identificación por x-user-id", () => {
    test("sin header responde 401", async () => {
      const res = await request(app).get("/usuario/me");
      expect(res.status).toBe(401);
    });

    test("con un id no numérico responde 401", async () => {
      const res = await request(app).get("/usuario/me").set("x-user-id", "abc");
      expect(res.status).toBe(401);
    });

    test("con un usuario inexistente responde 404", async () => {
      const res = await request(app).get("/usuario/me").set("x-user-id", "999");
      expect(res.status).toBe(404);
    });

    test("con un usuario válido devuelve sus datos", async () => {
      const res = await request(app).get("/usuario/me").set("x-user-id", COMPRADORA_SOFIA);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 3, nombre: "Sofía", rol: "COMPRADOR" });
    });

    test("un rol sin permiso responde 403", async () => {
      const res = await request(app)
        .get("/usuario/me/favoritos")
        .set("x-user-id", ORGANIZADORA_LUCIA);
      expect(res.status).toBe(403);
    });
  });

  describe("Usuarios y categorías", () => {
    test("lista usuarios filtrando por rol", async () => {
      const res = await request(app).get("/usuario?rol=ORGANIZADOR");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.every((usuario) => usuario.rol === "ORGANIZADOR")).toBe(true);
    });

    test("un rol inválido responde 400", async () => {
      const res = await request(app).get("/usuario?rol=ADMIN");
      expect(res.status).toBe(400);
    });

    test("lista las 5 categorías", async () => {
      const res = await request(app).get("/categoria");
      expect(res.status).toBe(200);
      expect(res.body.map((categoria) => categoria.nombre)).toEqual([
        "Recitales",
        "Teatro",
        "Festivales",
        "Conferencias",
        "Deportes",
      ]);
    });
  });

  describe("Favoritos", () => {
    test("lista los favoritos del comprador", async () => {
      const res = await request(app)
        .get("/usuario/me/favoritos")
        .set("x-user-id", COMPRADORA_SOFIA);
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.data.every((evento) => evento.esFavorito)).toBe(true);
    });

    test("agrega un favorito sin duplicarlo y se refleja en el catálogo", async () => {
      const agregar = () =>
        request(app).post("/usuario/me/favoritos/1").set("x-user-id", COMPRADORA_SOFIA);
      expect((await agregar()).status).toBe(201);
      expect((await agregar()).status).toBe(201);

      const favoritos = await request(app)
        .get("/usuario/me/favoritos")
        .set("x-user-id", COMPRADORA_SOFIA);
      expect(favoritos.body.total).toBe(3);

      const detalle = await request(app).get("/evento/1").set("x-user-id", COMPRADORA_SOFIA);
      expect(detalle.body.esFavorito).toBe(true);
    });

    test("quita un favorito", async () => {
      const res = await request(app)
        .delete("/usuario/me/favoritos/2")
        .set("x-user-id", COMPRADORA_SOFIA);
      expect(res.status).toBe(204);
      const favoritos = await request(app)
        .get("/usuario/me/favoritos")
        .set("x-user-id", COMPRADORA_SOFIA);
      expect(favoritos.body.total).toBe(1);
    });

    test("quitar un evento que no es favorito responde 404", async () => {
      const res = await request(app)
        .delete("/usuario/me/favoritos/5")
        .set("x-user-id", COMPRADORA_SOFIA);
      expect(res.status).toBe(404);
    });

    test("agregar un evento inexistente responde 404", async () => {
      const res = await request(app)
        .post("/usuario/me/favoritos/999")
        .set("x-user-id", COMPRADORA_SOFIA);
      expect(res.status).toBe(404);
    });
  });

  test("POST /dev/reset recarga los datos semilla", async () => {
    await request(app).delete("/usuario/me/favoritos/2").set("x-user-id", COMPRADORA_SOFIA);
    const res = await request(app).post("/dev/reset");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      usuarios: 5,
      categorias: 5,
      eventos: 9,
      compras: 13,
      resenias: 4,
    });
    const favoritos = await request(app)
      .get("/usuario/me/favoritos")
      .set("x-user-id", COMPRADORA_SOFIA);
    expect(favoritos.body.total).toBe(2);
  });
});
