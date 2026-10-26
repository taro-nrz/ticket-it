import { randomInt } from "node:crypto";

// Sin caracteres que se confunden al leerlos o dictarlos (0/O, 1/I/L)
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

// D-33: código de la entrada, ej. "TK-7F3K-92QD" (31^8 ≈ 850 mil millones de combinaciones, al azar criptográfico)
export function generarCodigoEntrada() {
  const bloque = () =>
    Array.from({ length: 4 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
  return `TK-${bloque()}-${bloque()}`;
}

// Acepta el código escrito a mano: sin importar mayúsculas, espacios o guiones
export function normalizarCodigoEntrada(texto) {
  let limpio = String(texto ?? "")
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "");
  if (limpio.length === 10 && limpio.startsWith("TK")) limpio = limpio.slice(2);
  return limpio.length === 8 ? `TK-${limpio.slice(0, 4)}-${limpio.slice(4)}` : null;
}
