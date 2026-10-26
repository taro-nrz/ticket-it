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
