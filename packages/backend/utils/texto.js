// Normaliza para búsquedas: sin mayúsculas ni acentos ("Música" -> "musica")
export function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
