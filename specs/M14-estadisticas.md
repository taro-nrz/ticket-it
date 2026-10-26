# M14 — Estadísticas del evento

**Estado**: Implementada · **Depende de**: M3, M4, M6

## HU-E1 — Entender cómo va mi evento
Como organizador, quiero ver los números de un evento (ventas, ocupación, cancelaciones, asistencia y
puntaje) para tomar decisiones.
- **CA-1**: `GET /evento/:id/estadisticas` (sólo su organizador, 403/404) devuelve totales, ventas por tipo,
  compras por estado y entradas pagadas por día.
- **CA-2**: la recaudación cuenta sólo compras CONFIRMADAS y UTILIZADAS; la suma por tipo coincide con el total.
- **CA-3**: el gráfico por día cubre 14 días hasta hoy (o hasta el evento); si no hubo ventas en ese período,
  los 14 días que terminan en la última venta.
- **CA-4**: accesible: cada indicador tiene su texto; el gráfico tiene un resumen en texto ("4 entradas pagadas
  del 15/7 al 28/7. El mejor día fue…") y "Ver como tabla" con la tabla equivalente; las barras por tipo son
  `progressbar` con su valor.

Tests: `test/int/m14-estadisticas.int.test.js` (6), E2E en `flujos.spec.mjs` y "Estadísticas" en axe.
