// Ordena primero lo que todavía no ocurrió (lo más cercano antes) y después lo pasado (lo más reciente antes).
// Se usa en "mis compras" y "mis eventos".
export function ordenarProximosPrimero(items, obtenerFecha, ahora) {
  const futuros = items
    .filter((item) => obtenerFecha(item) > ahora)
    .sort((a, b) => obtenerFecha(a) - obtenerFecha(b));
  const pasados = items
    .filter((item) => obtenerFecha(item) <= ahora)
    .sort((a, b) => obtenerFecha(b) - obtenerFecha(a));
  return [...futuros, ...pasados];
}
