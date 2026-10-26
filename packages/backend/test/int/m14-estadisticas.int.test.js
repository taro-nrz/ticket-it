import request from "supertest";
import {
  auth,
  buildTestServer,
  COMPRADORA_SOFIA,
  ORGANIZADOR_MARTIN,
  ORGANIZADORA_LUCIA,
} from "./utils/buildTestServer.js";

describe("M14 - Estadísticas del evento (D-34)", () => {
  let app;
  beforeEach(async () => {
    app = await buildTestServer();
  });

  const estadisticas = (id, usuario = ORGANIZADORA_LUCIA) =>
    request(app).get(`/evento/${id}/estadisticas`).set(auth(usuario));

  test("resume ventas, ocupación y recaudación del evento", async () => {
    const res = await estadisticas(1);
    expect(res.status).toBe(200);
    expect(res.body.totales).toMatchObject({
      cupoTotal: 720,
      entradasVendidas: 3,
      entradasPagadas: 2,
      recaudacion: 30000,
      ticketPromedio: 30000,
      compras: 2,
    });
    expect(res.body.totales.ocupacion).toBeCloseTo((2 / 720) * 100, 1);
    expect(res.body.porEstado).toMatchObject({ CONFIRMADA: 1, PENDIENTE: 1 });
  });

  test("detalla cada tipo de entrada y la suma coincide con el total", async () => {
    const { body } = await estadisticas(1);
    expect(body.porTipo.map((tipo) => tipo.nombre)).toEqual(["General", "Platea", "VIP"]);
    expect(body.porTipo.reduce((total, tipo) => total + tipo.recaudacion, 0)).toBe(
      body.totales.recaudacion,
    );
  });

  test("las ventas por día cubren 14 días y suman las entradas pagadas", async () => {
    const { body } = await estadisticas(1);
    expect(body.ventasPorDia).toHaveLength(14);
    expect(body.ventasPorDia.reduce((total, dia) => total + dia.entradas, 0)).toBe(2);
  });

  test("un evento realizado informa asistencia y reseñas", async () => {
    const { body } = await estadisticas(7);
    expect(body.totales.entradasUtilizadas).toBeGreaterThan(0);
    expect(body.totales.cantidadResenias).toBeGreaterThan(0);
    // Las ventas fueron semanas antes del evento: el gráfico muestra los días alrededor de la última venta
    expect(body.ventasPorDia.reduce((total, dia) => total + dia.entradas, 0)).toBeGreaterThan(0);
  });

  test("una cancelación pagada sale de la recaudación y suma a la tasa de cancelación", async () => {
    await request(app).post("/compra/1/cancelar").set(auth(COMPRADORA_SOFIA));
    const { body } = await estadisticas(1);
    expect(body.totales.recaudacion).toBe(0);
    expect(body.totales.tasaCancelacion).toBe(50);
  });

  test("sólo el organizador del evento", async () => {
    expect((await estadisticas(1, ORGANIZADOR_MARTIN)).status).toBe(403);
    expect((await estadisticas(1, COMPRADORA_SOFIA)).status).toBe(403);
    expect((await estadisticas(99)).status).toBe(404);
  });
});
