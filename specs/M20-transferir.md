# M20 — Transferir una entrada

**Estado**: Implementada · **Depende de**: M13 (código QR), M9

## HU-T1 — Pasarle mi entrada a otra persona
Como comprador, quiero transferir mi entrada a otra persona si no puedo ir.
- **CA-1**: `POST /compra/:id/transferir { email }` pasa la compra a otra cuenta de comprador (email sin
  distinguir mayúsculas) con un **código QR nuevo**: el anterior deja de servir en la puerta.
- **CA-2**: sólo el titular (403), con la compra CONFIRMADA y el evento vigente (422); no a sí mismo ni a un
  organizador (422); email inexistente (404).
- **CA-3**: el chat empieza de cero (lo hablado con el titular anterior queda privado) y el destinatario recibe
  la notificación ENTRADA_RECIBIDA; en su compra ve "Recibiste esta entrada de …".
- **CA-4**: la compra sale de "Mis entradas" del titular anterior; el organizador ve al nuevo titular.

Tests: `test/int/m20-transferir.int.test.js` (4), `e2e/transferir.spec.mjs` (3, con axe).
