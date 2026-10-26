import { marcaDeTarjeta, numeroDeTarjetaValido } from "../../services/pasarelaPago.js";
import { obtenerConfig } from "../../config/config.js";
import { generarCodigoEntrada, normalizarCodigoEntrada } from "../../utils/codigo.js";
import { paginar, normalizarPaginacion } from "../../utils/paginacion.js";
import { normalizarTexto } from "../../utils/texto.js";
import { diasCalendarioEntre } from "../../utils/reloj.js";
import { validar, parsearId } from "../../utils/validacion.js";
import { ValidationError } from "../../error/appError.js";
import { z } from "zod";

describe("paginación", () => {
  test("normaliza valores inválidos o fuera de rango", () => {
    expect(normalizarPaginacion(undefined, undefined)).toEqual({ pagina: 1, limite: 10 });
    expect(normalizarPaginacion("-1", "600")).toEqual({ pagina: 1, limite: 100 });
    expect(normalizarPaginacion("2", "3")).toEqual({ pagina: 2, limite: 3 });
  });

  test("arma la estructura de clase", () => {
    expect(paginar([1, 2, 3, 4, 5], 2, 2)).toEqual({
      pagina: 2,
      perPage: 2,
      total: 5,
      totalPaginas: 3,
      data: [3, 4],
    });
  });
});

describe("texto y fechas", () => {
  test("normalizarTexto quita acentos y mayúsculas", () => {
    expect(normalizarTexto("  Música ÁÉÍ ")).toBe("musica aei");
  });

  test("diasCalendarioEntre cuenta días calendario", () => {
    const hoy = new Date(2026, 9, 26, 23, 0, 0);
    expect(diasCalendarioEntre(hoy, new Date(2026, 9, 27, 1, 0, 0))).toBe(1);
    expect(diasCalendarioEntre(hoy, new Date(2026, 9, 26, 1, 0, 0))).toBe(0);
  });
});

describe("validación", () => {
  test("validar devuelve los datos o lanza ValidationError con errores por campo", () => {
    const schema = z.object({ nombre: z.string().min(3) });
    expect(validar(schema, { nombre: "Ana" })).toEqual({ nombre: "Ana" });
    try {
      validar(schema, { nombre: "A" });
      throw new Error("no debería llegar acá");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errores[0].campo).toBe("nombre");
    }
  });

  test("parsearId acepta enteros positivos", () => {
    expect(parsearId("7")).toBe(7);
    expect(() => parsearId("abc")).toThrow(ValidationError);
    expect(() => parsearId("0")).toThrow(ValidationError);
  });
});

describe("Código de entrada (D-33)", () => {
  test("genera códigos con el formato y alfabeto sin caracteres confusos", () => {
    const codigos = new Set(Array.from({ length: 200 }, generarCodigoEntrada));
    expect(codigos.size).toBe(200);
    for (const codigo of codigos) {
      expect(codigo).toMatch(/^TK-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
    }
  });

  test("normaliza lo que escribe una persona", () => {
    expect(normalizarCodigoEntrada("tk-juan-h7y5")).toBe("TK-JUAN-H7Y5");
    expect(normalizarCodigoEntrada("JUANH7Y5")).toBe("TK-JUAN-H7Y5");
    expect(normalizarCodigoEntrada("TK TKAB 2345")).toBe("TK-TKAB-2345");
    expect(normalizarCodigoEntrada("corto")).toBeNull();
  });
});

describe("Configuración (D-35)", () => {
  test("usa valores por defecto en desarrollo", () => {
    const config = obtenerConfig({});
    expect(config).toMatchObject({ port: 3000, nodeEnv: "development", bcryptRondas: 10 });
    expect(config.jwtSecret).toBeTruthy();
  });

  test("en producción exige un JWT_SECRET largo", () => {
    expect(() => obtenerConfig({ NODE_ENV: "production" })).toThrow(/JWT_SECRET/);
    expect(() => obtenerConfig({ NODE_ENV: "production", JWT_SECRET: "corto" })).toThrow(/32/);
    expect(obtenerConfig({ NODE_ENV: "production", JWT_SECRET: "x".repeat(32) }).nodeEnv).toBe(
      "production",
    );
  });

  test("rechaza valores con formato inválido diciendo cuál", () => {
    expect(() => obtenerConfig({ PORT: "abc" })).toThrow(/PORT/);
    expect(() => obtenerConfig({ NODE_ENV: "staging" })).toThrow(/NODE_ENV/);
  });
});

describe("Pasarela de pago simulada (D-37)", () => {
  test("valida el número con el algoritmo de Luhn", () => {
    expect(numeroDeTarjetaValido("4242424242424242")).toBe(true);
    expect(numeroDeTarjetaValido("5555555555554444")).toBe(true);
    expect(numeroDeTarjetaValido("4242424242424241")).toBe(false);
    expect(numeroDeTarjetaValido("4242")).toBe(false);
  });

  test("reconoce la marca por los primeros dígitos", () => {
    expect(marcaDeTarjeta("4242424242424242")).toBe("Visa");
    expect(marcaDeTarjeta("5555555555554444")).toBe("Mastercard");
    expect(marcaDeTarjeta("378282246310005")).toBe("American Express");
  });
});
