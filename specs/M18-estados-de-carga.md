# M18 — Estados de carga y MSW

**Estado**: Implementada · **Depende de**: M7

## HU-L1 — Saber que algo está cargando, sin saltos
Como usuario, quiero ver la forma de la pantalla mientras cargan los datos y entender si algo tarda.
- **CA-1**: la primera carga de cada pantalla muestra un **esqueleto** con la forma del contenido (catálogo,
  detalle de evento, mis entradas, mis eventos, compras de un evento, compra, chat, estadísticas, reseñas,
  notificaciones, cupones, editar evento, checkout).
- **CA-2**: una recarga con datos ya visibles (filtros, volver a la pantalla) muestra una **barra fina** arriba y
  deja los resultados anteriores atenuados, sin esqueleto.
- **CA-3**: las imágenes muestran un bloque que late hasta cargar y aparecen con un fundido; si fallan, queda el
  color de la categoría.
- **CA-4**: las acciones (comprar, pagar, guardar) muestran el spinner en su botón; el arranque de la app, una
  pantalla con la marca.
- **CA-5**: si una carga supera 8 s aparece "Está tardando más de lo normal" con "Reintentar".
- **CA-6**: accesibilidad: cada esqueleto es un único `progressbar` con nombre ("Cargando eventos") y
  `aria-busy`; las formas se ocultan al lector; con "reducir movimiento" no laten (WCAG 2.3.3); el esqueleto va
  fuera de la lista para no dejar una zona desplazable sin nada enfocable.

## HU-L2 — Probar la app con latencia y sin backend (MSW)
- **CA-7**: `npm run web:lento`: MSW deja pasar todas las llamadas al backend real con una demora variable
  (`EXPO_PUBLIC_MSW_DEMORA`, 900 ms por defecto).
- **CA-8**: `npm run web:mock`: la app funciona **sin backend** con datos generados desde la API real
  (`npm run mocks:generar`); las fechas se corren a hoy; login de prueba, catálogo con filtros y orden, detalle,
  entradas, eventos, estadísticas, chat y notificaciones. Las operaciones que modifican datos responden 503 con
  una explicación.

Tests: `e2e/carga.spec.mjs` (5, con axe) y el proyecto `sin-backend` de Playwright (`e2e/sin-backend.spec.mjs`,
3), que levanta la app con MSW apuntando a un puerto donde no hay ningún servidor.
