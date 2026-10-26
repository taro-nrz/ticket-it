import { BusinessRuleError } from "../../error/appError.js";
import { Categoria } from "../../models/entities/categoria.js";
import { AccionCompra, Compra } from "../../models/entities/compra.js";
import { EstadoCompra } from "../../models/entities/estadoCompra.js";
import { Evento } from "../../models/entities/evento.js";
import { RolUsuario } from "../../models/entities/rolUsuario.js";
import { TipoEntrada } from "../../models/entities/tipoEntrada.js";
import { Usuario } from "../../models/entities/usuario.js";

const AHORA = new Date(2026, 9, 26, 15, 0, 0);
const dias = (cantidad) => new Date(AHORA.getTime() + cantidad * 24 * 60 * 60 * 1000);

function crearUsuario(id, rol) {
  const usuario = new Usuario(`Usuario${id}`, "Apellido", rol);
  usuario.id = id;
  return usuario;
}

const organizador = crearUsuario(1, RolUsuario.ORGANIZADOR);
const comprador = crearUsuario(2, RolUsuario.COMPRADOR);
const otroComprador = crearUsuario(3, RolUsuario.COMPRADOR);

function crearEvento(fecha = dias(10)) {
  const evento = new Evento({
    nombre: "Recital",
    descripcion: "Descripción del recital",
    categoria: new Categoria("Recitales", "Shows"),
    fecha,
    lugar: "Luna Park",
    direccion: "Av. Madero 420",
    tiposEntrada: [new TipoEntrada("General", "", 1000, 10), new TipoEntrada("VIP", "", 5000, 2)],
    organizador,
  });
  evento.id = 1;
  return evento;
}

function crearCompra({ evento = crearEvento(), cantidad = 2 } = {}) {
  const tipo = evento.buscarTipoEntrada(1);
  tipo.reservar(cantidad);
  return new Compra(comprador, evento, tipo, cantidad, AHORA);
}

describe("TipoEntrada", () => {
  test("hayCupoPara respeta el cupo disponible", () => {
    const tipo = new TipoEntrada("General", "", 100, 5);
    expect(tipo.hayCupoPara(5)).toBe(true);
    expect(tipo.hayCupoPara(6)).toBe(false);
    expect(tipo.hayCupoPara(0)).toBe(false);
  });

  test("reservar descuenta disponibles y liberar los devuelve", () => {
    const tipo = new TipoEntrada("General", "", 100, 5);
    tipo.reservar(3);
    expect(tipo.disponibles()).toBe(2);
    tipo.liberar(3);
    expect(tipo.disponibles()).toBe(5);
  });

  test("reservar sin cupo lanza BusinessRuleError", () => {
    const tipo = new TipoEntrada("General", "", 100, 1);
    expect(() => tipo.reservar(2)).toThrow(BusinessRuleError);
  });
});

describe("Evento", () => {
  test("asigna ids a los tipos de entrada", () => {
    expect(crearEvento().tiposEntrada.map((tipo) => tipo.id)).toEqual([1, 2]);
  });

  test("tuPrecioEstaEntre es verdadero si algún tipo cae en el rango", () => {
    const evento = crearEvento();
    expect(evento.tuPrecioEstaEntre(4000, 6000)).toBe(true);
    expect(evento.tuPrecioEstaEntre(2000, 3000)).toBe(false);
  });

  test("precio mínimo y máximo", () => {
    const evento = crearEvento();
    expect(evento.precioMinimo()).toBe(1000);
    expect(evento.precioMaximo()).toBe(5000);
  });

  test("yaSeRealizo y esElDiaOPosterior", () => {
    const hoyALaNoche = new Date(2026, 9, 26, 23, 0, 0);
    const evento = crearEvento(hoyALaNoche);
    expect(evento.yaSeRealizo(AHORA)).toBe(false);
    expect(evento.esElDiaOPosterior(AHORA)).toBe(true);
    expect(crearEvento(dias(1)).esElDiaOPosterior(AHORA)).toBe(false);
  });

  test("coincideConTexto ignora mayúsculas y acentos", () => {
    const evento = crearEvento();
    expect(evento.coincideConTexto("LUNA")).toBe(true);
    expect(evento.coincideConTexto("descripcion")).toBe(true);
    expect(evento.coincideConTexto("teatro")).toBe(false);
  });

  test("estaAgotado cuando ningún tipo tiene disponibles", () => {
    const evento = crearEvento();
    evento.tiposEntrada.forEach((tipo) => tipo.reservar(tipo.cupo));
    expect(evento.estaAgotado()).toBe(true);
  });
});

describe("Compra", () => {
  test("nace PENDIENTE con el total calculado y el primer cambio de estado", () => {
    const compra = crearCompra();
    expect(compra.estado).toBe(EstadoCompra.PENDIENTE);
    expect(compra.total).toBe(2000);
    expect(compra.historial).toHaveLength(1);
  });

  test("ciclo completo: pagar y utilizar el día del evento", () => {
    const evento = crearEvento(new Date(2026, 9, 27, 21, 0, 0));
    const compra = crearCompra({ evento });
    compra.pagar(comprador, AHORA);
    expect(compra.estado).toBe(EstadoCompra.CONFIRMADA);
    expect(() => compra.utilizar(organizador, AHORA)).toThrow(BusinessRuleError);
    compra.utilizar(organizador, new Date(2026, 9, 27, 20, 0, 0));
    expect(compra.estado).toBe(EstadoCompra.UTILIZADA);
    expect(compra.historial.map((cambio) => cambio.estado)).toEqual([
      "PENDIENTE",
      "CONFIRMADA",
      "UTILIZADA",
    ]);
  });

  test("actualizarEstado rechaza transiciones inválidas", () => {
    const compra = crearCompra();
    expect(() => compra.actualizarEstado(EstadoCompra.UTILIZADA, organizador, AHORA)).toThrow(
      BusinessRuleError,
    );
  });

  test("cancelar una compra confirmada la reembolsa y libera el cupo", () => {
    const compra = crearCompra();
    compra.pagar(comprador, AHORA);
    compra.cancelar(comprador, AHORA);
    expect(compra.estado).toBe(EstadoCompra.REEMBOLSADA);
    expect(compra.tipoEntrada.disponibles()).toBe(10);
  });

  test("cancelar una compra pendiente la deja CANCELADA", () => {
    const compra = crearCompra();
    compra.cancelar(comprador, AHORA);
    expect(compra.estado).toBe(EstadoCompra.CANCELADA);
  });

  test("no se puede cancelar una compra utilizada ni de un evento realizado", () => {
    const evento = crearEvento(new Date(2026, 9, 26, 10, 0, 0)); // hoy a la mañana: ya pasó
    const compra = crearCompra({ evento });
    expect(compra.puedeCancelarse(AHORA)).toBe(false);
    expect(() => compra.cancelar(comprador, AHORA)).toThrow(/ya se realizó/);
  });

  test("diasParaElEvento cuenta días calendario", () => {
    expect(crearCompra({ evento: crearEvento(dias(20)) }).diasParaElEvento(AHORA)).toBe(20);
    const hoy = crearEvento(new Date(2026, 9, 26, 23, 0, 0));
    expect(crearCompra({ evento: hoy }).diasParaElEvento(AHORA)).toBe(0);
  });

  test("acciones disponibles según el usuario y el estado", () => {
    const compra = crearCompra();
    expect(compra.accionesDisponiblesPara(comprador, AHORA)).toEqual([
      AccionCompra.PAGAR,
      AccionCompra.CANCELAR,
      AccionCompra.CHATEAR,
    ]);
    expect(compra.accionesDisponiblesPara(organizador, AHORA)).toEqual([AccionCompra.CHATEAR]);
    expect(compra.accionesDisponiblesPara(otroComprador, AHORA)).toEqual([]);
  });

  test("mensajes en orden y filtrados desde una fecha", () => {
    const compra = crearCompra();
    compra.agregarMensaje(comprador, "Hola", dias(-2));
    compra.agregarMensaje(organizador, "Hola!", dias(-1));
    expect(compra.mensajes.map((mensaje) => mensaje.id)).toEqual([1, 2]);
    expect(compra.mensajesDesde(dias(-1.5)).map((mensaje) => mensaje.mensaje)).toEqual(["Hola!"]);
  });
});

describe("Compra - mensajes sin leer (D-26)", () => {
  test("cuenta sólo los mensajes de la otra parte posteriores a la última lectura", () => {
    // PREPARAR
    const compra = crearCompra();
    compra.agregarMensaje(comprador, "Hola", dias(-2));
    compra.agregarMensaje(comprador, "¿Hay estacionamiento?", dias(-1));

    // VERIFICAR: el organizador no leyó nada; el comprador no cuenta los propios
    expect(compra.mensajesSinLeerPara(organizador)).toBe(2);
    expect(compra.mensajesSinLeerPara(comprador)).toBe(0);

    // ACTUAR + VERIFICAR: leer pone el contador en 0 y responder no lo cambia para quien responde
    compra.marcarMensajesLeidos(organizador, AHORA);
    expect(compra.mensajesSinLeerPara(organizador)).toBe(0);
    compra.agregarMensaje(organizador, "Sí, en la esquina", dias(0.1));
    expect(compra.mensajesSinLeerPara(comprador)).toBe(1);
    expect(compra.mensajesSinLeerPara(organizador)).toBe(0);
  });
});

describe("Usuario", () => {
  test("agregar un favorito es idempotente y se puede quitar", () => {
    const usuario = crearUsuario(5, RolUsuario.COMPRADOR);
    const evento = crearEvento();
    usuario.agregarFavorito(evento);
    usuario.agregarFavorito(evento);
    expect(usuario.favoritos).toHaveLength(1);
    usuario.quitarFavorito(evento);
    expect(usuario.tieneFavorito(evento)).toBe(false);
  });
});
