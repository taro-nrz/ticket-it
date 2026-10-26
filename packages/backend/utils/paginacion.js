export const LIMITE_POR_DEFECTO = 10;
export const LIMITE_MAXIMO = 100;

export function normalizarPaginacion(page, limit) {
  const pagina = Math.max(1, parseInt(page) || 1);
  const limite = Math.min(LIMITE_MAXIMO, Math.max(1, parseInt(limit) || LIMITE_POR_DEFECTO));
  return { pagina, limite };
}

// Formato de paginación visto en clase: { pagina, perPage, total, totalPaginas, data }
export function paginar(items, page, limit) {
  const { pagina, limite } = normalizarPaginacion(page, limit);
  const offset = (pagina - 1) * limite;
  return {
    pagina,
    perPage: limite,
    total: items.length,
    totalPaginas: Math.ceil(items.length / limite),
    data: items.slice(offset, offset + limite),
  };
}
