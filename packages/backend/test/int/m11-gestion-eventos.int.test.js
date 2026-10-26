import request from "supertest";
import {
  auth,
  buildTestServer,
  COMPRADORA_SOFIA,
  ORGANIZADOR_MARTIN,
  ORGANIZADORA_LUCIA,
} from "./utils/buildTestServer.js";

// Evento 1 (Lucía, futuro): General (2 vendidas), Platea, VIP (1 vendida); compras 1 (CONFIRMADA) y otra PENDIENTE
describe("M11 - Gestión de eventos del organizador (D-31)", () => {
  let app;
  beforeEach(async () => {
    app = await buildTestServer();
  });

  const detalle = async (id, usuario = ORGANIZADORA_LUCIA) =>
    (await request(app).get(`/evento/${id}`).set(auth(usuario))).body;

  // Arma el body de edición a partir del detalle actual
  const bodyDesde = (evento, cambios = {}) => ({
    nombre: evento.nombre,
    descripcion: evento.descripcion,
    categoriaId: evento.categoria.id,
    fecha: evento.fecha,
    lugar: evento.lugar,
    direccion: evento.direccion,
    multimedia: evento.multimedia,
    tiposEntrada: evento.tiposEntrada.map(({ id, nombre, descripcion, precio, cupo }) => ({
      id,
      nombre,
      descripcion,
      precio,
      cupo,
    })),
    ...cambios,
  });
  const editar = (id, body, usuario = ORGANIZADORA_LUCIA) =>
    request(app).put(`/evento/${id}`).set(auth(usuario)).send(body);
  const cancelar = (id, motivo = "Problemas con el lugar", usuario = ORGANIZADORA_LUCIA) =>
    request(app).post(`/evento/${id}/cancelar`).set(auth(usuario)).send({ motivo });

  describe("Editar", () => {
    test("el organizador edita datos, precios y agrega un tipo de entrada", async () => {
      const evento = await detalle(1);
      expect(evento.puedeEditarse).toBe(true);
      const tipos = bodyDesde(evento).tiposEntrada;
      tipos[0].precio = 18000;
      const res = await editar(
        1,
        bodyDesde(evento, {
          nombre: "Noche Indie en Obras (edición especial)",
          tiposEntrada: [...tipos, { nombre: "Palco", descripcion: "", precio: 80000, cupo: 10 }],
        }),
      );
      expect(res.status).toBe(200);
      expect(res.body.nombre).toBe("Noche Indie en Obras (edición especial)");
      expect(res.body.tiposEntrada.map((tipo) => tipo.nombre)).toEqual([
        "General",
        "Platea",
        "VIP",
        "Palco",
      ]);
      expect(res.body.tiposEntrada[3].id).toBe(4);
      // Las ventas existentes se mantienen
      expect(res.body.tiposEntrada[0]).toMatchObject({ precio: 18000, vendidas: 2 });
    });

    test("las compras ya hechas conservan su total aunque cambie el precio", async () => {
      const antes = (await request(app).get("/compra/1").set(auth(COMPRADORA_SOFIA))).body;
      const evento = await detalle(1);
      const tipos = bodyDesde(evento).tiposEntrada.map((tipo) => ({ ...tipo, precio: 1 }));
      await editar(1, bodyDesde(evento, { tiposEntrada: tipos }));
      const despues = (await request(app).get("/compra/1").set(auth(COMPRADORA_SOFIA))).body;
      expect(despues.total).toBe(antes.total);
    });

    test("no se puede bajar el cupo por debajo de lo vendido ni quitar un tipo con ventas", async () => {
      const evento = await detalle(1);
      const tipos = bodyDesde(evento).tiposEntrada;
      const cupoBajo = await editar(
        1,
        bodyDesde(evento, { tiposEntrada: [{ ...tipos[0], cupo: 1 }, tipos[1], tipos[2]] }),
      );
      expect(cupoBajo.status).toBe(422);
      expect(cupoBajo.body.message).toMatch(/no puede ser menor/);

      const sinGeneral = await editar(1, bodyDesde(evento, { tiposEntrada: [tipos[1]] }));
      expect(sinGeneral.status).toBe(422);
      expect(sinGeneral.body.message).toMatch(/No se puede quitar "General"/);
    });

    test("se puede quitar un tipo sin ventas", async () => {
      const evento = await detalle(1);
      const tipos = bodyDesde(evento).tiposEntrada;
      const res = await editar(1, bodyDesde(evento, { tiposEntrada: [tipos[0], tipos[2]] }));
      expect(res.status).toBe(200);
      expect(res.body.tiposEntrada.map((tipo) => tipo.nombre)).toEqual(["General", "VIP"]);
    });

    test("sólo el organizador del evento puede editarlo, y no si ya se realizó", async () => {
      const evento = await detalle(1);
      expect((await editar(1, bodyDesde(evento), ORGANIZADOR_MARTIN)).status).toBe(403);
      expect((await editar(1, bodyDesde(evento), COMPRADORA_SOFIA)).status).toBe(403);

      const pasado = await detalle(7);
      expect(pasado.puedeEditarse).toBe(false);
      const fechaFutura = new Date(Date.now() + 30 * 864e5).toISOString();
      expect((await editar(7, bodyDesde(pasado, { fecha: fechaFutura }))).status).toBe(422);
    });

    test("valida los datos igual que al publicar", async () => {
      const evento = await detalle(1);
      expect((await editar(1, bodyDesde(evento, { nombre: "x" }))).status).toBe(400);
      expect((await editar(1, bodyDesde(evento, { fecha: "2020-01-01T20:00:00Z" }))).status).toBe(
        400,
      );
    });
  });

  describe("Cancelar", () => {
    test("cancela el evento, sus compras y reembolsa las pagadas", async () => {
      const res = await cancelar(1);
      expect(res.status).toBe(200);
      expect(res.body.evento).toMatchObject({
        cancelado: true,
        motivoCancelacion: "Problemas con el lugar",
        puedeEditarse: false,
      });
      expect(res.body.comprasCanceladas).toBeGreaterThanOrEqual(1);

      const compra = (await request(app).get("/compra/1").set(auth(COMPRADORA_SOFIA))).body;
      expect(compra.estado).toBe("REEMBOLSADA");
      expect(compra.historial.at(-1).quien.id).toBe(1);
      expect(compra.accionesDisponibles).not.toContain("CANCELAR");
    });

    test("un evento cancelado sale del catálogo y no se puede comprar", async () => {
      await cancelar(1);
      const catalogo = await request(app).get("/evento");
      expect(catalogo.body.data.map((evento) => evento.id)).not.toContain(1);

      const compra = await request(app)
        .post("/compra")
        .set(auth(COMPRADORA_SOFIA))
        .send({ eventoId: 1, tipoEntradaId: 1, cantidad: 1 });
      expect(compra.status).toBe(422);
      expect(compra.body.message).toMatch(/cancelado/);
    });

    test("no se puede cancelar dos veces, ni un evento realizado, ni uno ajeno", async () => {
      await cancelar(1);
      expect((await cancelar(1)).status).toBe(422);
      expect((await cancelar(7)).status).toBe(422);
      expect((await cancelar(2)).status).toBe(403);
    });

    test("el motivo es obligatorio", async () => {
      expect((await cancelar(1, "")).status).toBe(400);
    });
  });
});
