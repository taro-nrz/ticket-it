# M13 — Entrada digital con QR y control de acceso

**Estado**: Implementada · **Depende de**: M4 (utilizar), M9

## HU-Q1 — Mi entrada digital
Como comprador, quiero tener mi entrada en el celular para mostrarla en la puerta.
- **CA-1**: al pagar, la compra recibe un código único `TK-XXXX-XXXX` (alfabeto sin 0/O/1/I/L, azar criptográfico).
- **CA-2**: el detalle de la compra CONFIRMADA o UTILIZADA muestra el QR (negro sobre blanco también en modo
  oscuro) y el código en texto. El código sólo lo ve el comprador.

## HU-Q2 — Controlar el acceso
Como organizador, quiero validar las entradas en la puerta escaneando el QR o escribiendo el código.
- **CA-3**: `POST /evento/:id/validar { codigo }` marca la compra como UTILIZADA (reutiliza `Compra.utilizar()`).
- **CA-4**: acepta el código escrito a mano (minúsculas, espacios, sin guiones).
- **CA-5**: rechazos claros: código inexistente (404), de otro evento, ya usado (dice de quién era), compra no
  vigente o antes del día del evento (422); sólo el organizador del evento (403).
- **CA-6**: pantalla "Validar entradas" con resultado grande "Puede pasar" / "No puede pasar" (ícono + texto, no
  sólo color) anunciado al lector; cámara con `expo-camera` en el celular (en web se escribe el código).

Semilla: `TK-JUAN-H7Y5` (Juan, stand-up de hoy, evento 6) y `TK-SOFA-2N7D` (Sofía, evento 1).
Tests: `test/int/m13-entrada-qr.int.test.js` (6), unitarios del código (2), `e2e/entrada.spec.mjs` (4, con axe).
