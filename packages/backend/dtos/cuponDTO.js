export function cuponDTO(cupon, ahora) {
  return {
    id: cupon.id,
    codigo: cupon.codigo,
    tipo: cupon.tipo,
    descripcion: cupon.descripcion(),
    porcentaje: cupon.porcentaje ?? null,
    monto: cupon.monto ?? null,
    usos: cupon.usos,
    usosMaximos: cupon.usosMaximos,
    usosRestantes: cupon.usosRestantes(),
    vence: cupon.vence,
    activo: cupon.activo,
    disponible: cupon.motivoNoDisponible(ahora) === null,
  };
}
