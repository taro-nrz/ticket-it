// D-36: antes de atender cada request se ponen al día las reglas que dependen del paso del tiempo
// (reservas vencidas). En memoria es barato y evita tener un proceso aparte que pueda quedar desfasado.
export function crearMantenimientoMiddleware(tareas) {
  return async (_req, _res, next) => {
    try {
      for (const tarea of tareas) {
        await tarea();
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
