# AI Ticket It

Plataforma para vender entradas a eventos, hecha como trabajo práctico de Desarrollo de Software (UTN FRBA).
Conecta a quienes organizan eventos con quienes quieren asistir: los organizadores publican recitales, obras,
festivales, conferencias o partidos con sus tipos de entrada (General, Platea o VIP), y los compradores los
encuentran, compran y gestionan sus entradas desde el celular.

## Qué se puede hacer

**Como comprador**
- Buscar eventos por texto, filtrarlos por categoría y ordenarlos por fecha o precio.
- Comprar entradas sin superar el cupo y pagarlas (pago simulado).
- Ver mis compras con su estado, mostrar la entrada con QR en la puerta y cancelar con reembolso.
- Chatear con el organizador, guardar favoritos y reseñar el evento después de asistir.

**Como organizador**
- Publicar, editar y cancelar eventos con fotos y tipos de entrada.
- Ver las ventas, las estadísticas y las entradas disponibles de cada tipo.
- Validar las entradas en el acceso y responder los chats.

## Tecnologías

| Parte | Stack |
|---|---|
| Back-end | Node.js, Express 5, Zod, JWT, Socket.IO; persistencia en memoria con repositorios |
| Front-end | React Native con Expo y Expo Router (corre en Android, iOS y web) |
| Tests | Jest + Supertest (back) y Playwright + axe (E2E y accesibilidad) |
| Documentación de la API | Swagger / OpenAPI en `/api-docs` |

## Estructura

```
ticket-it-pro/
├── packages/
│   ├── backend/    # Express en capas: routes → controllers → services → entidades → repositorios
│   └── frontend/   # Expo: app/ (rutas), src/features (pantallas), components, hooks, context, service
├── specs/          # Una spec por módulo, con historias de usuario y criterios de aceptación
└── docs/           # Decisiones de diseño, changelog y guion de la exposición
```

## Cómo correrlo

Requisitos: Node.js 22 y npm. Para el celular, la app Expo Go en la misma red Wi-Fi que la compu.

```bash
npm install
cp packages/backend/.env.example packages/backend/.env

npm run start:dev    # backend (puerto 3000) + Expo; escaneá el QR con Expo Go
npm run start:web    # backend + la app en el navegador
```

La API queda documentada en `http://localhost:3000/api-docs`. Los datos viven en memoria y vuelven a los de
ejemplo cada vez que se reinicia el backend.

**Usuarios de ejemplo** (contraseña `ticketit123`): `lucia@ticketit.com` y `martin@ticketit.com` (organizadores),
`sofia@ticketit.com` y `juan@ticketit.com` (compradores). En la pantalla de ingreso, "Cuentas de prueba" completa
el formulario.

## Tests

```bash
npm run verificar                        # lint, formato y tests del backend
npm run test:e2e --workspace=frontend    # E2E y accesibilidad (WCAG 2.2 AA)
```
