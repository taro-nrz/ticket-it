import { jest } from "@jest/globals";
import { BusinessRuleError, NotFoundError, ValidationError } from "../../error/appError.js";
import { Categoria } from "../../models/entities/categoria.js";
import { Evento } from "../../models/entities/evento.js";
import { RolUsuario } from "../../models/entities/rolUsuario.js";
import { TipoEntrada } from "../../models/entities/tipoEntrada.js";
import { Usuario } from "../../models/entities/usuario.js";
import { CompraService } from "../../services/compraService.js";
import { RelojFijo } from "../../utils/reloj.js";

// Service con repositorios mockeados (patrón visto en clase)
const AHORA = new Date(2026, 9, 26, 15, 0, 0);

describe("CompraService.comprar", () => {
  let mockCompraRepo;
  let mockEventoRepo;
  let mockReseniaRepo;
  let service;
  let evento;
  const comprador = Object.assign(new Usuario("Sofía", "Pérez", RolUsuario.COMPRADOR), { id: 3 });
  const organizador = Object.assign(new Usuario("Lucía", "F", RolUsuario.ORGANIZADOR), { id: 1 });

  beforeEach(() => {
    evento = new Evento({
      nombre: "Recital",
      descripcion: "Descripción",
      categoria: new Categoria("Recitales", ""),
      fecha: new Date(2026, 10, 10, 21, 0, 0),
      lugar: "Luna Park",
      direccion: "Madero 420",
      tiposEntrada: [new TipoEntrada("General", "", 1000, 5)],
      organizador,
    });
    evento.id = 1;

    mockCompraRepo = {
      save: jest.fn((compra) => Promise.resolve(Object.assign(compra, { id: 1 }))),
    };
    mockEventoRepo = { findById: jest.fn(), save: jest.fn() };
    mockReseniaRepo = { findByCompradorYEvento: jest.fn().mockResolvedValue(null) };
    service = new CompraService(
      mockCompraRepo,
      mockEventoRepo,
      mockReseniaRepo,
      new RelojFijo(AHORA),
      { maxEntradasPorCompra: 10 },
    );
  });

  test("crea la compra, reserva cupo y persiste evento y compra", async () => {
    mockEventoRepo.findById.mockResolvedValue(evento);

    const resultado = await service.comprar(comprador, {
      eventoId: 1,
      tipoEntradaId: 1,
      cantidad: 2,
    });

    expect(mockEventoRepo.findById).toHaveBeenCalledWith(1);
    expect(mockEventoRepo.save).toHaveBeenCalledWith(evento);
    expect(mockCompraRepo.save).toHaveBeenCalled();
    expect(resultado).toMatchObject({ id: 1, estado: "PENDIENTE", total: 2000, cantidad: 2 });
    expect(evento.tiposEntrada[0].disponibles()).toBe(3);
  });

  test("sin cupo suficiente lanza BusinessRuleError y no guarda nada", async () => {
    mockEventoRepo.findById.mockResolvedValue(evento);
    await expect(
      service.comprar(comprador, { eventoId: 1, tipoEntradaId: 1, cantidad: 6 }),
    ).rejects.toThrow(BusinessRuleError);
    expect(mockCompraRepo.save).not.toHaveBeenCalled();
  });

  test("superar el máximo por compra lanza ValidationError sin consultar el repo", async () => {
    await expect(
      service.comprar(comprador, { eventoId: 1, tipoEntradaId: 1, cantidad: 11 }),
    ).rejects.toThrow(ValidationError);
    expect(mockEventoRepo.findById).not.toHaveBeenCalled();
  });

  test("evento inexistente lanza NotFoundError", async () => {
    mockEventoRepo.findById.mockResolvedValue(null);
    await expect(
      service.comprar(comprador, { eventoId: 9, tipoEntradaId: 1, cantidad: 1 }),
    ).rejects.toThrow(NotFoundError);
  });
});
