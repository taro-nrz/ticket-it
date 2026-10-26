# M12 — Notificaciones dentro de la app

**Estado**: Implementada · **Depende de**: M3–M6, M11 · Referencia: rama `evolutivo-7-notificaciones` de clase

## Modelo
- `Notificacion` (usuario, tipo, titulo, mensaje, link, fecha, estado `NO_LEIDA`/`LEIDA`, cantidad) con
  `marcarComoLeida()`, `estaLeida()`, `agrupaCon()` / `agrupar()`.
- `TipoNotificacion`: NUEVA_VENTA, COMPRA_CANCELADA, NUEVO_MENSAJE, ENTRADA_UTILIZADA, EVENTO_CANCELADO,
  NUEVA_RESENIA. `NotificacionRepository.findByUsuario(id, estado)`, `contarNoLeidas(id)`.

## HU-N1 — Enterarme de lo que pasa
Como comprador u organizador, quiero recibir avisos de lo que pasa con mis compras y eventos.
- **CA-1**: se notifica al organizador cuando le pagan una compra, cuando le cancelan una y cuando recibe una
  reseña; al comprador cuando validan su entrada (con invitación a reseñar) y cuando se cancela un evento
  (con el motivo y si se le devolvió el dinero); a la otra parte cuando llega un mensaje del chat.
- **CA-2**: varios avisos iguales sin leer (ej. mensajes del mismo chat) se agrupan en uno con la cantidad.
- **CA-3**: abrir el chat marca como leídos sus avisos de mensajes.

## HU-N2 — Ver y gestionar mis notificaciones
- **CA-4**: `GET /notificacion` (más recientes primero, filtro por estado, paginado, `noLeidas`),
  `GET /notificacion/resumen`, `POST /notificacion/:id/leer` (403 si es de otro), `POST /notificacion/leer-todas`.
- **CA-5**: la campana del encabezado muestra cuántas hay sin leer ("Notificaciones, 2 sin leer" para el lector)
  y se actualiza por sondeo cada 15 s. Tocar una notificación la marca leída y abre su link.

Tests: `test/int/m12-notificaciones.int.test.js` (9), `e2e/notificaciones.spec.mjs` (4, incluye axe).
