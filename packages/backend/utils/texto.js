// Normaliza para búsquedas: sin mayúsculas ni acentos ("Música" -> "musica")
export function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Montos en pesos para textos generados por el backend ("$ 30.000")
export function formatearMonto(valor) {
  return `$ ${Number(valor).toLocaleString("es-AR")}`;
}
