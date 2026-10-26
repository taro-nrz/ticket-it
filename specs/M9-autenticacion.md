# M9 — Autenticación real (login, registro y sesión con JWT)

**Estado**: Implementada (versión "pro", ejecutada de forma autónoma; ver decisiones sin consultar)
**Depende de**: M1 (usuarios), M7 (frontend)
**Historias incluidas**: HU-A1 Registro, HU-A2 Login, HU-A3 Sesión segura

## Objetivo del módulo
Reemplazar la identificación de prueba por header `x-user-id` (D-03) por un inicio de sesión real con email y
contraseña, de forma que cada endpoint protegido sepa con certeza quién hace la operación.

## Modelo
- `Usuario`: agrega `email` (único, normalizado en minúsculas) y `passwordHash` (bcrypt). La entidad nunca ve la
  contraseña en claro.
- `UsuarioRepository.findByEmail(email)`.
- Semilla: los 5 usuarios tienen email `<nombre>@ticketit.com` y contraseña `ticketit123`.

---

## HU-A1 — Registro
Como visitante, quiero crear una cuenta de comprador u organizador para usar la plataforma.
- **CA-1**: con datos válidos se crea la cuenta y queda la sesión iniciada (201 + token).
- **CA-2**: un email ya registrado (sin importar mayúsculas) responde 409.
- **CA-3**: la contraseña debe tener 8–72 caracteres, al menos una letra y un número (400 con el campo).
- **CA-4**: sólo se puede elegir rol COMPRADOR u ORGANIZADOR.

## HU-A2 — Inicio de sesión
Como usuario registrado, quiero ingresar con mi email y contraseña.
- **CA-5**: con credenciales correctas devuelve `{ token, usuario }`.
- **CA-6**: con email inexistente o contraseña incorrecta responde 401 con **el mismo mensaje** (no revela qué
  cuentas existen).
- **CA-7**: después de N intentos fallidos desde la misma IP (10 en 15 min por defecto) responde 429.
- **CA-8**: el formulario es accesible: etiquetas, errores asociados, resumen anunciado, foco en el primer error,
  `autoComplete` (WCAG 1.3.5) y botón "Mostrar contraseña".

## HU-A3 — Sesión segura
Como usuario, quiero que mi sesión se mantenga al volver a abrir la app y se cierre si deja de ser válida.
- **CA-9**: todas las rutas protegidas exigen `Authorization: Bearer <token>`; sin token 401, token inválido o
  vencido 401 con mensaje claro, usuario inexistente 401.
- **CA-10**: el token vence a las 8 h. Al vencer, la app cierra la sesión, vuelve al login y explica por qué.
- **CA-11**: el email del usuario sólo se devuelve al propio usuario (`/auth/me`), nunca en listados.

### Contrato de API
- `POST /auth/registro` → 201 `Sesion` · 400 · 409
- `POST /auth/login` → 200 `Sesion` · 400 · 401 · 429
- `GET /auth/me` → 200 `UsuarioPropio` · 401

### Casos de prueba
Backend `test/int/m9-auth.int.test.js` (13) + `m1-usuarios` (identificación). E2E `e2e/auth.spec.mjs` (8) +
"se ingresa sólo con el teclado" en `flujos.spec.mjs` + "Crear cuenta" en el chequeo de axe.

## Decisiones tomadas en este módulo
Ver D-29 en `docs/DOCUMENTACION.md`.
