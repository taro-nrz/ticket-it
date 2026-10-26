import request from "supertest";
import {
  auth,
  buildTestServer,
  COMPRADORA_SOFIA,
  ORGANIZADORA_LUCIA,
} from "./utils/buildTestServer.js";

// PNG válido de 1×1 píxel
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

describe("M21 - Subir imágenes del evento (D-42)", () => {
  let app;
  beforeEach(async () => {
    app = await buildTestServer();
  });

  const subir = (contenido, nombre = "foto.png", usuario = ORGANIZADORA_LUCIA) =>
    request(app).post("/archivos/imagenes").set(auth(usuario)).attach("imagen", contenido, nombre);

  test("el organizador sube una imagen y queda disponible en /uploads", async () => {
    const res = await subir(PNG);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ tipo: "image/png", bytes: PNG.length });
    expect(res.body.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/uploads\/[0-9a-f-]+\.png$/);

    const ruta = new URL(res.body.url).pathname;
    const archivo = await request(app).get(ruta);
    expect(archivo.status).toBe(200);
    expect(archivo.headers["content-type"]).toBe("image/png");
    expect(archivo.headers["cross-origin-resource-policy"]).toBe("cross-origin");
  });

  test("la URL subida se puede usar como multimedia al publicar", async () => {
    const { url } = (await subir(PNG)).body;
    const evento = await request(app)
      .post("/evento")
      .set(auth(ORGANIZADORA_LUCIA))
      .send({
        nombre: "Evento con foto",
        descripcion: "Un evento con una foto subida desde el celular.",
        categoriaId: 1,
        fecha: new Date(Date.now() + 10 * 864e5).toISOString(),
        lugar: "Luna Park",
        direccion: "Av. Madero 420, CABA",
        multimedia: [url],
        tiposEntrada: [{ nombre: "General", precio: 1000, cupo: 10 }],
      });
    expect(evento.status).toBe(201);
    expect(evento.body.multimedia).toEqual([url]);
  });

  test("rechaza archivos que no son imágenes aunque digan .png", async () => {
    const res = await subir(
      Buffer.from("<script>alert(1)</script> no soy una imagen"),
      "falso.png",
    );
    expect(res.status).toBe(400);
    expect(res.body.errores[0]).toMatchObject({ campo: "imagen" });
  });

  test("rechaza imágenes de más de 5 MB y pedidos sin archivo", async () => {
    const grande = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]);
    expect((await subir(grande)).status).toBe(413);
    const sinArchivo = await request(app).post("/archivos/imagenes").set(auth(ORGANIZADORA_LUCIA));
    expect(sinArchivo.status).toBe(400);
  });

  test("sólo los organizadores suben imágenes", async () => {
    expect((await subir(PNG, "foto.png", COMPRADORA_SOFIA)).status).toBe(403);
    expect(
      (await request(app).post("/archivos/imagenes").attach("imagen", PNG, "f.png")).status,
    ).toBe(401);
  });

  test("un archivo inexistente en /uploads responde 404", async () => {
    expect((await request(app).get("/uploads/no-existe.png")).status).toBe(404);
  });
});
