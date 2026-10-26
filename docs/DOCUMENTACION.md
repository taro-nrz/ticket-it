# AI Ticket It — Documentación del desarrollo

Bitácora viva del TP: metodología, decisiones de diseño, avances por historia de usuario y material
para la exposición (video de 5–10 min). Se actualiza en cada paso.

---

## 1. Contexto

- **Enunciado**: `../enunciado.md` — plataforma de venta de entradas para eventos (organizadores publican eventos con
  tipos de entrada; compradores buscan, compran, chatean por la compra, cancelan y reseñan).
- **Stack pedido**: Back-End Node + Express; Front-End React Native; ejecución local en un dispositivo mobile;
  persistencia en memoria.
- **Base de referencia**: repositorio de clase `../clase` (clase-cirbnb, 15 ramas). Todo lo relevado está en la skill
  `../.claude/skills/dds-arquitectura-clase/SKILL.md`.

## 2. Metodología: SDD (Spec-Driven Development) + Historias de Usuario

Cada funcionalidad nace de una **historia de usuario** del enunciado y se trabaja así:

1. **Spec** (`specs/HU-XX-nombre.md`, a partir de `specs/_plantilla.md`): historia, criterios de aceptación en
   formato Dado/Cuando/Entonces, reglas de negocio, contrato de API (endpoints, request, response, errores),
   impacto en el modelo y casos de prueba.
2. **Revisión de la spec** con el alumno: se resuelven dudas y se registran decisiones (sección 4).
3. **Plan y tareas**: qué archivos se crean/modifican por capa (entity → repository → service → controller → routes → tests → docs).
4. **Implementación** siguiendo la skill de arquitectura de clase.
5. **Verificación**: tests (Jest/Supertest) + prueba manual (Postman/Swagger). La HU se cierra cuando todos los
   criterios de aceptación pasan.
6. **Registro** en esta bitácora (sección 5).

Por qué SDD: la spec es el "contrato" que guía a la IA; reduce alucinaciones y retrabajo, deja trazabilidad
HU → criterio → test → código, y es material directo para la exposición.

Orden de fases acordado:
1. **Backend** (Express, capas, lógica de negocio de cada HU).
2. **Base de datos en memoria** (repositorios en memoria + datos semilla: usuarios, categorías, eventos, compras). Ver D-02.
3. **Frontend** (tecnología a definir, ver D-04).

## 3. Backlog: módulos del backend e historias de usuario

El backend se divide en **7 módulos** que se desarrollan en orden de dependencia. Cada módulo tiene una spec
(`specs/MXX-nombre.md`) que agrupa sus historias; dentro del módulo cada HU se implementa y prueba por separado.

| Módulo | Contenido | HU | Depende de | Estado |
|---|---|---|---|---|
| M0 — Núcleo / Setup | Monorepo, Server, app/index, errores, middlewares, Swagger, Jest, `/health` | HT-00 | — | Implementado |
| M1 — Usuarios y Categorías | Usuario, Categoria, repositorio genérico en memoria, middleware `x-user-id`, datos semilla, favoritos | HT-01 + Favoritos | M0 | Implementado |
| M2 — Eventos | Crear evento con tipos de entrada, búsqueda, filtros, orden, detalle | HU-01, HU-02, HU-03 | M1 | Implementado |
| M3 — Compras | Comprar con control de cupo, mis compras, compras de un evento | HU-04, HU-05, HU-06 | M2 | Implementado |
| M4 — Ciclo de vida de la compra | Pagar (simulado), utilizar, cancelar/reembolsar, historial de estados | HU-09, HU-10 | M3 | Implementado |
| M5 — Mensajería | Chat de la compra entre comprador y organizador | HU-07, HU-08 | M3 | Implementado |
| M6 — Reseñas y reputación | Reseñar compras utilizadas, ver reseñas del organizador, puntaje promedio | HU-11, HU-12 (+ cierre HU-03) | M4 | Implementado |
| M7 — Frontend | App React Native + Expo (web y mobile) | Todas | M0–M6 | Implementado |
| M8 — Mejoras | Mensajes sin leer, galería de fotos, reseñas por evento | HU-07/08, HU-12 (extensión) | M5–M7 | Implementado |

Historias de usuario del enunciado y su módulo:

| ID | Historia | Rol | Módulo |
|---|---|---|---|
| HU-01 | Crear un Evento con distintos tipos de entrada (precio y cupo) | Organizador | M2 |
| HU-02 | Buscar Eventos por texto o explorar por categorías | Comprador | M2 |
| HU-03 | Ordenar Eventos por precio, fecha del evento y puntaje del organizador | Comprador | M2 (el orden por puntaje se completa en M6) |
| HU-04 | Comprar entradas eligiendo tipo y cantidad sin superar el cupo | Comprador | M3 |
| HU-05 | Ver mis compras con su estado y días que faltan (si está confirmada) | Comprador | M3 |
| HU-06 | Ver las compras de un Evento con su estado y entradas disponibles por tipo | Organizador | M3 |
| HU-07 | Enviar mensajes en el chat de una compra | Comprador | M5 |
| HU-08 | Responder mensajes en el chat de una compra | Organizador | M5 |
| HU-09 | Cancelar una compra para obtener el reembolso | Comprador | M4 |
| HU-10 | Cancelación permitida sólo si no está UTILIZADA y el evento no se realizó | Organizador | M4 |
| HU-11 | Puntuar (numérico) y comentar un Evento una vez utilizada la entrada | Organizador/Comprador | M6 |
| HU-12 | Ver reseñas de eventos anteriores del organizador antes de comprar | Comprador | M6 |

El alcance completo (trazabilidad enunciado → requerimiento, modelo final, reglas transversales, endpoints y
reglas de cada módulo, y lo que queda fuera de alcance) está en **`docs/BACKEND-MODULOS.md`**.
Además de las 12 HU, ese análisis identificó 14 requerimientos implícitos (R-01 a R-14) del contexto y del diagrama:
favoritos, multimedia, rango de precio, "mis eventos" del organizador, historial de estados, acciones disponibles
por estado, pago simulado, entrada utilizada, reputación, lugar del evento, polling del chat, datos semilla,
ejecución en red local para mobile y reloj inyectable.

## 4. Decisiones de diseño (ADR livianos)

Formato: **contexto → opciones → decisión → justificación**.

### D-01 — Seguir la arquitectura del repo de clase
- Contexto: el TP se evalúa por criterio técnico; en clase se construyó una arquitectura en capas.
- Decisión: Controllers / Services / Repositories / Entities, clase `Server` con registro de controllers,
  rutas como factories, jerarquía `AppError` + `errorHandler` global, Zod para validar entrada, DTOs en services,
  Jest + Supertest, OpenAPI con Swagger UI.
- Justificación: consistencia con lo visto, separación de responsabilidades, testabilidad, y permite cambiar
  la persistencia (memoria → Mongo) tocando sólo repositorios.
- Se corrigen los errores conocidos del repo de clase (listados en la skill, sección 10).

### D-02 — Persistencia sólo en memoria
- Contexto: el enunciado exige "persistencia en memoria"; en clase se vio además MongoDB/Mongoose.
- Opciones: (a) sólo memoria, (b) memoria y luego Mongo, (c) directo a Mongo.
- Decisión: **(a) sólo memoria**. La "fase de base de datos" consiste en repositorios en memoria (arrays/Map)
  con la misma interfaz async que tendría un repo Mongo, más datos semilla.
- Justificación: cumplir el enunciado al pie de la letra y no sumar infraestructura (Docker/Mongo) que no se evalúa.
  Como los repositorios están aislados, migrar a Mongo sería cambiar sólo esa capa (argumento para la exposición).
- Consecuencia: los datos se pierden al reiniciar el server → el seed se carga en cada arranque.

### D-03 — Identificación del usuario por header `x-user-id`
- Contexto: el enunciado no pide login, pero las HU dependen del rol (comprador / organizador).
- Opciones: header simulado, login con JWT, id en body/params.
- Decisión: **header `x-user-id`** con usuarios precargados; un middleware lo resuelve y deja el usuario en `req.usuario`
  (401 si falta, 404 si no existe). Las reglas de permisos (ej. sólo el organizador del evento ve sus compras) se validan en los services.
- Justificación: mínima complejidad, foco en los casos de uso; reemplazable por JWT sin tocar services.

### D-04 — Tecnología de frontend: React Native + Expo
- Contexto: el enunciado pide React Native mobile; en clase se vio React web.
- Decisión inicial: se posterga y el backend se diseña agnóstico del cliente (REST + JSON, CORS configurable).
- Decisión final (fase 3): **React Native con Expo (SDK 58)**. Cumple el enunciado (corre en el celular con Expo Go)
  y, gracias a `react-native-web`, el mismo código también se abre en el navegador. Detalle en D-18.

### D-05 — Estructura: monorepo con npm workspaces
- Decisión: `ticket-it/` con `packages/backend` y `packages/frontend`, ESLint + Prettier en root, scripts con
  `concurrently` (igual que la rama `testing-documentacion`). Repositorio git propio.

### D-06 — La unidad de trabajo es el módulo
- Contexto: se quiere un desarrollo modular, concentrado en un componente por vez.
- Opciones: una spec por HU (12 + técnicas) o una spec por módulo que agrupe sus HU.
- Decisión: **una spec por módulo** (`specs/MXX-nombre.md`), con una sección por HU; las HU se implementan y
  prueban de a una dentro del módulo.
- Justificación: varias HU comparten entidades y endpoints (ej. HU-01/02/03 sobre Evento); agruparlas evita specs
  repetidas y mantiene cada módulo cohesivo, con dependencias claras entre módulos.

### D-07 — Favoritos incluido como extra
- Contexto: el contexto del enunciado y el diagrama (`Usuario.favoritos`) lo mencionan, pero no hay caso de uso.
- Decisión: se implementa como extra chico en M1 (agregar/quitar/listar). Agregar y quitar se habilitan cuando existe M2.

### D-08 — Ciclo de vida de la compra
- Contexto: las reseñas (HU-11) requieren compras UTILIZADAS y el enum tiene 5 estados, pero ningún caso de uso
  dice cómo se llega a cada uno.
- Decisión: la compra nace **PENDIENTE**; `POST /compra/:id/pagar` simula el pago → **CONFIRMADA**; el organizador
  marca **UTILIZADA**; la cancelación lleva a **CANCELADA/REEMBOLSADA** (semántica exacta en la spec de M4).
  Las transiciones válidas se centralizan en la entidad `Compra` y cada cambio se registra como `CambioEstadoCompra`.
- Justificación: usa los 5 estados del diagrama y permite demostrar el flujo completo sin una pasarela de pago real.

### D-09 — Reembolso automático al cancelar
- Opciones: reembolso automático, o acción manual del organizador.
- Decisión: si la compra estaba PENDIENTE (sin pagar) queda **CANCELADA**; si estaba CONFIRMADA pasa a CANCELADA y
  enseguida a **REEMBOLSADA**, con los dos cambios en el historial. Cancelar libera el cupo.
- Justificación: la HU-09 dice "cancelar para obtener el reembolso": el reembolso es consecuencia directa de cancelar.

### D-10 — Usuario con atributo `rol`
- Contexto: el diagrama no distingue roles; los casos de uso sí (comprador / organizador).
- Opciones: sin rol (por contexto) o atributo `rol`.
- Decisión: `Usuario.rol ∈ { COMPRADOR, ORGANIZADOR }`. Sólo los organizadores crean eventos, ven sus ventas y marcan
  entradas utilizadas; sólo los compradores compran, pagan, cancelan, reseñan y tienen favoritos. Ambos chatean si
  participan de la compra. Violación → 403.
- Justificación: refleja los dos actores de los casos de uso y simplifica las pantallas del front (una navegación por rol).
  Es una extensión del diagrama.

### D-11 — Lugar del evento
- Contexto: el enunciado menciona consultas sobre "el acceso al lugar", pero el diagrama no modela dónde ocurre el evento.
- Decisión: `Evento.lugar` (nombre de la sala) y `Evento.direccion`, como texto. Extensión del diagrama.

### D-12 — Cupo total + vendidas en `TipoEntrada`
- Contexto: HU-06 pide "cuántas entradas quedan disponibles de cada tipo" y la cancelación debe devolver el cupo.
- Decisión: `cupo` es la capacidad total (dato del organizador) y se agrega `vendidas`; `disponibles = cupo - vendidas`.
  Una compra reserva cupo desde PENDIENTE (evita sobreventa); cancelar lo libera.
- Justificación: conserva el dato original del organizador y hace trivial la disponibilidad por tipo.

### D-13 — Reglas transversales del backend
- Catálogo público (eventos, categorías, reseñas); el resto exige `x-user-id`.
- Formato de error único `{ status, message, errores? }` (Zod → `ValidationError`), paginación igual en todos los listados,
  DTOs sin referencias circulares, fechas ISO, reloj inyectable para testear fechas, `POST /dev/reset` para repetir la demo.
- Cada compra expone `accionesDisponibles` según su estado y el usuario, para que el front no duplique reglas de negocio.

### D-14 — Máximo 10 entradas por compra
- Decisión: tope configurable (`MAX_ENTRADAS_POR_COMPRA=10`); superarlo → 400 en el campo `cantidad`.
- Justificación: práctica habitual en ticketeras; evita que una sola compra se lleve todo el cupo.

### D-15 — "Utilizar" una entrada sólo desde el día del evento
- Decisión: el organizador puede marcar UTILIZADA a partir de las 00:00 del día del evento (también después).
- Justificación: representa el control de acceso en la puerta. La semilla incluye un evento "de hoy" para la demo.

### D-16 — Puntuación de reseñas: enteros de 1 a 5
- Decisión: estrellas enteras 1–5; el promedio del organizador sí tiene decimales (2).

### D-17 — Decisiones de implementación (mejoras sobre el código de clase)
- **`crearApp({ reloj, config })` async** en `app.js` en lugar de exportar una instancia: los tests arman una app
  completa, con datos frescos y "ahora" fijo, sin levantar puerto. `index.js` sólo carga `.env` y lanza.
- **Configuración leída en tiempo de ejecución** (`config/config.js`): con ES Modules los `import` se ejecutan antes
  que `dotenv.config()`; leer `process.env` recién al llamar `obtenerConfig()` evita el bug de clase (puerto por defecto).
- **Middlewares de usuario inyectados en el `Server`** (`setAuth`): cada factory de rutas recibe `(getController, auth)`,
  manteniendo el patrón de clase.
- **DTOs en una carpeta `dtos/`** (en clase eran `toDTO()` dentro de cada service): las compras, reseñas y favoritos
  reutilizan las mismas vistas de evento y usuario, y se evitan referencias circulares en el JSON.
- **Listados vacíos → 200 con `data: []`** (en clase: 204): el front no necesita un caso especial.
- **Un único `api-docs.yaml`** servido en `/api-docs` (Swagger UI) y `/api-docs.json` (para importar en Postman),
  en lugar de mantener YAML y JSON duplicados.
- **Mensajes de Zod en español** (`z.config(z.locales.es())`) y errores transformados al formato único `{ campo, mensaje }`.
- **Modelo rico**: las reglas de negocio (cupo, transiciones de estado, cancelación, acciones disponibles) viven en las
  entidades; los services validan permisos, orquestan repositorios y arman DTOs.

### D-18 — Stack y estructura del frontend
- **Expo SDK 58 + React Native 0.88 + React 19**, ejecutable en Expo Go y en web.
- **Expo Router** para la navegación (es la recomendada por Expo y en web genera URLs reales, ej. `/compra/5/chat`).
  Las rutas de `app/` son archivos finos que delegan en `src/features/`, para conservar la estructura por features de clase.
- **Grupos por rol**: `(comprador)` con tabs Explorar / Mis compras / Favoritos y `(organizador)` con tabs
  Mis eventos / Publicar evento. `app/index.js` redirige según la sesión y el rol.
- Patrones de clase: **axios** con una función por endpoint (`src/api/api.js`), **Context API** para la sesión
  (`SesionContext`, como `CartContext`), **custom hook** `useCarga` (como `useForm`), **polling** con `setInterval`
  y cleanup para el chat (como el popup de promociones).
- Componentes propios con `StyleSheet` (sin librería de UI) para que se vean igual en mobile y web.

### D-19 — Detalles de implementación del frontend
- **Sesión**: se guarda el id elegido en `AsyncStorage` (en web, `localStorage`) y un interceptor de axios agrega
  `x-user-id` a cada request. La app no muestra ninguna pantalla hasta restaurar la sesión (evita requests sin usuario).
- **URL de la API automática**: en Expo Go se usa la IP de la PC donde corre Expo (`Constants.expoConfig.hostUri`) con
  el puerto 3000; en web, `localhost:3000`; o `EXPO_PUBLIC_API_URL` si se define.
- **Las acciones de una compra salen de `accionesDisponibles`** del backend: el front no repite reglas de negocio.
- **Confirmaciones multiplataforma**: `window.confirm` en web y `Alert.alert` en mobile (`Alert` con botones no funciona en web).
- **Fechas del formulario como texto** (`AAAA-MM-DD` y `HH:MM`): los date pickers nativos no se comportan igual en web.
- **Errores del backend** (`message` / `errores`) se convierten en un mensaje legible en un interceptor de axios.

### D-20 — Rediseño visual con Claude Design
- Contexto: la primera versión del front era funcional pero genérica (componentes por defecto, tipografía del sistema).
- Proceso: se diseñaron 8 pantallas en un lienzo de **Claude Design** (https://claude.ai/artifact/W4Ry9dSekypnmXKmWdbVBx),
  se revisaron y recién después se llevaron al código.
- Dirección visual: **la entrada de evento como motivo** — tarjetas con talón de fecha, línea troquelada y muescas en
  "Mis entradas" y en el detalle de compra. Tipografía **Bricolage Grotesque** (títulos, estilo cartel) + **DM Sans**
  (texto), cargadas con `expo-font`. Paleta: fondo crema `#F5F3EE`, tinta violeta `#16112A`, acento coral `#FF5A36`.
- Estados de compra con colores que difieren en tono **y** claridad, con contraste de texto ≥ 4.5:1 (accesibilidad).
- Cabeceras propias (`Encabezado` grande en las tabs, `BarraVolver` en los detalles) en lugar de la barra estándar;
  tabs con "píldora" coral en la activa; barra fija de compra con total en el detalle del evento.
- Mejoras de UX que surgieron del diseño: "Mis compras" pasa a llamarse "Mis entradas"; el seguimiento muestra
  también los pasos que faltan (ej. "Utilizada — el día del evento"); las tarjetas destacan la acción pendiente
  ("Pagar", "Calificar"); el panel del organizador suma métricas (eventos, recaudado, reputación).
- Todo el sistema visual vive en `src/theme.js` (colores, fuentes, estilos de texto) y `src/components/`.

### D-21 — Accesibilidad (clase "Técnicas de accesibilidad", WCAG 2.2 AA)
- Contexto: la clase (`accesibilidad.pdf`) presenta los principios POUR, 9 pautas aplicadas a formularios en React
  web y mobile, y herramientas de evaluación (axe, Lighthouse, tests E2E con `@axe-core/playwright`).
- **Diagnóstico inicial**: axe daba 0 violaciones, pero la revisión manual del árbol de accesibilidad y con teclado
  mostró barreras reales: campos anunciados por su placeholder, sin encabezados, íconos leídos como caracteres vacíos,
  avatar de cuenta como `div` sin rol, foco de 1 px negro invisible sobre fondos oscuros, `lang="en"`, el mismo
  título en todas las páginas, chips de 36 px y cambios dinámicos que no se anunciaban. *Lo automático no alcanza.*
- **Las 9 pautas de la clase, aplicadas:**

| # | Pauta | Implementación | WCAG |
|---|---|---|---|
| 1 | Etiquetas asociadas | `Campo`: label visible + `accessibilityLabel` (no el placeholder) | 1.3.1 · 3.3.2 · 4.1.2 |
| 2 | Contraste | Todos los pares del tema medidos ≥ 4.5:1; borde de campos y chips `#857F8F` (3,87:1, WCAG 1.4.11) | 1.4.3 · 1.4.11 |
| 3 | Errores claros | Ícono + texto que dice cómo corregir, `aria-invalid`, `aria-describedby`, borde de 2 px | 1.4.1 · 3.3.1 · 3.3.3 |
| 4 | Foco visible | `:focus-visible` con anillo azul de 3 px + halo crema (contrasta en fondos claros y oscuros) | 2.4.7 |
| 5 | Semántica | Botones reales, encabezados h1/h2/h3, `banner`, `group`, `list`, `progressbar`, `link`; sin controles anidados | 1.3.1 · 4.1.2 |
| 6 | Tamaño táctil | Mínimo 44×44 px en chips, estrellas, contador, volver, quitar, limpiar búsqueda; texto de inputs a 16 px | 2.5.8 |
| 7 | Tipo de input | `inputMode`/`keyboardType` (decimal, numeric, url, search), `enterKeyHint`, `autoComplete="off"` en datos del evento | 1.3.5 |
| 8 | Botones de ícono | `Icono` decorativo (`aria-hidden`); botones con nombre ("Volver", "Enviar mensaje"); favoritos con `aria-pressed` | 1.1.1 · 4.1.2 |
| 9 | Mensajes dinámicos | `role="alert"` en errores, `aria-live` en resultados, cantidad, total y mensajes nuevos del chat; foco al primer error | 4.1.3 · 2.4.3 |

- **Además:** `lang="es"` (3.1.1); título de página propio por pantalla con `expo-router/head` (2.4.2);
  estados de compra y filtros activos que no dependen sólo del color (texto + ✓) (1.4.1); `prefers-reduced-motion`
  (2.3.3); estrellas como imagen con texto alternativo ("Puntaje 4,5 de 5"); barras de progreso con valores;
  en mobile, las tarjetas se leen como una unidad con un resumen (VoiceOver/TalkBack), y en web el nombre sale del
  texto visible para cumplir **2.5.3 Label in Name** (control por voz).
- **Verificación automática (como en la clase):** suite **Playwright** en `packages/frontend/e2e/` que corre en
  **web y mobile** (Desktop Chrome + Pixel 7): axe con etiquetas WCAG 2.0/2.1/2.2 A/AA en las 10 pantallas,
  test del formulario con errores (foco, `aria-invalid`, descripción), navegación sólo con teclado y flujos críticos
  con selectores `getByRole`/`getByLabel` (que sólo funcionan si la interfaz es accesible) y un servidor caído simulado.
  **90 tests pasando** (web, mobile y mobile en modo oscuro). `npm run test:e2e`.
- Pendiente manual (no automatizable): probar con lectores reales (TalkBack, VoiceOver, NVDA) y zoom al 200%.

### D-22 — Modo oscuro
- Decisión: por defecto la app **sigue la preferencia del sistema** (`useColorScheme`); un botón de 44 px junto al
  avatar (y en el login) recorre **Sistema → Claro → Oscuro**. La elección se guarda en `AsyncStorage` (en web,
  `localStorage`) y se anuncia al lector de pantalla. En web también se ajusta `color-scheme` (barras de scroll y
  controles nativos del navegador).
- Arquitectura: `TemaContext` (mismo patrón que `SesionContext` y el `CartContext` de clase) expone `colores`,
  `texto` y `estados` del tema actual; el custom hook `useEstilos(crearEstilos)` regenera los `StyleSheet` sólo
  cuando cambia el tema. Cada archivo define sus estilos como función del tema en vez de un objeto fijo.
- **Colores por rol, no por tono**: en el tema claro un mismo violeta (`tinta`) se usaba como texto, como fondo
  de botón y como fondo de cabecera; en oscuro esos usos necesitan valores distintos. Se separaron en roles:
  `texto`, `primario`/`sobrePrimario` (botones, chip activo, mensaje propio), `panel`/`sobrePanel` (cabeceras y
  paneles oscuros), `ticket`, `acento`/`sobreAcento`, `exito`/`exitoBoton`, `errorFondo`, etc. (`src/theme.js`).
- Paleta oscura con identidad propia (violeta muy oscuro `#121018`, superficies `#1C1826`, coral igual) y
  **contraste verificado**: todos los pares texto/fondo ≥ 4.5:1, bordes de controles ≥ 3:1, estados de compra con
  variantes oscuras (7–8.5:1).
- Verificación: el proyecto `mobile-oscuro` de Playwright emula `prefers-color-scheme: dark` y corre axe en las 10
  pantallas; `e2e/tema.spec.mjs` prueba el botón (sistema → claro → oscuro) y que la preferencia sobreviva a recargar.

### D-23 — Cerrar sesión explícito y diálogos propios
- Contexto: cerrar sesión estaba "escondido" en el avatar (había que adivinar que al tocarlo se salía), y las
  confirmaciones usaban `window.confirm` / `Alert.alert`: aspecto del sistema, sin el tema y con botones "Sí / No".
- Opciones evaluadas con el alumno: botón "Salir" siempre visible vs. menú "Cuenta"; avisos de éxito en modal vs.
  aviso no bloqueante. Decisión: **menú "Cuenta"** y **aviso abajo** para los éxitos.
- **Menú "Cuenta"**: botón con texto visible "Cuenta" (no sólo un ícono) que abre una hoja inferior con nombre y
  rol, el selector de tema (Sistema / Claro / Oscuro, con texto y semántica de radio) y un botón explícito
  **"Cerrar sesión"** con ícono, que pide confirmación y anuncia "Cerraste sesión".
- **Diálogos propios** (`ModalAccesible` + `DialogosContext`), iguales en web y mobile y con el tema:
  `role="dialog"`, `aria-modal`, nombre accesible = título (`aria-labelledby`), foco atrapado, cierre con Esc
  (web) o con "atrás" (Android) y **devolución del foco** al botón que lo abrió (WCAG 2.4.3). Los botones dicen
  qué pasa ("Sí, cancelar la compra" / "No, conservarla"; "Sí, cerrar sesión" / "Seguir en mi cuenta") y van en el
  mismo orden visual y de foco: primero la opción segura (WCAG 1.3.2). La acción destructiva usa el rojo de error.
- **Avisos**: los éxitos ("¡Pago confirmado!") son un aviso no bloqueante abajo, con `role="status"` (se lee en voz
  alta), que se cierra solo a los 6 s o con su botón; los errores siguen siendo modales porque requieren atención.
- Las pantallas siguen llamando `confirmar()` / `avisarExito()` / `avisarError()` de `utils/confirmar.js`, que
  delegan en el provider: el cambio no tocó la lógica de cada pantalla.
- Detalle técnico encontrado al testear: react-native-web pone `role="dialog"` en un contenedor externo y recién al
  terminar la animación; el nombre se asigna buscando el contenedor por `aria-modal` desde una *callback ref*.
- Verificación: `e2e/cuenta.spec.mjs` (cerrar sesión con confirmación, arrepentirse, Esc + retorno del foco, axe
  con el menú y con el diálogo abiertos). Suite completa: 61 tests en ese momento.

### D-24 — Fecha del evento con calendario
- Contexto: la fecha se escribía a mano como `AAAA-MM-DD` (propenso a errores y poco intuitivo) y sólo se avisaba
  después que una fecha pasada no era válida.
- Decisión: **calendario propio** (`src/components/Calendario.js` + `CampoFecha.js`) en una hoja inferior, en vez
  de una librería: funciona igual en web y en Expo Go (el selector nativo no funciona en web), usa el tema y
  permite controlar la accesibilidad.
- Reglas: **sólo se puede elegir desde hoy**; los días anteriores están deshabilitados (además de atenuados, se
  tachan: no depende sólo del color) y "Mes anterior" se deshabilita en el mes actual. Si se elige hoy, la hora
  tiene que ser posterior a la actual (el error se marca en el campo Hora). El backend mantiene su propia
  validación de fecha futura.
- Accesibilidad: cada día es un botón de 44 px con la fecha completa como nombre ("lunes 26 de octubre de 2026,
  hoy" / "…, no disponible"), el día elegido con `aria-pressed`, el mes se anuncia al cambiar, la fecha elegida
  se anuncia, y el campo es un botón con `aria-haspopup="dialog"`, `aria-invalid` y error asociado.
- Verificación: `e2e/calendario.spec.mjs` (días pasados deshabilitados, publicar un evento eligiendo la fecha,
  axe con el calendario abierto). Suite completa: **70 tests**.

### D-25 — El organizador lee sus propias reseñas
- Contexto: el organizador veía su reputación (★ promedio) en "Mis eventos" pero no podía leer qué le escribieron.
- Decisión: la métrica de reputación pasa a ser un **botón "mis reseñas"** (borde visible + chevron para que se
  note que se toca) que abre la pantalla de reseñas del organizador (`/organizador/:id`, HU-12). Si es la propia,
  el título dice "Mis reseñas" y el vacío explica que aparecen cuando los compradores califican sus eventos.
  No hizo falta backend nuevo: reutiliza `GET /usuario/:id/resenias`.
- Tests: E2E "HU-12: el organizador lee sus reseñas desde Mis eventos" (suite total **72 tests**).
  Capturas `docs/capturas/63-mis-eventos-resenias.png` y `64-mis-resenias.png`.

### D-26 — Mensajes sin leer (M8)
- Contexto: el organizador recibe mensajes de muchas compras y sólo se enteraba entrando a cada chat.
- Decisión: `Compra.ultimaLectura` guarda hasta cuándo leyó cada participante; `mensajesSinLeerPara(usuario)`
  cuenta los mensajes **de la otra parte** posteriores. Se marcan leídos con un **endpoint explícito**
  `POST /compra/:id/mensajes/leidos` (204) que el front llama al abrir el chat y cuando llegan mensajes con el
  chat abierto. Alternativa descartada: marcar en el `GET` del chat, porque el sondeo lo llama cada 4 s y un GET
  no debería modificar datos. Quien escribe da por leída la conversación.
- Dónde se ve: insignia "N nuevo(s)" en "Mis eventos" (suma por evento), en "Ver compras", en "Mis entradas" y en
  el botón del chat. Accesibilidad: dice el número (no sólo un color) y el lector anuncia "N mensajes sin leer".

### D-27 — Galería del evento (M8)
- Contexto: el enunciado habla de "material multimedia" y sólo se mostraba la primera imagen.
- Decisión: si el evento tiene varias fotos, la portada del detalle es un **carrusel** (`src/components/Galeria.js`):
  se desliza con el dedo y tiene botones "Foto anterior/siguiente" de 44 px, puntos (el activo también es más
  ancho, no sólo de otro color) y "Foto N de M" anunciado. Con una sola foto, la portada queda igual.

### D-28 — Reseñas por evento (M8)
- Decisión: en "Mis eventos" > Realizados cada evento tiene "Ver reseñas (n)" con sus estrellas, que abre
  "Reseñas del evento" (`/evento/:id/resenias`). En el detalle de un evento realizado aparece "Reseñas de este
  evento" (y la sección de reseñas del organizador deja de repetirlas). El backend agrega a
  `GET /evento/:id/resenias` el evento y su promedio, y a `GET /evento/mios` la reputación de cada evento.
- Tests M8: backend **133** (+9: `int/m8-mejoras`, unitario de `Compra`), E2E **90** (+ `e2e/mejoras.spec.mjs`
  y dos pantallas nuevas en el chequeo de axe). Capturas `docs/capturas/65-` a `70-`. Spec: `specs/M8-mejoras.md`.

### D-29 — Autenticación real con JWT (M9, versión pro)
- Contexto: el TP original identificaba al usuario con el header `x-user-id` (D-03), cómodo para probar pero sin
  ninguna seguridad: cualquiera podía operar como cualquier usuario.
- Decisión: **email + contraseña** con hash **bcrypt** y sesión con **JWT** (`Authorization: Bearer`, 8 h).
  `POST /auth/registro`, `POST /auth/login`, `GET /auth/me`. El middleware conserva la misma interfaz
  (`usuarioOpcional` / `requiereUsuario` / `requiereRol`), así que **ninguna ruta tuvo que cambiar**: sólo cambió
  cómo se resuelve `req.usuario`. Es la ventaja de haber aislado la identificación en un middleware desde M1.
- Seguridad: mensaje único ante credenciales inválidas, límite de 10 intentos fallidos por IP cada 15 min
  (`express-rate-limit`, 429), contraseña 8–72 caracteres con letra y número (72 es el límite de bcrypt),
  `JWT_SECRET` obligatorio en producción, el email no se expone en listados.
- Frontend: formulario de login y de registro accesibles, token guardado cifrado en el celular
  (`expo-secure-store`) y en `localStorage` en web; si el backend rechaza el token, se cierra la sesión y se avisa.
  "Cuentas de prueba" en el login completan el formulario (agiliza la demo sin saltear el login real).
- Tests: el helper `auth(usuarioId)` firma un JWT como el login; se reemplazaron los 63 `x-user-id` de los tests.
- **Decisiones tomadas sin consultar** (para revisar):
  - `bcryptjs` en lugar de `bcrypt`: mismo algoritmo, pero en JavaScript puro (no necesita compilar código nativo).
  - `x-user-id` se eliminó por completo (no queda como "modo desarrollo") para no dejar una puerta trasera.
  - Los usuarios demo comparten la contraseña `ticketit123` y el hash se calcula una sola vez al arrancar.

### D-30 — Perfil (M10)
- "Mi perfil" en el menú Cuenta: editar nombre y apellido (`PATCH /usuario/me`) y cambiar la contraseña
  (`POST /auth/cambiar-password`, pide la actual: si alguien agarra el celular desbloqueado no puede cambiarla).
- **Sin consultar**: el email no se puede cambiar (identifica la cuenta; cambiarlo requeriría verificar el nuevo
  por correo, fuera de alcance). Cambiar la contraseña no invalida los otros tokens ya emitidos (con JWT sin
  estado haría falta una lista de revocación; se anota como mejora).

### D-31 — Editar y cancelar eventos (M11, requerimiento nuevo)
- Contexto: el enunciado sólo pide crear eventos; en un producto real el organizador necesita corregirlos y, si
  no se pueden hacer, cancelarlos devolviendo el dinero.
- Decisión: **editar** reutiliza el formulario de publicación (mismo schema Zod + `id` en los tipos existentes);
  la entidad `Evento.actualizar()` protege las ventas (no baja el cupo debajo de lo vendido ni quita tipos con
  ventas) y modifica los mismos objetos `TipoEntrada` que referencian las compras, así que las compras viejas
  conservan su total. **Cancelar** (`Evento.cancelar()`) reutiliza `Compra.cancelar()` (máquina de estados de
  M4) con la opción `porCancelacionDelEvento`, y el reembolso automático sale gratis de lo ya hecho.
- **Sin consultar**: el motivo de cancelación es obligatorio (los compradores lo ven); los eventos cancelados no
  se borran (baja lógica, como recomienda la clase) y quedan en "Mis eventos" > Cancelados.

### D-32 — Notificaciones in-app (M12)
- Contexto: el usuario se enteraba de una venta, un mensaje o una cancelación sólo si entraba a la pantalla.
- Decisión: entidad `Notificacion` con estados `LEIDA`/`NO_LEIDA` (como la rama de notificaciones de clase) más
  destinatario, tipo y link. Un `NotificacionService` arma los textos; los demás services sólo le avisan qué
  pasó (`compraPagada`, `mensajeNuevo`, `eventoCancelado`...). Se inyecta por constructor con un valor por
  defecto que no hace nada (`SIN_NOTIFICACIONES`), así los tests unitarios existentes no cambiaron.
- Frontend: campana en el encabezado con el contador (contexto compartido + sondeo cada 15 s, mismo patrón que el
  chat y el popup de clase), pantalla de notificaciones, "marcar todas como leídas". El encabezado se reorganizó:
  arriba saludo + campana + Cuenta, abajo el título + la acción de la pantalla (no entraba todo en una fila).
- **Sin consultar**: sondeo en lugar de WebSockets/push (más simple y alcanza para la demo; push real requiere
  servicios externos). Los avisos de mensajes de un mismo chat se agrupan para no inundar la lista.

### D-33 — Entrada con QR y validación en la puerta (M13)
- Contexto: "marcar utilizada" (M4) obligaba al organizador a buscar la compra en una lista; en la puerta de un
  evento real se escanea la entrada.
- Decisión: al pagar, la compra recibe un **código** `TK-XXXX-XXXX` (alfabeto sin caracteres confusos, generado
  con `crypto.randomInt`, verificado único). El comprador lo ve como **QR** (`react-native-qrcode-svg`) y en texto;
  el organizador lo valida en "Validar entradas" escaneando con `expo-camera` o escribiéndolo
  (`POST /evento/:id/validar`), que reutiliza `Compra.utilizar()` y su regla "desde el día del evento".
- **Sin consultar**: un código por compra (vale para todas sus entradas), no uno por entrada; el QR contiene sólo
  el código (no datos personales); el escaneo con cámara se ofrece sólo en el celular. `app.json` pasó a
  `userInterfaceStyle: automatic` para que el modo oscuro del sistema también llegue en el celular.

### D-34 — Estadísticas del evento (M14)
- Decisión: endpoint `GET /evento/:id/estadisticas` que calcula todo en el service a partir de las compras (como
  los campos calculados con `toObject()` de la clase, sin guardar números duplicados).
- Gráficos hechos con `View` (sin librería: funcionan igual en web y celular y respetan el tema). Siguiendo la
  guía de visualización: indicadores grandes para los números sueltos, columnas por día para la evolución (un solo
  dato → sin leyenda, el título lo nombra), etiqueta sólo en el máximo, barras de 4 px redondeadas y separadas 2
  px, y el color de las marcas **validado** con el script de la guía en los dos temas (en oscuro el coral de la
  marca no pasaba la banda de luminosidad: se usa `#F0532F`, token `dato`).
- Accesibilidad: resumen en texto + "Ver como tabla" (en el celular no hay *hover*, así que la tabla reemplaza
  al tooltip).

### D-35 — Calidad e infraestructura (versión pro)
- **Backend**: `helmet` (headers de seguridad, sin `X-Powered-By`; CSP desactivada porque la API sólo devuelve JSON
  y Swagger UI usa scripts en línea), límite de 100 kB en el body (413), `X-Request-Id` + log con status y
  duración, **configuración validada con Zod al arrancar** (en producción exige `JWT_SECRET` de 32+ caracteres y el
  servidor no arranca si falta), cierre ordenado ante `SIGTERM`/`SIGINT`.
- **Docker**: `packages/backend/Dockerfile` (usuario sin privilegios, healthcheck) y `packages/frontend/Dockerfile`
  (build estático de la web servido con nginx, con fallback para el router), `docker-compose.yml` con puertos
  configurables (`API_PORT`, `WEB_PORT`). Verificado: compose levanta los dos servicios sanos y un navegador hace
  login y ve el catálogo sobre la build de producción.
- **CI** (`.github/workflows/ci.yml`): lint, formato, tests con cobertura (artefacto), E2E + axe y build de imágenes.
- **Lint**: ESLint ahora revisa también el frontend con las reglas de React y de hooks (antes estaba excluido): se
  corrigieron 38 avisos (imports sin usar, un componente sin nombre) y `npm run lint` falla ante cualquier aviso.
  Prettier con `npm run format:check`. Cobertura del backend: 95 % de líneas, 82 % de ramas (umbral 90/80).
- **Frontend**: pantalla 404 propia, "deslizar para recargar" en todas las listas, colores de marca en `app.json`.
- **Sin consultar**: `ALLOWED_ORIGINS` en compose apunta sólo a la web; `/dev/reset` responde 403 en producción.

## 5. Avance

### Backend — completo (M0 a M6)
- **Estado**: los 7 módulos implementados, **133 tests pasando** (103 de integración + 30 unitarios; incluye M8), ESLint sin errores.
- **Specs**: `specs/M0-nucleo.md` … `specs/M6-resenias.md`, cada criterio de aceptación tiene su test.
- **Documentación de la API**: Swagger UI en `http://localhost:3000/api-docs` con todos los endpoints, schemas,
  ejemplos, códigos de error y botón *Authorize* para el header `x-user-id`.
- **Verificación end-to-end** contra el server real: comprar → pagar → chatear (comprador y organizador) → ver
  ventas del evento → cancelar con reembolso automático y liberación de cupo.

| Módulo | Archivos principales | Tests |
|---|---|---|
| M0 Núcleo | `server.js`, `app.js`, `index.js`, `error/appError.js`, `middlewares/errorHandler.js`, `utils/*`, `routes/swaggerRoutes.js` | `int/m0-nucleo` (6), `unit/utils` (6) |
| M1 Usuarios | `models/entities/usuario.js`, `models/repositories/inMemoryRepository.js`, `middlewares/usuarioMiddleware.js`, `data/seed.js` | `int/m1-usuarios` (14) |
| M2 Eventos | `models/entities/evento.js`, `tipoEntrada.js`, `services/eventoService.js`, `controllers/eventoController.js` | `int/m2-eventos` (24) |
| M3 Compras | `models/entities/compra.js`, `services/compraService.js`, `dtos/compraDTO.js` | `int/m3-compras` (18), `unit/compraService` (4) |
| M4 Ciclo de vida | `models/entities/compra.js`, `estadoCompra.js` (máquina de estados) | `int/m4-ciclo-compra` (14) |
| M5 Mensajería | `models/entities/mensaje.js`, `services/mensajeService.js` | `int/m5-mensajes` (8) |
| M6 Reseñas | `models/entities/resenia.js`, `models/repositories/reseniaRepository.js`, `services/reseniaService.js` | `int/m6-resenias` (11) |
| M8 Mejoras | `compra.js` (lectura de mensajes), `reseniaRepository.reputacionDeEvento` | `int/m8-mejoras` (8) |
| Entidades | — | `unit/entidades` (20) |

### Frontend — completo (M7)
- **Spec**: `specs/M7-frontend.md`. 13 pantallas que cubren las 12 HU + favoritos.
- **Verificación**: `expo export` compila sin errores, `expo-doctor` 20/20, y un recorrido automatizado en un navegador
  headless (Chromium + Puppeteer, viewport de celular) contra el backend real, **sin errores de consola**:
  login → explorar → detalle → comprar → pagar → chat → mis compras → ordenar por puntaje (comprador);
  cancelar con reembolso; reseñar; mis eventos → compras del evento → marcar utilizada → publicar evento (organizador).
- **Capturas** en `docs/capturas/` (útiles para el video), tomadas después del rediseño (D-20); las `30-` y `31-`
  muestran los errores accesibles del formulario y el foco visible (D-21).
- **Tests E2E + accesibilidad** (D-21, D-22): `npm run test:e2e` — Playwright + axe en web, mobile y mobile en modo oscuro.
- **Modo oscuro** (D-22): sigue al sistema o se fija con el botón de tema; capturas `40-` en `docs/capturas/`.

| Pantalla | Archivo | HU |
|---|---|---|
| Login (elegir usuario) | `src/features/login/Login.js` | D-03 |
| Explorar | `src/features/explorar/Explorar.js` | HU-02, HU-03 |
| Detalle de evento + compra | `src/features/evento/EventoDetalle.js` | HU-04, HU-12, favoritos |
| Reseñas del organizador | `src/features/evento/ReseniasOrganizador.js` | HU-12 |
| Calificar evento | `src/features/evento/Reseniar.js` | HU-11 |
| Mis compras | `src/features/compras/MisCompras.js` | HU-05 |
| Detalle de compra | `src/features/compras/CompraDetalle.js` | HU-09, HU-10, pagar, utilizar |
| Chat | `src/features/compras/Chat.js` | HU-07, HU-08 |
| Favoritos | `src/features/favoritos/Favoritos.js` | favoritos |
| Mis eventos | `src/features/organizador/MisEventos.js` | ventas |
| Compras de un evento | `src/features/organizador/ComprasDeEvento.js` | HU-06 |
| Publicar evento | `src/features/organizador/CrearEvento.js` | HU-01 |

## 6. Uso de IA durante el desarrollo (para la conclusión del video)

Registro de observaciones sobre el uso de IA: qué aceleró, qué hubo que corregir, decisiones que la IA consultó
en lugar de asumir, errores detectados en el código de referencia, etc.

- Relevamiento automático de 15 ramas del repo de clase y síntesis en una skill reutilizable: permitió que todo el
  código generado siga el mismo estilo. La IA detectó además bugs en el código de clase (imports faltantes,
  `dotenv` cargado tarde, errores tragados en rutas) que se decidió no replicar.
- **Análisis exigente del enunciado**: además de las 12 HU, la IA encontró 14 requerimientos implícitos (R-01 a R-14)
  que el front iba a necesitar (detalle de compra, "mis eventos", acciones disponibles, polling del chat, etc.).
  Hacerlo antes de codear evitó tener que volver sobre el backend.
- **La IA preguntó en vez de asumir** en las decisiones de negocio ambiguas (persistencia, roles, reembolso,
  lugar del evento, tope por compra, cuándo se "utiliza" una entrada, escala de puntuación). Las decisiones quedaron
  registradas como ADRs (D-01 a D-17) — criterio humano sobre la propuesta de la IA.
- **Velocidad**: el backend completo (7 módulos, ~30 endpoints, Swagger, 124 tests) se generó en una sola sesión.
  Los tests pasaron en la primera corrida, lo que se explica porque las specs fijaban de antemano los criterios.
- **Errores de la IA detectados en el proceso**: un `sed` para cambiar los scripts de test rompió las comillas del
  `package.json` (lo detectó Prettier y se corrigió); el `import` de ES Modules ejecuta antes que `dotenv.config()`,
  un problema sutil que hubiese pasado inadvertido copiando el código de clase.
- **Riesgo observado**: el volumen de código generado es grande; sin specs y tests sería difícil revisar que haga lo
  que dice. La revisión humana se apoya en los criterios de aceptación y en Swagger para probar a mano.
- **"No confiar en lo que la IA recuerda"**: la plantilla de Expo trae un `AGENTS.md` que advierte que Expo cambia en
  cada SDK. Antes de escribir el front se consultó la documentación de SDK 58 (instalación de Expo Router, rutas
  protegidas) en vez de escribir de memoria. La plantilla también traía una configuración que habilitaba un plugin
  de Claude que nadie había pedido; se eliminó.
- **La IA verificó su propio front con un navegador**: tomó capturas de cada pantalla y así detectó detalles visuales
  ("09:00 p. m. hs", "1 mensajes", un botón con texto demasiado largo) que se corrigieron. También se equivocó en
  su propio script de prueba (hizo clic entre dos estrellas, o en el título "Publicar evento" en vez del botón) y
  al principio levantó Expo en modo CI, que no recarga los cambios: parecía que las correcciones no funcionaban.
  Distinguir un error de la app de un error de la prueba requirió mirar las capturas, no sólo el resultado.
- **Diseño antes que código**: el rediseño se hizo primero en Claude Design (8 pantallas en un lienzo, revisables y
  comentables) y después se tradujo a React Native. Separar "cómo se ve" de "cómo se implementa" permitió validar la
  propuesta antes de reescribir 13 pantallas. Al comparar las capturas de la app con el diseño aparecieron detalles que
  el diseño estático no mostraba (la fecha tapada por la hoja del detalle, montos largos que no entraban, un avatar
  oscuro sobre cabecera oscura) y se corrigieron.

- **Accesibilidad: la herramienta automática dio "0 violaciones" y estaba mal.** La primera auditoría con axe pasó
  limpia, pero al mirar el árbol de accesibilidad (lo que "escucha" un lector de pantalla) y navegar con Tab
  aparecieron barreras reales. Y al revés: cuando se agregó Playwright con más reglas (WCAG 2.1), axe marcó que los
  nombres accesibles que la IA había escrito para "mejorar" la lectura rompían la pauta 2.5.3 (el nombre debe
  contener el texto visible). La solución correcta dependía de la plataforma (resumen en mobile, texto visible en
  web). La IA también se corrigió a sí misma dos veces en el camino: ocultó un bloque decorativo que contenía
  botones reales, y anidó un selector de cantidad dentro de otro botón; ambos se detectaron revisando antes de
  probar. Conclusión: accesibilidad requiere criterio y verificación en varias capas, no sólo "pasar el linter".

- **Modo oscuro: un refactor que el diseño escondía.** Agregar un tema oscuro parecía cambiar colores, pero obligó
  a separar los colores por rol (un mismo violeta era texto, botón y cabecera a la vez). La conversión mecánica de 19
  archivos la hizo un script, y la asignación de roles se revisó caso por caso. La app compilaba, pero un chequeo
  en navegador mostró `colores is not defined`: dos componentes y un `forwardRef` habían quedado sin el hook del
  tema. Lo detectaron los tests E2E (todas las pantallas en blanco) y un chequeo estático escrito ad hoc; compilar
  no alcanzaba como verificación.

- **Decisiones de UX consultadas, no asumidas**: para el menú de cuenta y los avisos la IA presentó opciones con
  bocetos (preview) y su recomendación; el alumno eligió. El test de "foco que vuelve al cerrar con Esc" y el de axe
  con el diálogo abierto detectaron que el diálogo no tenía nombre accesible: un problema invisible en pantalla.

## 7. Guion sugerido para la exposición

1. Problema y dominio (diagrama de clases del enunciado).
2. Metodología SDD + HU: mostrar una spec y su trazabilidad a tests.
3. Flujo elegido — Back-End: ruta → controller → service → entidad → repositorio; manejo de errores.
   Flujo sugerido: **cancelar una compra (HU-09/HU-10)**, porque recorre todas las capas y muestra el modelo rico:
   `routes/compraRoutes.js` (`requiereUsuario` + `requiereRol`) → `CompraController.cancelar` → `CompraService.cancelar`
   (permisos) → `Compra.cancelar()` (reglas HU-10, máquina de estados, reembolso automático, libera cupo) →
   `CompraRepository.save` → `compraDTO` (estado, historial, acciones). Errores 403/422 por el `errorHandler` global.
   Mostrarlo en Swagger con la compra 1 (`x-user-id: 3`) y luego intentar cancelar la 5 (UTILIZADA → 422).
4. Flujo elegido — Front-End: pantalla → api → estado. Para cancelar una compra:
   `app/compra/[id]/index.js` → `CompraDetalle.js` (`useCarga(getCompra)`; los botones salen de
   `accionesDisponibles`) → `confirmar()` → `cancelarCompra()` en `src/api/api.js` (axios + interceptor con
   `x-user-id`) → se actualiza el estado con la respuesta (estado REEMBOLSADA + historial).
5. Demo en la interfaz: entrar como Sofía → Mis compras → compra "Noche Indie" confirmada → Cancelar → ver el
   seguimiento; luego entrar como Lucía → Mis eventos → Ver compras → el cupo liberado.
6. Conclusión sobre IA: ventajas, desventajas, dificultades, aprendizajes, impacto en productividad/calidad.
