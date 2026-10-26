# M4 — Ciclo de vida de la compra

**Estado**: Implementada
**Depende de**: M3
**Historias incluidas**: HU-09, HU-10 (+ R-07 pago simulado, R-08 entrada utilizada)

## Objetivo del módulo
Las transiciones de estado de la compra y sus reglas.

## Modelo
```
PENDIENTE ──pagar (comprador)──► CONFIRMADA ──utilizar (organizador, desde el día del evento)──► UTILIZADA
    │                                 │
    └─cancelar─► CANCELADA            └─cancelar─► CANCELADA ─(automático)─► REEMBOLSADA
```
Métodos de `Compra`: `pagar()`, `utilizar()`, `cancelar()`, `puedeCancelarse()`. Toda transición pasa por
`actualizarEstado()` (valida contra `TRANSICIONES_VALIDAS` y registra `CambioEstadoCompra`).

---

## R-07 — Pagar (simulado)
- **CA-1**: El comprador paga una compra PENDIENTE → CONFIRMADA; aparecen los `diasRestantes`.
- **CA-2**: Pagar una compra que no está PENDIENTE → 422. Evento realizado → 422.
- **CA-3**: Otro usuario → 403.

## R-08 — Marcar la entrada como utilizada
- **CA-1**: El organizador del evento la marca a partir del día del evento (00:00) → UTILIZADA.
- **CA-2**: Antes del día del evento → 422.
- **CA-3**: Otro organizador o un comprador → 403.

## HU-09 — Cancelar para obtener el reembolso
### Historia
Como comprador, quiero poder cancelar una compra para obtener el reembolso en caso de no poder asistir al evento.
### Criterios de aceptación
- **CA-1**: CONFIRMADA → CANCELADA → REEMBOLSADA automáticamente (dos cambios en el historial).
- **CA-2**: PENDIENTE → CANCELADA (no hubo pago que reembolsar).
- **CA-3**: En ambos casos se libera el cupo.
- **CA-4**: Sólo el comprador puede cancelar (403 para el resto).

## HU-10 — Cuándo se permite cancelar
### Historia
Como organizador, quiero que los compradores puedan cancelar una compra siempre que no esté utilizada y el evento
aún no se haya realizado.
### Criterios de aceptación
- **CA-1**: Compra UTILIZADA → 422.
- **CA-2**: Evento ya realizado (fecha/hora pasada) → 422.
- **CA-3**: Compra ya CANCELADA o REEMBOLSADA → 422.

## Historial
`GET /compra/:id/historial` (participantes): estado, quién y cuándo.

## Contrato
`POST /compra/:id/pagar`, `POST /compra/:id/utilizar`, `POST /compra/:id/cancelar`, `GET /compra/:id/historial`.
Todas devuelven la compra con detalle (incluye historial y `accionesDisponibles`), salvo el historial.

## Casos de prueba
`test/int/m4-ciclo-compra.int.test.js` (14 tests) y `test/unit/entidades.test.js` (máquina de estados).

## Decisiones tomadas en este módulo
- Reembolso automático (D-09); "utilizar" desde el día del evento (D-15).
- "Evento realizado" = la fecha y hora del evento ya pasó (`fecha <= ahora`).
- Las reglas viven en la entidad `Compra` (modelo rico); el service sólo valida permisos y persiste.
