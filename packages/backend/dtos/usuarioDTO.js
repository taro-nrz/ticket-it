// Versión mínima de un usuario para embeber en otras respuestas
export function usuarioResumenDTO(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    rol: usuario.rol,
  };
}

export function usuarioDTO(usuario) {
  return {
    ...usuarioResumenDTO(usuario),
    cantidadFavoritos: usuario.esComprador() ? usuario.favoritos.length : undefined,
  };
}

export function categoriaDTO(categoria) {
  return {
    id: categoria.id,
    nombre: categoria.nombre,
    descripcion: categoria.descripcion,
  };
}
