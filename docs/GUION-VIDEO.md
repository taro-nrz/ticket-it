# Guion exacto del video (≈ 9 minutos)

Texto para leer o decir casi palabra por palabra.
- 🎙️ **DECIR**: lo que se dice.
- 🖥️ **MOSTRAR**: lo que tiene que estar en pantalla en ese momento.

Duración aproximada: unas 1.250 palabras, a un ritmo tranquilo de 140 por minuto. Si te pasás de tiempo, los
párrafos marcados *(opcional)* se pueden saltear.

La preparación (checklist, pestañas abiertas, Swagger con token) está en `GUION-EXPOSICION.md`.

**Flujo elegido**: comprar una entrada y cancelarla con reembolso (HU-04, HU-05, HU-06, HU-09 y HU-10).

---

## 1. Presentación (0:00 – 0:40)

🖥️ **MOSTRAR**: la app abierta en el celular (scrcpy), en la pantalla de login.

🎙️ **DECIR**:
> "Hola, soy [tu nombre]. Les presento AI Ticket It, una plataforma para vender entradas a eventos: los
> organizadores publican sus eventos con tipos de entrada General, Platea o VIP, con precio y cupo, y los
> compradores buscan, compran y gestionan sus entradas desde el celular.
>
> El back-end es Node con Express, organizado en capas como vimos en clase, con persistencia en memoria. El
> front-end es React Native con Expo, así que corre en un celular real, que es lo que están viendo ahora.
>
> El flujo que elegí es el ciclo de vida de una compra: comprar una entrada sin superar el cupo, pagarla, verla
> en mis entradas y cancelarla con reembolso. Lo elegí porque recorre todas las capas y tiene las reglas de
> negocio más interesantes del dominio."

---

## 2. Cómo trabajé (0:40 – 1:20)

🖥️ **MOSTRAR**: `specs/M3-compras.md` (la HU-04 con sus criterios) y después
`test/int/m3-compras.int.test.js` (el test "CA-2: superar el cupo disponible responde 422").

🎙️ **DECIR**:
> "Antes de mostrar la app, cuento cómo trabajé, porque explica cómo usé la IA. Hice desarrollo guiado por specs:
> por cada módulo escribí primero una spec con historias de usuario y criterios de aceptación, como este de la
> HU-04: si se supera el cupo, la API responde 422 diciendo cuántas quedan.
>
> Y cada criterio tiene su test de integración. Así, cuando la IA generaba código, yo tenía contra qué medirlo:
> si el test no pasaba, no estaba terminado."

---

## 3. Demo: comprar (1:20 – 2:50)

🖥️ **MOSTRAR**: el celular.

1. Tocá la cuenta de prueba **Juan** e **Ingresar**.

   🎙️ **DECIR**:
   > "Entro como Juan, que es comprador. El login devuelve un token JWT y, según el rol, la app muestra la
   > sección de comprador."

2. En **Explorar**, escribí "super" en la barra de búsqueda y tocá **Buscar**. Después tocá el chip **Deportes**.

   🎙️ **DECIR**:
   > "Acá está la barra de búsqueda que pide el enunciado. La búsqueda la hace el back, no el celular. También
   > puedo filtrar por categoría y ordenar por fecha o precio."

3. Entrá al **Superclásico de verano**. Elegí **Platea** ("Queda 1") y tocá el **+** de la cantidad.

   🎙️ **DECIR**:
   > "El evento tiene dos tipos de entrada: General y Platea. La Platea tiene cupo 2 y ya se vendió una, así que
   > queda 1. Si intento subir la cantidad, el botón más no me deja. Pero ojo: esto es sólo la interfaz. La regla
   > de verdad está en el back, y en un momento lo demuestro saltándome la app."

4. Tocá **Comprar**. En la compra, tocá **Pagar $ 45.000** y usá la tarjeta de prueba **4242 4242 4242 4242**.

   🎙️ **DECIR**:
   > "La compra nace pendiente, con 15 minutos para pagar; si no, se vence y libera el cupo. Pago con una tarjeta
   > de prueba: el pago es simulado y sólo se guardan la marca y los últimos cuatro dígitos."

5. Volvé a **Mis entradas**.

   🎙️ **DECIR**:
   > "Ahora la compra está confirmada y me dice cuántos días faltan. El estado se muestra con texto además del
   > color, por accesibilidad."

---

## 4. Back-End: el viaje de la request (2:50 – 5:20)

🖥️ **MOSTRAR**: `routes/compraRoutes.js`.

🎙️ **DECIR**:
> "Ahora veamos qué pasó en el back cuando toqué Comprar. Llegó un `POST /compra`. En la ruta, antes del
> controller, hay dos middlewares: `requiereUsuario`, que valida el token, y `requiereRol` comprador. Sin token
> responde 401, y si sos organizador, 403. Las rutas reciben `getController`, igual que en el repo de clase."

🖥️ **MOSTRAR**: `controllers/compraController.js` → `comprarSchema` y `create`.

🎙️ **DECIR**:
> "El controller sólo se ocupa de HTTP. Valida el body con Zod: si los datos están mal formados, responde 400 con
> el error de cada campo. Si están bien, llama al service y responde 201. Cualquier error va a `next`, al manejador
> global."

🖥️ **MOSTRAR**: `services/compraService.js` → `comprar`.

🎙️ **DECIR**:
> "El service orquesta: busca el evento en el repositorio, y si no existe es un 404. Si está cancelado o ya pasó,
> es un 422. Después le pide al tipo de entrada que reserve. Las dependencias, como los repositorios y un reloj,
> entran por constructor; el reloj me permite testear fechas sin depender del día de hoy. Al final devuelve un DTO,
> no la entidad."

🖥️ **MOSTRAR**: `models/entities/tipoEntrada.js` → `NombreTipoEntrada`, `hayCupoPara` y `reservar`.

🎙️ **DECIR**:
> "La regla del cupo está en la entidad `TipoEntrada`, que es la que tiene el dato. Es un modelo rico: si no hay
> cupo, `reservar` lanza un error de negocio que dice cuántas quedan. Así, ningún camino puede saltearse la regla.
> Arriba están los tipos de entrada como un falso enum, con `Object.freeze`: General, Platea o VIP, como dice el
> enunciado."

🖥️ **MOSTRAR**: `models/entities/estadoCompra.js` → `TRANSICIONES_VALIDAS`, y `compra.js` → `cancelar`.

🎙️ **DECIR**:
> "La compra es una máquina de estados. Esta tabla define qué transiciones son válidas: de pendiente se puede
> confirmar, cancelar o vencer; de confirmada, utilizar o cancelar; y una cancelada pasa a reembolsada. Cada cambio
> pasa por un único método, `actualizarEstado`, que además guarda el historial con quién y cuándo.
>
> Al cancelar, si la entrada ya fue utilizada o el evento ya pasó, es un 422. Si estaba pagada, pasa a cancelada y
> automáticamente a reembolsada. En los dos casos se libera el cupo."

🖥️ **MOSTRAR**: `error/appError.js` y `middlewares/errorHandler.js` *(opcional, 15 segundos)*.

🎙️ **DECIR** *(opcional)*:
> "Los errores son una jerarquía: `AppError` y sus hijos para 400, 403, 404 y 422. Un solo manejador global los
> convierte en JSON."

🖥️ **MOSTRAR**: Swagger en `/api-docs`, autorizado con el token de Juan. `POST /compra` con
`{ "eventoId": 5, "tipoEntradaId": 2, "cantidad": 2 }`.

🎙️ **DECIR**:
> "Y acá lo prometido. Me salto la app y le pido a la API dos plateas. Responde 422: no hay cupo suficiente. La
> regla vive en el back, aunque alguien no use la interfaz."

---

## 5. Front-End: de la pantalla a la API (5:20 – 7:00)

🖥️ **MOSTRAR**: `features/compras/CompraDetalle.jsx`.

🎙️ **DECIR**:
> "En el front seguí la estructura del ejercicio de clase: services, context, hooks, componentes y pantallas, pero
> en React Native. Les muestro el botón Cancelar.
>
> La pantalla carga la compra con `useCarga`, un custom hook que maneja el cargando, el error y el reintento.
> Fíjense en esto: los botones salen de `accionesDisponibles`, que manda el back. La pantalla no decide si se puede
> cancelar; sólo muestra lo que el back permite. Así la regla está en un solo lugar.
>
> Al tocar Cancelar, pide confirmación con un diálogo accesible, que avisa cuánto se reembolsa, y ejecuta la acción."

🖥️ **MOSTRAR**: `hooks/useAccion.js`.

🎙️ **DECIR**:
> "`useAccion` es otro custom hook: marca qué botón está cargando, avisa el éxito y muestra el error si falla.
> Lo hice porque el mismo bloque `try`/`catch` se repetía en nueve pantallas. Sólo hice hooks donde había
> repetición real."

🖥️ **MOSTRAR**: `service/comprasService.js` y `service/api.js` (los dos interceptores).

🎙️ **DECIR**:
> "`cancelarCompra` es una función del service de compras: una por endpoint. Todas usan esta instancia de axios
> con dos interceptores. Uno agrega el token a cada request. El otro convierte los errores del back en mensajes
> legibles, y si llega un 401, cierra la sesión. El token lo guarda el `SesionContext` y, en el celular, va cifrado
> con SecureStore."

---

## 6. Demo: cancelar y ver el efecto (7:00 – 8:00)

🖥️ **MOSTRAR**: el celular.

1. Abrí la compra del Superclásico → **Cancelar** → leé el diálogo → **Sí, cancelar la compra**.

   🎙️ **DECIR**:
   > "Cancelo. El diálogo me avisa que se reembolsan 45.000 pesos. Ahora la compra queda reembolsada, y el
   > historial muestra todo el recorrido: pendiente, confirmada, cancelada y reembolsada, con quién y cuándo."

2. Cerrá sesión desde **Cuenta** y entrá como **Martín**. Mostrá la **notificación**. Andá a **Mis eventos →
   Superclásico → Ver compras**.

   🎙️ **DECIR**:
   > "Del otro lado, Martín, el organizador, recibió la notificación en tiempo real, por WebSocket. En las compras
   > de su evento, la de Juan figura reembolsada, y la Platea vuelve a decir 'Queda 1': el cupo se liberó."

---

## 7. Conclusión sobre el uso de IA (8:00 – 9:20)

🖥️ **MOSTRAR**: a cámara, o `docs/DOCUMENTACION.md` en la sección "Uso de IA".

🎙️ **DECIR**:
> "Para cerrar, una reflexión sobre desarrollar con inteligencia artificial.
>
> **La ventaja** más clara fue la velocidad. El back completo, con tests y Swagger, salió en una sesión. También me
> ayudó a mantener el estilo del repo de clase, y hasta marcó errores de ese código que decidí no copiar.
>
> **La desventaja** es que genera mucho código y se equivoca con total seguridad. Por ejemplo, un import que se
> ejecutaba antes de cargar las variables de entorno. O una revisión automática de accesibilidad que daba cero
> errores cuando sí los había. Y dos bugs aparecieron sólo en el celular real, aunque los 262 tests pasaban, porque
> corrían en un navegador.
>
> **La dificultad** principal fue revisar. Sin specs ni tests, no hubiera sabido si lo que generaba estaba bien.
> También noté que la IA es probabilística: si no le das una dirección, tiende a lo más común, y todos los TPs
> terminan pareciéndose. Por eso el diseño lo elegí yo, comparando prototipos. Además, con IA agregar funciones es
> muy barato: había hecho cupones de descuento y los saqué, porque el enunciado no los pedía y sólo sumaban código.
>
> **Aprendí** tres cosas: que las decisiones tienen que ser mías y quedar escritas (las registré en una bitácora);
> que hay que probar en el dispositivo real; y que la IA rinde de verdad cuando tiene contra qué medirse.
>
> **Mi valoración**: [completá con tu experiencia, por ejemplo: 'me hizo mucho más productivo en lo repetitivo,
> como tests, documentación y estructura, pero lo que no delegaría es decidir las reglas de negocio']. La IA
> escribe rápido; el criterio lo tiene que poner uno.
>
> Gracias."

---

## Tiempos de control

| Marca | Tenés que estar en… |
|---|---|
| 1:20 | Empezando la demo (login como Juan) |
| 2:50 | Abriendo `compraRoutes.js` |
| 5:20 | Abriendo `CompraDetalle.jsx` |
| 7:00 | Cancelando en el celular |
| 8:00 | Empezando la conclusión |

Si a los 5:20 todavía estás en el back, salteá los párrafos *(opcional)* y el de `api.js`.
