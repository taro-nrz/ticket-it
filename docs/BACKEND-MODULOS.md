# AI Ticket It — Alcance completo del backend por módulos

Análisis exhaustivo del enunciado (contexto, diagrama de clases y casos de uso) traducido a módulos de backend.
Objetivo: que el backend cubra **todo** lo que el frontend va a necesitar, para no tener que volver a tocarlo.
Cada módulo se detalla y aprueba en su spec (`specs/MXX-nombre.md`) antes de implementarse.

---

## 1. Trazabilidad: enunciado → requerimiento → módulo

### 1.1 Casos de uso (obligatorios)
| HU | Texto del enunciado (resumen) | Qué exige al backend | Módulo |
|---|---|---|---|
| HU-01 | Organizador crea Evento con distintos tipos de entrada, cada uno con precio y cupo | `POST /evento` con `tiposEntrada[]`; validaciones | M2 |
| HU-02 | Comprador busca por texto o explora por categorías | búsqueda textual + filtro por categoría + listado de categorías | M1, M2 |
| HU-03 | Comprador ordena por precio, fecha del evento y puntaje del organizador | `orden=precio|fecha|puntaje` + `dir`; puntaje = promedio de reseñas | M2, M6 |
| HU-04 | Comprador compra eligiendo tipo y cantidad sin superar el cupo | `POST /compra`; control de cupo; total | M3 |
| HU-05 | Comprador ve sus compras, estado claro y días que faltan si CONFIRMADA | `GET /compra/mias` con `estado`, `diasRestantes` | M3 |
| HU-06 | Organizador ve compras de un Evento, estado y entradas disponibles por tipo | `GET /evento/:id/compras` con disponibilidad por tipo y resumen por estado | M3 |
| HU-07 | Comprador envía mensajes en cualquier momento en el chat de la compra | `POST /compra/:id/mensajes` | M5 |
| HU-08 | Organizador responde en cualquier momento en el chat de la compra | ídem + `GET /compra/:id/mensajes` | M5 |
| HU-09 | Comprador cancela una compra para obtener el reembolso | `POST /compra/:id/cancelar` → CANCELADA → REEMBOLSADA | M4 |
| HU-10 | Cancelación sólo si no está UTILIZADA y el evento no se realizó | reglas en la entidad `Compra` | M4 |
| HU-11 | Una vez utilizada la entrada, el comprador puntúa y comenta el Evento | `POST /evento/:id/resenias` exige compra UTILIZADA | M6 |
| HU-12 | Reseñas de eventos anteriores visibles en los Eventos de cada organizador | reseñas del organizador + reputación en el detalle del evento | M6 |

### 1.2 Requerimientos implícitos del contexto y del diagrama
| # | Fuente | Requerimiento | Módulo |
|---|---|---|---|
| R-01 | Contexto: "guardar eventos favoritos"; diagrama `Usuario.favoritos` | agregar / quitar / listar favoritos | M1 |
| R-02 | Contexto: "material multimedia"; diagrama `Evento.multimedia: String[]` | URLs de imágenes en el evento | M2 |
| R-03 | Diagrama `Evento.tuPrecioEstaEntre(min,max)` | filtro por rango de precio | M2 |
| R-04 | Contexto: "administrar las ventas realizadas" | organizador lista **sus** eventos y desde ahí sus ventas | M2, M3 |
| R-05 | Contexto: "seguimiento de la compra … etapas"; diagrama `CambioEstadoCompra` | historial de estados con quién y cuándo | M3, M4 |
| R-06 | Contexto: "conocer el estado actual y realizar las acciones correspondientes en cada momento" | cada compra expone `accionesDisponibles` según estado y usuario | M3, M4 |
| R-07 | Contexto: estado "pendiente de pago" | pago simulado PENDIENTE → CONFIRMADA | M4 |
| R-08 | Estado UTILIZADA (necesario para HU-11) | el organizador marca la entrada como utilizada (control de acceso) | M4 |
| R-09 | Contexto: "reputación de cada organizador" | puntaje promedio + cantidad de reseñas del organizador | M6 |
| R-10 | Contexto: "acceso al lugar" | `lugar` y `direccion` del evento (extensión del diagrama, D-11) | M2 |
| R-11 | Chat "en cualquier momento" + front mobile con polling | mensajes ordenados + parámetro `desde` para traer sólo nuevos | M5 |
| R-12 | Demo y video | datos semilla con eventos pasados/futuros, compras en todos los estados, mensajes y reseñas | M1, M3–M6 |
| R-13 | "Ejecutarse de forma local en un dispositivo mobile" | server escuchando en `0.0.0.0`, CORS configurable, URL por `.env` | M0 |
| R-14 | Fechas relativas (días que faltan, evento realizado) | reloj inyectable para tests deterministas | M0 |

---

## 2. Modelo de dominio final (diagrama + extensiones)

| Entidad | Atributos | Comportamiento | Extensión respecto del diagrama |
|---|---|---|---|
| `Usuario` | id, nombre, apellido, **rol**, favoritos: Evento[] | `esOrganizador()`, `esComprador()`, `agregarFavorito()`, `quitarFavorito()`, `tieneFavorito()` | `rol` (D-10) |
| `RolUsuario` | `COMPRADOR`, `ORGANIZADOR` (`Object.freeze`) | — | nuevo (D-10) |
| `Categoria` | id, nombre, descripcion | — | — |
| `Evento` | id, nombre, descripcion, categoria, fecha, **lugar**, **direccion**, tiposEntrada[], multimedia[], organizador | `tuPrecioEstaEntre(min,max)`, `precioMinimo()`, `precioMaximo()`, `yaSeRealizo(ahora)`, `buscarTipoEntrada(id)`, `estaAgotado()`, `coincideConTexto(texto)` | `lugar`, `direccion` (D-11) |
| `TipoEntrada` | id, nombre, descripcion, precio, cupo, **vendidas** | `hayCupoPara(cant)`, `disponibles()`, `reservar(cant)`, `liberar(cant)` | `vendidas` (D-12) |
| `Compra` | id, comprador, evento, tipoEntrada, cantidad, total, estado, mensajes[], **fechaCompra**, **historial[]** | `actualizarEstado(estado, quien, ahora)`, `puedeCancelarse(ahora)`, `diasParaElEvento(ahora)`, `agregarMensaje(usuario, texto, ahora)`, `esParticipante(usuario)`, `accionesDisponiblesPara(usuario, ahora)` | `fechaCompra`, `historial` (navegación hacia `CambioEstadoCompra`) |
| `EstadoCompra` | `PENDIENTE`, `CONFIRMADA`, `UTILIZADA`, `CANCELADA`, `REEMBOLSADA` | tabla de transiciones válidas | — |
| `CambioEstadoCompra` | compra, estado, quien, fechaHora | — | — |
| `Mensaje` | id, usuario, mensaje, enviado | — | — |
| `Resenia` | id, comprador, evento, detalle, puntuacion, **fecha** | — | `fecha` (orden de reseñas) |

### Máquina de estados de `Compra` (D-08 + D-09)
```
PENDIENTE ──pagar (comprador)──────────► CONFIRMADA ──utilizar (organizador)──► UTILIZADA
    │                                         │
    └─cancelar (comprador)─► CANCELADA        └─cancelar (comprador)─► CANCELADA ─(automático)─► REEMBOLSADA
```
- Transición inválida → `422 BusinessRuleError`. Cada transición genera un `CambioEstadoCompra`.
- Cancelar libera el cupo (`TipoEntrada.liberar`). Comprar lo reserva aunque esté PENDIENTE, para no sobrevender.
- `utilizar` sólo a partir del día del evento (D-15).

---

## 3. Reglas transversales (aplican a todos los módulos)

- **Identificación**: header `x-user-id` → `req.usuario` (401 si falta o es inválido, 404 si no existe). Endpoints de
  catálogo (`GET /evento`, `GET /evento/:id`, `GET /categoria`, reseñas) son **públicos**; el resto requiere usuario.
- **Permisos por rol** (D-10): sólo `ORGANIZADOR` crea eventos, lista sus eventos, ve compras de sus eventos y marca
  entradas utilizadas; sólo `COMPRADOR` compra, paga, cancela, reseña y tiene favoritos. Ambos chatean si son
  participantes de la compra. Violación → `403 ForbiddenError`.
- **Formato de error único**: `{ status, message, errores? }`. Los errores de Zod se transforman en `ValidationError`
  con `errores: [{ campo, mensaje }]` (no se devuelve el array crudo como en clase).
- **Paginación** en todos los listados: `?page&limit` → `{ pagina, perPage, total, totalPaginas, data }`.
- **IDs** numéricos autoincrementales por repositorio; id no numérico → 400.
- **Fechas** en ISO 8601 (UTC) en request y response.
- **DTOs**: nunca se exponen objetos internos completos (sin referencias circulares Compra↔Evento↔Usuario);
  usuarios se exponen como `{ id, nombre, apellido }`.
- **Reloj inyectable** (`utils/reloj.js`): services reciben `reloj.ahora()`; los tests usan un reloj fijo.
- **Repositorios en memoria** con interfaz async uniforme (`findAll`, `findById`, `save`, `update`, `delete`, `count`
  + consultas propias), basados en un `InMemoryRepository` genérico.
- **Documentación**: cada módulo agrega sus endpoints a `docs/api-docs.yaml` y a la colección Postman.
- **Tests**: cada módulo agrega tests unitarios (entidades y services con repos mock) e integración (supertest).

---

## 4. Módulos

### M0 — Núcleo / Setup (HT-00)
**Objetivo**: esqueleto ejecutable y testeable sobre el que se montan los demás módulos.
- Monorepo `ticket-it/` (workspaces, ESLint flat, Prettier, `concurrently`, `.gitignore`, `git init`).
- `packages/backend`: `index.js` (dotenv primero → `server.launch()` en `HOST`/`PORT`), `app.js` (composición),
  `server.js` (clase `Server`, `express.json` una sola vez, CORS desde `ALLOWED_ORIGINS`, 404, `errorHandler`).
- `error/appError.js`: `AppError`, `ValidationError` 400, `UnauthorizedError` 401, `ForbiddenError` 403,
  `NotFoundError` 404, `ConflictError` 409, `BusinessRuleError` 422.
- `middlewares/`: `errorHandler.js`, `loggerMiddleware.js`, `validarBody.js`/helper Zod → `ValidationError`.
- `utils/reloj.js`, `utils/paginacion.js` (normaliza page/limit y arma la respuesta), `utils/texto.js` (normaliza
  mayúsculas/acentos para búsquedas).
- Swagger en `GET /api-docs`; `GET /health` → `{ status: "ok" }`.
- Jest + Supertest, `test/int/utils/buildTestServer.js`.
- `.env.example`: `PORT=3000`, `HOST=0.0.0.0`, `ALLOWED_ORIGINS=*`, `NODE_ENV=development`.

**Hecho cuando**: levanta con `npm run dev:backend`, `/health` y `/api-docs` responden, 404 y errores con formato único, `npm test` pasa.

### M1 — Usuarios, Categorías, identificación y datos semilla (HT-01 + R-01, R-12)
**Objetivo**: los actores del sistema y el mecanismo de identificación que usan todos los módulos.
- Entidades `Usuario` (+ `RolUsuario`), `Categoria`. `InMemoryRepository` + `UsuarioRepository`, `CategoriaRepository`.
- `middlewares/usuarioMiddleware.js`: `requiereUsuario`, `requiereRol(RolUsuario.X)`.
- `data/seed.js`: se ejecuta en `app.js` al arrancar; cada módulo posterior agrega su parte (eventos, compras, mensajes, reseñas).
  Usuarios: 2 organizadores, 3 compradores. Categorías: Recitales, Teatro, Festivales, Conferencias, Deportes (las del enunciado).
- Endpoints:
  - `GET /usuario` (lista para elegir con qué usuario operar en el front), `GET /usuario/me`, `GET /usuario/:id`.
  - `GET /categoria`, `GET /categoria/:id`.
  - Favoritos (comprador): `GET /usuario/me/favoritos`, `POST /usuario/me/favoritos/:eventoId`, `DELETE /usuario/me/favoritos/:eventoId`.
    El agregado/quitado valida que el evento exista → se termina de conectar al cerrar M2 (el repo de eventos se inyecta en el service).
  - `POST /dev/reset` (sólo `NODE_ENV=development`): vuelve a cargar la semilla. Sirve para repetir la demo del video.

### M2 — Eventos (HU-01, HU-02, HU-03 + R-02, R-03, R-04, R-10)
**Objetivo**: catálogo de eventos y su publicación.
- Entidades `Evento`, `TipoEntrada`. `EventoRepository` con búsqueda/filtrado/orden.
- **HU-01** `POST /evento` (organizador): nombre, descripcion, categoriaId (debe existir), fecha (futura), lugar,
  direccion, multimedia (URLs válidas, opcional), tiposEntrada (≥1; nombre único dentro del evento; precio ≥ 0; cupo entero ≥ 1).
  Responde 201 con el evento completo.
- **HU-02/HU-03/R-03** `GET /evento` (público) con:
  - `texto`: busca en nombre, descripción, lugar y nombre de categoría, sin distinguir mayúsculas ni acentos.
  - `categoria` (id), `precioMin`, `precioMax` (usa `tuPrecioEstaEntre`), `fechaDesde`, `fechaHasta`.
  - `orden=fecha|precio|puntaje` + `dir=asc|desc` (default `fecha asc`). Precio = precio mínimo del evento;
    puntaje = promedio del organizador (0 o `null` sin reseñas, al final del orden; real desde M6).
  - Por defecto sólo eventos **futuros**; `incluirPasados=true` para ver todos.
  - Paginado. Cada ítem: id, nombre, categoria, fecha, lugar, imagen principal, precioDesde, agotado,
    organizador `{ id, nombre, apellido, puntaje, cantidadResenias }`.
- `GET /evento/:id` (público): detalle completo con tipos de entrada (`precio`, `cupo`, `disponibles`), multimedia,
  `yaSeRealizo`, organizador con reputación (y desde M6 las últimas reseñas del organizador).
- **R-04** `GET /evento/mios` (organizador): sus eventos (pasados y futuros) con resumen de ventas por tipo.

### M3 — Compras: crear y consultar (HU-04, HU-05, HU-06 + R-05, R-06)
**Objetivo**: la compra de entradas y su visualización para cada rol.
- Entidades `Compra`, `EstadoCompra`, `CambioEstadoCompra`. `CompraRepository` (`findByComprador`, `findByEvento`, ...).
- **HU-04** `POST /compra` (comprador) `{ eventoId, tipoEntradaId, cantidad }`:
  evento existe y no se realizó; tipo pertenece al evento; cantidad entera ≥ 1 (máximo 10 por compra, D-14);
  `hayCupoPara(cantidad)` o `422` con disponibles; reserva cupo; `total = precio × cantidad`; estado PENDIENTE +
  primer `CambioEstadoCompra`. 201.
- **HU-05** `GET /compra/mias?estado=` (comprador): cada compra con evento resumido (nombre, fecha, lugar, imagen),
  tipo de entrada, cantidad, total, `estado`, `diasRestantes` (sólo si CONFIRMADA; 0 si es hoy), `accionesDisponibles`.
  Orden: próximas primero.
- `GET /compra/:id` (comprador dueño u organizador del evento): detalle completo + historial + `accionesDisponibles`
  (lo necesitan las pantallas de chat, pago y cancelación).
- **HU-06** `GET /evento/:id/compras?estado=` (organizador dueño del evento): compras con comprador, tipo, cantidad, total,
  estado; `disponibilidad` por tipo (`cupo`, `vendidas`, `disponibles`) y `resumenPorEstado` (cantidad por estado).

### M4 — Ciclo de vida de la compra (HU-09, HU-10 + R-05, R-07, R-08)
**Objetivo**: las transiciones de estado y sus reglas.
- `POST /compra/:id/pagar` (comprador dueño): PENDIENTE → CONFIRMADA (pago simulado).
- `POST /compra/:id/utilizar` (organizador del evento): CONFIRMADA → UTILIZADA (control de acceso el día del evento).
- **HU-09/HU-10** `POST /compra/:id/cancelar` (comprador dueño): permitido si no está UTILIZADA, no está ya
  CANCELADA/REEMBOLSADA y el evento no se realizó. PENDIENTE → CANCELADA; CONFIRMADA → CANCELADA → REEMBOLSADA
  automático (D-09). Libera el cupo. Respuesta con el estado final y el historial.
- `GET /compra/:id/historial` (participantes): lista de `CambioEstadoCompra` (estado, quien, fechaHora).
- `accionesDisponibles` queda completo: `PAGAR`, `CANCELAR`, `UTILIZAR`, `RESENIAR`, `CHATEAR`.

### M5 — Mensajería de la compra (HU-07, HU-08 + R-11)
**Objetivo**: comunicación comprador ↔ organizador dentro de la compra.
- Entidad `Mensaje`; los mensajes viven dentro de la compra (`Compra.mensajes`, como en el diagrama).
- `GET /compra/:id/mensajes?desde=<ISO>` (participantes): orden cronológico; cada mensaje con autor
  `{ id, nombre, rol }` y `enviado`. `desde` devuelve sólo los nuevos (para polling del front).
- `POST /compra/:id/mensajes` (participantes) `{ mensaje }`: 1–1000 caracteres, sin sólo espacios. 201.
- Permitido en **cualquier** estado de la compra ("en cualquier momento"). Un tercero → 403.

### M6 — Reseñas y reputación (HU-11, HU-12, cierre de HU-03 + R-09)
**Objetivo**: calificaciones de eventos y reputación del organizador.
- Entidad `Resenia`. `ReseniaRepository` (`findByEvento`, `findByOrganizador`, `promedioDeOrganizador`, `existe(comprador, evento)`).
- **HU-11** `POST /evento/:id/resenias` (comprador) `{ puntuacion, detalle }`: requiere una compra UTILIZADA del comprador
  en ese evento; una reseña por comprador y evento (409 si repite); puntuacion entera de 1 a 5 (D-16);
  detalle 1–1000 caracteres.
- `GET /evento/:id/resenias` (público, paginado).
- **HU-12** `GET /usuario/:id/resenias` (público, paginado): reseñas de los eventos del organizador, con nombre y fecha
  del evento reseñado + `{ puntajePromedio, cantidadResenias }`. `GET /evento/:id` incorpora la reputación y las últimas reseñas.
- **Cierre HU-03**: el orden `puntaje` y el `puntaje` de los listados de eventos pasan a usar el promedio real.
- Semilla: reseñas sobre eventos pasados de los organizadores.

---

## 5. Fuera de alcance (decidido)
Login/registro real y contraseñas, base de datos persistente, pasarela de pago, edición/baja de eventos, cancelación
de eventos por el organizador, notificaciones push, subida de archivos (la multimedia son URLs).
