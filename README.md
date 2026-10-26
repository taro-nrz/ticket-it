# AI Ticket It

Plataforma de venta de entradas para eventos — Trabajo Práctico de Desarrollo de Software (UTN FRBA, 2C 2026).

Monorepo con npm workspaces:

```
ticket-it/
├── packages/
│   ├── backend/      # API REST con Node + Express (persistencia en memoria)
│   └── frontend/     # App mobile con React Native + Expo (también corre en web)
├── specs/            # Specs por módulo (SDD + historias de usuario)
└── docs/             # Bitácora de decisiones, alcance del backend y capturas
```

## Requisitos
- Node.js 20 o superior
- Para el celular: la app **Expo Go** (Android / iOS) y estar en la misma red WiFi que la PC

## Puesta en marcha

```bash
npm install
cp packages/backend/.env.example packages/backend/.env
```

**Todo junto (una sola terminal):**

```bash
npm run start:web   # backend + app en el navegador
npm run start:dev   # backend + Expo (QR para el celular)
```

O por separado. En una terminal, el backend:

```bash
npm run dev:backend
```

- API: `http://localhost:3000`
- **Swagger UI: `http://localhost:3000/api-docs`** (especificación en `/api-docs.json`, importable en Postman)

En otra terminal, el frontend:

```bash
npm run start:frontend   # muestra un QR: escanealo con Expo Go desde el celular
npm run web:frontend     # o abrilo en el navegador (http://localhost:8081)
```

La app detecta sola la IP de la PC cuando corre en Expo Go. Si hiciera falta forzarla, crear
`packages/frontend/.env` con `EXPO_PUBLIC_API_URL=http://<IP-de-la-PC>:3000`.

## Usuarios de prueba

No hay contraseñas: en la pantalla inicial se elige con qué usuario ingresar (en Swagger, botón **Authorize** → `x-user-id`).

| id | Usuario | Rol |
|---|---|---|
| 1 | Lucía Fernández | ORGANIZADOR |
| 2 | Martín Gómez | ORGANIZADOR |
| 3 | Sofía Pérez | COMPRADOR |
| 4 | Juan Rodríguez | COMPRADOR |
| 5 | Valentina López | COMPRADOR |

`POST /dev/reset` recarga los datos de prueba (los datos viven en memoria y se reinician al reiniciar el backend).

## Tests

```bash
npm run test:backend   # backend: 133 tests (Jest + Supertest)
npm run test:e2e       # E2E + accesibilidad: 90 tests en web, mobile y modo oscuro (Playwright + axe)
```

Los tests E2E levantan solos un backend y la app web. Necesitan un Chromium: instalalo una vez con
`npx playwright install chromium` (dentro de `packages/frontend`), o usá el del sistema con
`CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`.

## Documentación
- `docs/DOCUMENTACION.md` — metodología, decisiones de diseño (ADRs), avance y uso de IA.
- `docs/BACKEND-MODULOS.md` — alcance completo del backend, trazabilidad enunciado → requerimiento → módulo.
- `specs/` — una spec por módulo con historias, criterios de aceptación y contrato de API.
- `docs/capturas/` — capturas de la app.
