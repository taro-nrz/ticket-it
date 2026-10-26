# M15 — Reserva con vencimiento

**Estado**: Implementada · **Depende de**: M3, M4

## HU-V1 — Que las reservas sin pagar no bloqueen el cupo
Como organizador, quiero que una compra que no se paga a tiempo libere sus entradas, para no perder ventas;
como comprador, quiero saber cuánto tiempo tengo para pagar.
- **CA-1**: toda compra nace PENDIENTE con `venceEn` = fecha de compra + 15 minutos (`MINUTOS_RESERVA`).
- **CA-2**: al cumplirse el plazo sin pagar pasa a **VENCIDA** (nuevo estado final de la máquina de estados),
  el cupo se libera y el historial registra el cambio como automático (`quien: null`).
- **CA-3**: pagar una reserva vencida responde 422 "La reserva venció…"; `PAGAR` deja de estar entre las acciones.
- **CA-4**: el comprador recibe la notificación RESERVA_VENCIDA con link al evento.
- **CA-5**: el detalle muestra "Tenés hasta las HH:MM para pagar" y una cuenta regresiva (decorativa para el
  lector, que lee la hora límite); la tarjeta dice "Pagar antes de las HH:MM".

## Decisión técnica
El vencimiento se aplica en un **middleware de mantenimiento** que corre antes de cada request
(`CompraService.vencerReservas()`): cualquier pantalla ve el cupo y los estados al día sin un proceso aparte.

Tests: `test/int/m15-vencimiento.int.test.js` (7) y E2E en `flujos.spec.mjs` (2).
