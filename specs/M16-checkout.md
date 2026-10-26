# M16 — Checkout con tarjeta (pasarela de pago simulada)

**Estado**: Implementada · **Depende de**: M4, M15

## HU-C1 — Pagar mi compra con tarjeta
Como comprador, quiero pagar con tarjeta y saber enseguida si el pago se aprobó.
- **CA-1**: `POST /compra/:id/pagar { tarjeta: { numero, titular, vencimiento, cvv } }` cobra con la pasarela y
  confirma la compra. Una compra gratis se confirma sin tarjeta.
- **CA-2**: validación: número con algoritmo de Luhn (acepta espacios), vencimiento MM/AA futuro, CVV de 3–4
  números, titular (400 por campo `tarjeta.*`).
- **CA-3**: tarjetas de prueba: `4242…4242` aprobada, `4000…0002` sin fondos, `4000…0119` error de
  procesamiento. Un rechazo responde 422 "Pago rechazado: …" y la compra sigue PENDIENTE.
- **CA-4**: se guardan sólo marca, últimos 4 dígitos y autorización; el organizador no ve el pago.
- **CA-5**: pantalla de checkout accesible: autocompletado de tarjeta (`cc-number`, `cc-exp`, `cc-csc`), número
  agrupado de a 4, botones para cargar las tarjetas de prueba, resumen de errores y foco en el primero.

Tests: `test/int/m16-checkout.int.test.js` (7), unitarios de Luhn y marca, `e2e/checkout.spec.mjs` (4, con axe).
