# M7 — Frontend mobile (React Native + Expo)

**Estado**: Implementada
**Depende de**: M0–M6 (consume la API)
**Historias incluidas**: interfaz de HU-01 a HU-12 + favoritos

## Objetivo del módulo
App mobile (y web, con el mismo código) para compradores y organizadores, que consume el backend.

## Tecnología (D-18)
- **Expo SDK 58 + React Native 0.88 + React 19**, se ejecuta en el celular con **Expo Go** y en el navegador con `react-native-web`.
- **Expo Router** (navegación por archivos, recomendada por Expo; en web genera URLs reales).
- **axios** para la API (como en clase), **Context API** para la sesión (como `CartContext` de clase),
  **custom hooks** (`useCarga`, como `useForm` de clase), `AsyncStorage` para recordar el usuario.
- Componentes propios con `StyleSheet` (sin librería de UI) para que se vean igual en web y mobile.
- **Diseño visual** hecho en Claude Design (ver D-20): motivo de entrada de evento, Bricolage Grotesque + DM Sans
  (`expo-font` + `@expo-google-fonts/*`), paleta crema / tinta / coral definida en `src/theme.js`.

## Estructura (patrones de clase)
```
packages/frontend/
├── app/                      # rutas (Expo Router): archivos finos que renderizan una pantalla de src/features
│   ├── _layout.js            # providers + Stack raíz
│   ├── index.js              # redirige según sesión y rol
│   ├── login.js
│   ├── (comprador)/          # tabs del comprador: explorar, mis-compras, favoritos
│   ├── (organizador)/        # tabs del organizador: mis-eventos, crear-evento
│   ├── evento/[id]/          # detalle, compras del evento, reseñar
│   ├── compra/[id]/          # detalle de compra, chat
│   └── organizador/[id].js   # reseñas del organizador
└── src/
    ├── api/                  # cliente axios + una función por endpoint
    ├── store/                # SesionContext
    ├── hooks/                # useCarga
    ├── components/           # componentes reutilizables
    ├── features/             # pantallas
    ├── theme.js              # colores y espaciados
    └── utils/                # formato de precios/fechas, confirmaciones
```

## Pantallas e historias

| Pantalla | Rol | Historias | Endpoints |
|---|---|---|---|
| Login (elegir usuario) | todos | identificación (D-03) | `GET /usuario` |
| Explorar | comprador | HU-02, HU-03 | `GET /evento`, `GET /categoria` |
| Detalle de evento | todos | HU-04, HU-12, favoritos | `GET /evento/:id`, `POST /compra`, `POST/DELETE /usuario/me/favoritos/:id` |
| Reseñas del organizador | todos | HU-12 | `GET /usuario/:id/resenias` |
| Mis compras | comprador | HU-05 | `GET /compra/mias` |
| Detalle de compra | ambos | HU-09, HU-10, pagar, utilizar, historial | `GET /compra/:id`, `POST /compra/:id/{pagar,cancelar,utilizar}` |
| Chat de la compra | ambos | HU-07, HU-08 | `GET/POST /compra/:id/mensajes` (polling con `desde`) |
| Reseñar evento | comprador | HU-11 | `POST /evento/:id/resenias` |
| Favoritos | comprador | favoritos | `GET /usuario/me/favoritos` |
| Mis eventos | organizador | ventas | `GET /evento/mios` |
| Compras de un evento | organizador | HU-06 | `GET /evento/:id/compras` |
| Crear evento | organizador | HU-01 | `POST /evento`, `GET /categoria` |

## Criterios de aceptación
- **CA-1**: Al abrir la app sin sesión se muestra el login; al elegir un usuario se navega a las tabs de su rol y la sesión se recuerda.
- **CA-2**: Cada pantalla muestra estado de carga, error (con reintentar) y vacío.
- **CA-3**: Los botones de acción de una compra salen de `accionesDisponibles` (el front no duplica reglas de negocio).
- **CA-4**: Los estados de compra se distinguen por color y texto; las CONFIRMADAS muestran "Faltan N días".
- **CA-5**: Los errores del backend (`message` / `errores`) se muestran al usuario.
- **CA-6**: Acciones destructivas (cancelar) piden confirmación, en mobile y en web.
- **CA-7**: La URL de la API se configura sola con la IP de la PC cuando se usa Expo Go (o con `EXPO_PUBLIC_API_URL`).

## Accesibilidad (D-21)
- Las 9 pautas de la clase aplicadas en los componentes base (`src/components/ui.js`, `Pantalla.js`, `Icono.js`) y en
  cada pantalla; configuración web en `src/utils/accesibilidad.js` (idioma, foco visible, movimiento reducido).
- **CA-8**: Ninguna pantalla tiene violaciones WCAG 2.2 A/AA según axe, en web y mobile (`e2e/accesibilidad.spec.mjs`).
- **CA-9**: Se puede ingresar y operar sólo con teclado, con foco siempre visible (`e2e/flujos.spec.mjs`).
- **CA-10**: Al enviar un formulario con errores, se anuncia un resumen, el foco va al primer campo inválido y cada
  error está asociado a su campo.

## Modo oscuro (D-22)
- **CA-11**: Por defecto la app usa el tema del sistema; el botón de tema alterna Sistema → Claro → Oscuro, el
  cambio se anuncia y se recuerda al reabrir.
- **CA-12**: En modo oscuro todas las pantallas cumplen WCAG 2.2 AA (proyecto `mobile-oscuro`).

## Cuenta y diálogos (D-23)
- **CA-13**: Cerrar sesión está en un menú "Cuenta" con texto visible y pide confirmación con un diálogo propio.
- **CA-14**: Los diálogos tienen nombre, atrapan el foco, se cierran con Esc/atrás y devuelven el foco al botón que los abrió.
- **CA-15**: Los éxitos se anuncian en un aviso no bloqueante (`role="status"`); los errores, en un diálogo.

## Calendario (D-24)
- **CA-16**: La fecha del evento se elige en un calendario; los días anteriores a hoy no se pueden elegir.

## Reseñas propias (D-25)
- **CA-17**: Desde "Mis eventos" el organizador abre "Mis reseñas" tocando su reputación.

## Decisiones tomadas en este módulo
- Las rutas de `app/` son finas y delegan en `src/features/` para conservar la estructura por features de clase.
- Fechas en el formulario de crear evento como texto `AAAA-MM-DD` y `HH:MM`: los date pickers nativos no funcionan igual en web.
- Confirmaciones con `window.confirm` en web y `Alert.alert` en mobile (`Alert` con botones no funciona en web).
