# M11 — Gestión de eventos del organizador (requerimiento nuevo)

**Estado**: Implementada · **Depende de**: M2, M3, M4

## HU-G1 — Editar un evento
Como organizador, quiero corregir los datos de un evento publicado (nombre, descripción, fecha, lugar, precios,
cupos y tipos de entrada) para mantenerlo actualizado.
- **CA-1**: `PUT /evento/:id` con el mismo body que al publicar; los tipos existentes llevan `id`, los nuevos no.
- **CA-2**: sólo el organizador del evento (403) y mientras no se haya realizado ni cancelado (422).
- **CA-3**: el cupo de un tipo no puede quedar por debajo de lo vendido y no se puede quitar un tipo con ventas
  (422 con el motivo). Un tipo sin ventas sí se puede quitar.
- **CA-4**: las compras ya hechas conservan su total aunque cambie el precio.
- **CA-5**: valida igual que al publicar (fecha futura, nombres de tipos únicos, nombre+fecha no duplicado).

## HU-G2 — Cancelar un evento
Como organizador, quiero cancelar un evento que no se va a realizar, y que los compradores reciban su reembolso.
- **CA-6**: `POST /evento/:id/cancelar { motivo }` (5–300 caracteres) marca el evento como cancelado.
- **CA-7**: todas las compras PENDIENTES y CONFIRMADAS pasan a CANCELADA (las pagadas, a REEMBOLSADA), el cupo
  se libera y el historial registra al organizador como responsable.
- **CA-8**: el evento sale del catálogo y no admite compras (422).
- **CA-9**: no se puede cancelar dos veces, ni un evento realizado (422), ni uno ajeno (403).
- **CA-10**: el comprador ve en el detalle de su compra que el evento se canceló y si se le devolvió el dinero.

## Frontend
Detalle del evento (organizador): "Editar evento" (reutiliza el formulario de publicación) y "Cancelar evento"
(diálogo con motivo obligatorio y explicación de las consecuencias). "Mis eventos" agrega la sección Cancelados.
Tests: `test/int/m11-gestion-eventos.int.test.js` (10), E2E en `flujos.spec.mjs` (2) y "Editar evento" en axe.
