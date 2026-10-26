# M19 — Lista de espera

**Estado**: Implementada · **Depende de**: M3, M15, M12

## Modelo
`InscripcionEspera` (usuario, evento, tipo, cantidad, fecha, estado ESPERANDO / AVISADA / CONVERTIDA / EXPIRADA /
RETIRADA, `prioridadHasta`). `TipoEntrada.retenidas`: entradas guardadas para quien tiene prioridad (no cuentan
como disponibles para el resto).

## HU-W1 — Anotarme cuando está agotado
Como comprador, quiero anotarme en la lista de espera de un tipo agotado para que me avisen si se libera.
- **CA-1**: `POST /evento/:id/espera { tipoEntradaId, cantidad }` sólo si no hay cupo para esa cantidad (422),
  una vez por tipo (409), sólo compradores (403). Se informa el puesto en la cola.
- **CA-2**: `DELETE /evento/:id/espera/:tipoEntradaId` para salir.

## HU-W2 — Prioridad cuando se libera
- **CA-3**: al liberarse cupo (cancelación, reserva vencida, más cupo al editar) se avisa al primero de la cola
  (notificación LUGAR_DISPONIBLE) y se le **retienen** las entradas 30 minutos.
- **CA-4**: durante la prioridad, para el resto el tipo sigue agotado; quien tiene prioridad puede comprar.
- **CA-5**: si no compra a tiempo o se retira, pasa al siguiente (PRIORIDAD_VENCIDA al anterior).
- **CA-6**: orden estricto de llegada: si el primero pide más de lo liberado, la cola espera.
- **CA-7**: el organizador ve cuántos esperan por tipo; cancelar el evento cierra la lista.

Tests: `test/int/m19-lista-espera.int.test.js` (7), `e2e/lista-espera.spec.mjs` (3, con axe).
