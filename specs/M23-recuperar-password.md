# M23 — Recuperar la contraseña

**Estado**: Implementada · **Depende de**: M9

## HU-R1 — Volver a entrar si me olvidé la contraseña
Como usuario, quiero restablecer mi contraseña con un código que me llega por email.
- **CA-1**: `POST /auth/recuperar { email }` responde 202 con el mismo mensaje exista o no la cuenta; si existe,
  envía un código de 6 números (azar criptográfico) que vence a los 15 minutos. Se guarda sólo su hash.
- **CA-2**: `POST /auth/restablecer { email, codigo, passwordNueva }` cambia la contraseña (204). El código es de un
  solo uso, sólo vale el último pedido y deja de valer tras 5 intentos fallidos; además rige el límite por IP del
  login (429).
- **CA-3**: el envío de email es simulado (`EmailSimulado`, misma interfaz que un proveedor real): en desarrollo
  se muestra en la consola y en `GET /dev/emails` (403 en producción).
- **CA-4**: pantalla en dos pasos ("Paso 1 de 2"), con el email precargado desde el login, autocompletado del
  código (`one-time-code`), errores por campo, foco en el primero y "enviar otro código".

Tests: `test/int/m23-recuperar.int.test.js` (7), `e2e/recuperar.spec.mjs` (3, con axe).
