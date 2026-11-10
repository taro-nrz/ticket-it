# Guion de la exposición (video de 5 a 10 minutos)

Lo que pide el enunciado:
- **un** flujo funcional explicado de punta a punta;
- su implementación en el **Back-End**;
- su implementación en el **Front-End**;
- el recorrido en la **interfaz**;
- una **conclusión** sobre el uso de IA.

Se valora sobre todo el **criterio** y la **justificación de las decisiones**. Por eso el guion no sólo muestra
*qué* hace cada archivo: también dice **por qué** está hecho así, que es lo que demuestra que entendiste los temas.

## El flujo elegido: "Comprar una entrada y cancelarla con reembolso"

Es el ciclo de vida de una compra. Recorre todas las capas y toca 5 de las 12 historias del enunciado:

| HU | Qué se ve en el flujo |
|---|---|
| HU-04 | Comprar eligiendo tipo de entrada y cantidad **sin superar el cupo** |
| HU-05 | Ver mis compras con su **estado** y los **días que faltan** si está confirmada |
| HU-06 | El organizador ve las compras del evento y **cuántas entradas quedan** de cada tipo |
| HU-09 | Cancelar una compra y obtener el **reembolso** |
| HU-10 | Sólo se puede cancelar si **no está utilizada** y el evento **no se realizó** |

Datos de la semilla que sirven para la demo:
- **Evento**: "Superclásico de verano", organizado por Martín.
- **Tipo de entrada**: Platea, con **cupo 2 y 1 ya vendida**. Queda exactamente 1, así que se ve el tope del cupo en vivo.
- **Comprador**: Juan (`juan@ticketit.com` / `ticketit123`).
- **Organizador**: Martín (`martin@ticketit.com` / `ticketit123`).

---

## Antes de grabar (checklist)

1. **Reiniciá el backend.** Los datos están en memoria: cada vez que arranca vuelve a la semilla. Así, si
   ensayaste antes, el cupo vuelve a 1.
   ```bash
   cd ticket-it-pro
   REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.44 npm run start:dev
   ```
2. **Prepará el celular.**
   - Conectá la depuración inalámbrica: `adb connect 192.168.1.35:<puerto>`.
   - Duplicá la pantalla con `scrcpy -s 192.168.1.35:<puerto> --stay-awake`.
   - Abrí la app con `adb shell am start -d exp://192.168.1.44:8081 host.exp.exponent`.
3. **Prepará Swagger.** Abrí `http://localhost:3000/api-docs`. Hacé `POST /auth/login` con Juan, copiá el
   token y pegalo en *Authorize*.
4. **Abrí estas pestañas en el editor, en este orden:**
   1. `specs/M3-compras.md`
   2. `routes/compraRoutes.js`
   3. `controllers/compraController.js`
   4. `services/compraService.js`
   5. `models/entities/tipoEntrada.js`
   6. `models/entities/compra.js`
   7. `models/entities/estadoCompra.js`
   8. `error/appError.js` + `middlewares/errorHandler.js`
   9. `test/int/m3-compras.int.test.js`
   10. `features/evento/EventoDetalle.jsx`
   11. `service/comprasService.js` + `service/api.js`
   12. `hooks/useAccion.js`
   13. `features/compras/CompraDetalle.jsx`
5. Cerrá las notificaciones de la compu y del celular.

---

## Guion minuto a minuto (~9 minutos)

### 1. Presentación y dominio (0:00 – 0:45)
> "AI Ticket It conecta a quienes organizan eventos con quienes compran entradas. El back es Node con Express y el
> front es React Native con Expo, que corre en el celular, como pide el enunciado. La persistencia es en memoria.
> Voy a mostrar el ciclo de vida de una compra: comprar sin superar el cupo, pagar, verla en *Mis compras* y
> cancelarla con reembolso."

- Mostrá el **diagrama del enunciado**: Evento → TipoEntrada (precio, cupo) → Compra (estado, historial).
- **Por qué importa**: la compra es una **máquina de estados**. Ese es el corazón del flujo.

### 2. Cómo se trabajó: specs y tests (0:45 – 1:30)
- Abrí `specs/M3-compras.md` y mostrá la HU-04 con sus criterios de aceptación. Por ejemplo, **CA-2**: "superar el
  cupo → 422 indicando cuántas quedan".
- Abrí `test/int/m3-compras.int.test.js` y mostrá el test **"CA-2: superar el cupo disponible responde 422"**.
  > "Trabajé con SDD: primero la spec con historias de usuario y criterios, después la implementación. Cada
  > criterio tiene su test. Así pude revisar lo que generaba la IA contra algo concreto."

### 3. Demo, primera parte: comprar (1:30 – 3:00) — en el celular
1. Ingresá como **Juan**. Mostrá que el **login** te lleva a la sección de comprador (rol COMPRADOR).
2. En **Explorar**, buscá "super" (búsqueda textual) y probá un filtro por categoría y el **orden**. Así se ven
   HU-02, HU-03 y HU-11 sin detenerte.
3. Entrá al **Superclásico**. La Platea dice **"1 disponibles"**. Elegila e intentá subir la cantidad: **el `+` se
   deshabilita en 1**.
   > "El front no deja superar el cupo, pero la regla real vive en el back. Ahora lo muestro."
4. Comprá 1. La compra nace **PENDIENTE**, con 15 minutos para pagar. Pagá con la **tarjeta de prueba**.
5. En **Mis entradas**, la compra aparece **CONFIRMADA** y dice **"Faltan 30 días"** (HU-05). El estado se
   muestra con **texto y color**, no sólo con color, por accesibilidad.

### 4. Back-End: el recorrido de una request (3:00 – 5:30)
Contalo como el viaje de `POST /compra` y después mostrá en qué cambia `POST /compra/:id/cancelar`.

| Capa | Archivo | Qué decir (el *por qué*) |
|---|---|---|
| Ruta | `routes/compraRoutes.js` | `router.post("/compra", requiereUsuario, requiereRol(COMPRADOR), …)`. Los **middlewares** cortan antes de llegar al controller: sin token → **401**, si sos organizador → **403**. Las rutas reciben `getController` (*factory*, como en clase) |
| Auth | `middlewares/usuarioMiddleware.js` | Lee `Authorization: Bearer <JWT>`, verifica la firma y deja `req.usuario`. Al pasar de `x-user-id` a JWT **no cambió ninguna ruta**, porque la identificación estaba aislada en un middleware |
| Controller | `controllers/compraController.js` → `create` | Sólo HTTP: **valida el body con Zod** (`comprarSchema`: tipos y que la cantidad sea un entero positivo) → **400** con los errores por campo. Llama al service y responde **201**. `try/catch` → `next(error)` |
| Service | `services/compraService.js` → `comprar` | **Orquesta**: busca el evento en el repositorio (**404** si no existe), revisa que no esté cancelado ni haya pasado (**422**) y pide al tipo de entrada que reserve. Las dependencias entran **por constructor**: repositorios, el **reloj** (para testear fechas), notificaciones. Devuelve un **DTO**, no la entidad |
| Entidad | `models/entities/tipoEntrada.js` → `hayCupoPara` / `reservar` | **Modelo rico**: la regla "no superar el cupo" está en el objeto que tiene el dato. Si no hay cupo, `reservar` lanza `BusinessRuleError("…quedan N…")` |
| Entidad | `models/entities/compra.js` + `estadoCompra.js` | `EstadoCompra` es un **falso enum** (`Object.freeze`, como en clase). `TRANSICIONES_VALIDAS` define la **máquina de estados**, y `actualizarEstado` rechaza los saltos inválidos y guarda el **historial** (quién y cuándo) |
| Repositorio | `models/repositories/compraRepository.js` | **En memoria**, pero con **interfaz async** (`findById`, `save`…) igual que uno de Mongoose: cambiar la persistencia sólo tocaría esta capa |
| DTO | `dtos/compraDTO.js` | Arma lo que necesita la pantalla: estado, `diasRestantes` y **`accionesDisponibles`** (`PAGAR`, `CANCELAR`…). Así el front no duplica las reglas |
| Errores | `error/appError.js` + `middlewares/errorHandler.js` | **Jerarquía de errores**: `AppError` → `ValidationError` (400), `ForbiddenError` (403), `NotFoundError` (404), `BusinessRuleError` (422). Un solo `errorHandler` global los convierte en JSON. Un error inesperado devuelve 500 sin filtrar detalles |

**Cancelar** (`CompraService.cancelar` → `Compra.cancelar()`):
- El service chequea el **permiso**: sólo el comprador puede cancelar (**403**).
- La entidad aplica las **reglas de HU-10**: si la entrada está UTILIZADA o el evento ya se realizó → **422**.
- Si estaba **CONFIRMADA** (pagada), pasa a CANCELADA y **automáticamente** a REEMBOLSADA (HU-09).
- En los dos casos **libera el cupo** (`tipoEntrada.liberar`) y avisa al organizador (notificación).

**Mostralo en Swagger:**
1. `POST /compra` con Juan, Platea, `cantidad: 2` → **422** "No hay cupo suficiente… quedan 0" (o "quedan 1", si
   todavía no compraste). La regla vive en el back, aunque alguien saltee el front.
2. Volvé a *Authorize* con el token de **Sofía** (`POST /auth/login`) y probá `POST /compra/5/cancelar` (su compra
   **UTILIZADA**) → **422** "…ya fue utilizada" (HU-10). Con el token de Juan da **403**, porque la compra no es suya:
   también sirve para mostrar el permiso.

### 5. Front-End: de la pantalla a la API (5:30 – 7:15)

> "El front sigue la estructura del ejercicio de clase *megasuper*: `service/`, `context/`, `hooks/`,
> `components/` y `features/`, pero en React Native."

Recorrido de **Cancelar**:
1. **Ruta**: `app/compra/[id]/index.jsx`. Expo Router es el equivalente nativo de React Router: la ruta sólo
   delega en la pantalla.
2. **Pantalla**: `features/compras/CompraDetalle.jsx`.
   - `useCarga(() => getCompra(id))` es un **custom hook**: maneja la carga, el error y el reintento, y mientras
     carga muestra un **esqueleto** con la forma del contenido.
   - **Los botones salen de `accionesDisponibles`** que manda el back: la pantalla no decide si se puede
     cancelar, sólo lo muestra.
   - Cancelar pide confirmación con `confirmar()` (diálogo accesible propio) y llama a
     `useAccion().ejecutar("CANCELAR", …)`.
3. **Hook `useAccion`** (`hooks/useAccion.js`): marca qué acción está en curso (el botón muestra "cargando"),
   avisa el éxito y, si falla, muestra el error.
   > "Lo creé porque el mismo `try`/`catch` se repetía en 9 pantallas. Hice hooks sólo donde había repetición
   > real, como el `useForm` de clase."
4. **Service**: `cancelarCompra(id)` en `service/comprasService.js`, una función por endpoint, como el
   `productsService` de megasuper.
5. **`service/api.js`**: la instancia de **axios**.
   - Un **interceptor de request** agrega el token.
   - Un **interceptor de response** convierte los errores del back en mensajes legibles. Si llega un 401,
     cierra la sesión.
6. **Context**: `SesionContext` guarda el usuario y el token, como el `CartContext` de clase, para evitar
   *prop drilling*. En el celular el token se guarda **cifrado** con SecureStore.
7. **Estado**: la respuesta del back (REEMBOLSADA + historial) reemplaza los datos con `setDatos`, sin volver a
   pedir la compra.

Mencioná también la **compra** (`features/evento/EventoDetalle.jsx`):
- `Contador` con `maximo = disponibles`;
- `comprar()` desde `eventosService`/`comprasService`;
- `router.push` a la compra.

### 6. Demo, segunda parte: cancelar y ver el cupo liberado (7:15 – 8:15)
1. Juan: abrí la compra → **Cancelar** → el diálogo explica el reembolso → confirmá. Queda **REEMBOLSADA**, con
   el **historial** PENDIENTE → CONFIRMADA → CANCELADA → REEMBOLSADA, con quién y cuándo.
2. Cerrá sesión y entrá como **Martín**. Aparece la **notificación** de la cancelación, que llega en tiempo real
   por WebSocket. Andá a **Mis eventos → Superclásico → Ver compras** (HU-06): la compra de Juan figura como
   REEMBOLSADA y la Platea vuelve a mostrar **1 disponible**.

### 7. Conclusión sobre el uso de IA (8:15 – 9:30)

Decilo con tus palabras. Estos son los puntos con ejemplos concretos de este TP (detalle en
`docs/DOCUMENTACION.md`, sección 6):

- **Ventajas**:
  - **Velocidad**: el backend completo, con tests y Swagger, salió en una sesión.
  - Sirvió para **relevar las ramas del repo de clase** y mantener el mismo estilo; hasta encontró bugs en ese
    código, que no se copiaron.
  - Generó **tests y documentación** que a mano se suelen dejar para el final.
- **Desventajas y riesgos**:
  - **Genera mucho código** y es difícil revisarlo todo.
  - **Se equivoca con seguridad**: el `import` que corre antes que `dotenv`, o un script que no reconocía
    `export async function`.
  - Una auditoría automática de accesibilidad dio **"0 violaciones" y estaba mal**.
  - Dos errores aparecieron **sólo en el celular real**: `Intl.RelativeTimeFormat` no existe en Hermes y
    SecureStore no acepta `:` en las claves. Los 262 tests corrían todos en un navegador.
- **Dificultades**:
  - Distinguir un error de la app de un error del test.
  - Que la IA **pregunte** en vez de asumir en las reglas de negocio (reembolso, roles, cupo máximo por compra).
- **Aprendizajes**:
  - Con **specs y tests** primero, la IA se vuelve útil: hay contra qué medir lo que genera.
  - Las **decisiones** las toma una persona y quedan registradas (47 decisiones en la bitácora).
  - Siempre **probar en el dispositivo real**.
- **Valoración personal** (completala vos):
  - ¿cuánto te ahorró?
  - ¿qué no delegarías?
  - ¿cómo cambió tu forma de revisar código?

---

## Mapa: temas de la materia → dónde aparecen en el flujo

Te sirve para responder preguntas o para nombrar los conceptos al pasar.

| Tema de la materia | Dónde lo mostrás |
|---|---|
| Arquitectura en capas | ruta → controller → service → entidad → repositorio |
| Inyección de dependencias | `app.js` arma repositorios → services → controllers por constructor; el reloj inyectable permite testear fechas |
| Modelo de dominio rico | `TipoEntrada.reservar`, `Compra.cancelar`, `accionesDisponiblesPara` |
| Enums y máquina de estados | `EstadoCompra` (`Object.freeze`) + `TRANSICIONES_VALIDAS` |
| Validación de entrada | Zod en el controller → 400 con errores por campo |
| Manejo de errores | jerarquía `AppError` + `errorHandler` global + 404 de rutas |
| Middlewares | auth JWT, roles, logger con request-id, mantenimiento (vence las reservas) |
| Persistencia | repositorios en memoria con interfaz async (reemplazables por Mongoose) |
| DTOs | `compraDTO`: el back decide qué expone y calcula `diasRestantes` y `accionesDisponibles` |
| Testing | Jest + Supertest (unitarios e integración) + Playwright con axe (E2E y accesibilidad) |
| Documentación de API | Swagger/OpenAPI en `/api-docs` |
| Componentes y props | `Contador`, `EstadoBadge`, `Boton`: uno por carpeta, como en megasuper |
| `useState` / `useEffect` | estado de la pantalla; `useEffect` con cleanup en el chat (`setInterval` / sockets) |
| Custom hooks | `useCarga`, `useFormulario` (como `useForm`), `useAccion`: sólo donde había repetición |
| Context API | `SesionContext` (como `CartContext`), `TemaContext`, `NotificacionesContext` |
| Integración front-back | axios + interceptores, variables de entorno (`EXPO_PUBLIC_API_URL`), CORS |
| Polling vs tiempo real | el chat empezó con sondeo (como el popup de clase) y pasó a WebSockets, con el sondeo como respaldo |
| Navegación | Expo Router (equivalente a React Router); `app/` delega en `features/` |

## Preguntas que te pueden hacer (y cómo responderlas)

- **¿Por qué la regla del cupo está en la entidad y no en el service?**
  Porque el dato (cupo y vendidas) es de `TipoEntrada`: así ningún camino puede saltearla, ni comprar ni la lista
  de espera. El service orquesta y la entidad decide.
- **¿Por qué validan en el front si igual valida el back?**
  El front valida para dar una buena experiencia (avisar antes de enviar). El back valida para proteger los
  datos (no confía en el cliente). El Swagger con `cantidad: 2` lo demuestra.
- **¿Qué pasa si dos personas compran la última entrada a la vez?**
  Node ejecuta el JavaScript en un solo hilo, y `TipoEntrada.reservar()` chequea el cupo y lo descuenta en el
  mismo paso, sin un `await` en el medio. Por eso, en memoria, la segunda compra ya ve el cupo actualizado y
  recibe 422. Con una base de datos haría falta una
  transacción, como en la rama `persistencia-odm-2026` de clase.
- **¿Por qué un DTO y no devolver la entidad?**
  Para no exponer datos internos (el hash de la contraseña, referencias circulares) y para agregar campos
  calculados para la pantalla.
- **¿Por qué 422 y no 400 al superar el cupo?**
  El 400 es para datos mal formados (los valida Zod). El 422 es para datos bien formados que violan una regla
  de negocio.
- **¿Por qué `useAccion` y no un `try`/`catch` en cada botón?**
  Estaba repetido en 9 pantallas. Con el hook, todas las acciones se comportan igual y el manejo de errores
  está en un solo lugar. No hice hooks donde no había repetición (lo dejé documentado en D-46).
- **¿Cómo corre en el celular?**
  Con Expo Go, en la misma red que la PC. El front encuentra el back por la IP de la PC (`api.js` →
  `resolverUrlApi`).

## Si presentás el TP original (`ticket-it/`) en lugar de la versión pro

El flujo y el back son los mismos, con estas diferencias:
- el usuario se elige en el login y viaja en el header `x-user-id`, sin JWT;
- pagar no pide tarjeta;
- el front usa `src/api/api.js`, sin `service/` por recurso ni `useAccion`.

En Swagger, autorizate con `x-user-id` en lugar del token.
