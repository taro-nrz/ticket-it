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

// Datos del propio usuario (el email sólo lo ve él: no se expone en listados ni en otras respuestas)
export function usuarioPropioDTO(usuario) {
  return { ...usuarioDTO(usuario), email: usuario.email };
}

export function categoriaDTO(categoria) {
  return {
    id: categoria.id,
    nombre: categoria.nombre,
    descripcion: categoria.descripcion,
  };
}
