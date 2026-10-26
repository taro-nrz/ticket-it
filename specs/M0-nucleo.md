# M0 — Núcleo / Setup

**Estado**: Implementada
**Depende de**: —
**Historias incluidas**: HT-00

## Objetivo del módulo
Esqueleto ejecutable y testeable sobre el que se montan los demás módulos, siguiendo la arquitectura de clase
(skill `dds-arquitectura-clase`) y las reglas transversales de `docs/BACKEND-MODULOS.md` §3.

## Modelo
Sin entidades de dominio. Componentes de infraestructura:
- `server.js` — clase `Server` (registro de controllers por clase, rutas como factories, 404, `errorHandler`).
- `app.js` — composición (repos → services → controllers) exportada como `crearApp({ reloj })`.
- `index.js` — `dotenv.config()` primero, crea la app y lanza en `HOST:PORT`.
- `error/appError.js` — `AppError` y subclases 400/401/403/404/409/422.
- `middlewares/errorHandler.js`, `middlewares/loggerMiddleware.js`.
- `utils/reloj.js`, `utils/paginacion.js`, `utils/texto.js`, `utils/validacion.js` (Zod → `ValidationError`).
- `routes/swaggerRoutes.js` + `docs/api-docs.yaml`.

---

## HT-00 — Setup del backend

### Historia
Como desarrollador, quiero un backend base con manejo de errores, documentación y tests para construir los módulos
sobre una base consistente.

### Criterios de aceptación
- **CA-1**: Dado el server levantado, cuando hago `GET /health`, entonces recibo `200 { status: "ok" }`.
- **CA-2**: Cuando pido una ruta inexistente, recibo `404 { status: "fail", message }`.
- **CA-3**: Cuando un service lanza un `AppError`, el cliente recibe su `statusCode` y `{ status, message, errores? }`.
- **CA-4**: Cuando ocurre un error no operacional, recibo `500 { status: "error", message: "Algo salió mal" }` (sin stack fuera de desarrollo).
- **CA-5**: Cuando un body no cumple el schema Zod, recibo `400` con `errores: [{ campo, mensaje }]`.
- **CA-6**: `GET /api-docs` muestra Swagger UI con la especificación OpenAPI.
- **CA-7**: `npm test` corre unit e integración.

### Contrato de API
- `GET /health` → `200 { "status": "ok" }`
- `GET /api-docs` → Swagger UI

### Formato de error
```json
{ "status": "fail", "message": "Datos de validación inválidos", "errores": [{ "campo": "nombre", "mensaje": "..." }] }
```

### Tareas
- [x] Monorepo (workspaces, ESLint, Prettier, concurrently, .gitignore, git init)
- [x] Server, app, index, errores, middlewares, utils
- [x] Swagger
- [x] Tests de integración de /health, 404 y errores (`test/int/m0-nucleo.int.test.js`, 6 tests)

## Decisiones tomadas en este módulo
- `app.js` exporta una función `crearApp({ reloj })` en vez de una instancia: permite que los tests de integración
  armen la app completa con un reloj fijo y datos frescos, sin levantar puerto (mejora sobre la clase).
- OpenAPI se mantiene en un único `docs/api-docs.yaml` (parseado con `yaml`), en vez de mantener YAML y JSON duplicados como en clase.
- En `NODE_ENV=development` el `errorHandler` agrega `stack` a la respuesta.
