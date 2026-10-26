import request from "supertest";
import { auth, buildTestServer, ORGANIZADORA_LUCIA } from "./utils/buildTestServer.js";
import { eventoAIcs, nombreDeArchivo } from "../../utils/ics.js";

describe("M22 - Agregar al calendario (D-43)", () => {
  let app;
  beforeEach(async () => {
    app = await buildTestServer();
  });

  test("descarga el evento en formato iCalendar, sin necesidad de sesión", async () => {
    const res = await request(app).get("/evento/1/calendario.ics");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/^text\/calendar/);
    expect(res.headers["content-disposition"]).toBe(
      'attachment; filename="noche-indie-en-obras.ics"',
    );
    const ics = res.text;
    expect(ics).toMatch(/^BEGIN:VCALENDAR\r\nVERSION:2\.0\r\n/);
    expect(ics).toContain("UID:evento-1@ai-ticket-it");
    expect(ics).toContain("SUMMARY:Noche Indie en Obras");
    expect(ics).toMatch(/DTSTART:\d{8}T\d{6}Z/);
    expect(ics).toContain("STATUS:CONFIRMED");
    expect(ics).toContain("TRIGGER:-PT2H");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  test("un evento cancelado figura como cancelado", async () => {
    await request(app)
      .post("/evento/1/cancelar")
      .set(auth(ORGANIZADORA_LUCIA))
      .send({ motivo: "Problemas con el lugar" });
    expect((await request(app).get("/evento/1/calendario.ics")).text).toContain("STATUS:CANCELLED");
  });

  test("un evento inexistente responde 404", async () => {
    expect((await request(app).get("/evento/99/calendario.ics")).status).toBe(404);
  });

  test("escapa caracteres especiales y parte las líneas largas (RFC 5545)", () => {
    const ics = eventoAIcs(
      {
        id: 7,
        nombre: "Rock, pop; y más",
        descripcion: "Línea 1\nLínea 2 ".repeat(10),
        lugar: "Luna Park",
        direccion: "Av. Madero 420, CABA",
        fecha: new Date("2026-11-15T21:00:00Z"),
        cancelado: false,
      },
      { ahora: new Date("2026-10-26T15:00:00Z"), urlEvento: "http://localhost:8081/evento/7" },
    );
    expect(ics).toContain("SUMMARY:Rock\\, pop\\; y más");
    expect(ics).toContain("DTSTART:20261115T210000Z");
    expect(ics).toContain("DTEND:20261116T000000Z");
    for (const linea of ics.split("\r\n")) {
      expect(Buffer.byteLength(linea, "utf8")).toBeLessThanOrEqual(75);
    }
    expect(nombreDeArchivo("Festival de Verano 2026")).toBe("festival-de-verano-2026");
  });
});
