# M10 — Perfil del usuario

**Estado**: Implementada · **Depende de**: M9

## HU-P1 — Editar mis datos
Como usuario, quiero corregir mi nombre y apellido.
- **CA-1**: `PATCH /usuario/me` actualiza nombre y/o apellido (2–50 caracteres, sin espacios al borde); el
  cambio se ve en el resto de la app (compras, chats, reseñas).
- **CA-2**: el email identifica la cuenta y no se puede cambiar.

## HU-P2 — Cambiar mi contraseña
Como usuario, quiero cambiar mi contraseña.
- **CA-3**: `POST /auth/cambiar-password` exige la contraseña actual (400 en `passwordActual` si no coincide).
- **CA-4**: la nueva cumple las reglas de M9 y es distinta de la actual (400 en `passwordNueva`).
- **CA-5**: después del cambio sólo funciona la contraseña nueva.

## Frontend
"Mi perfil" en el menú Cuenta → pantalla con "Tus datos" y "Contraseña", errores por campo, foco en el primer
error y aviso de éxito. Tests: `test/int/m10-perfil.int.test.js` (5), E2E en `cuenta.spec.mjs` y axe.
