# M6 — Reseñas y reputación

**Estado**: Implementada
**Depende de**: M4
**Historias incluidas**: HU-11, HU-12, cierre de HU-03 (+ R-09 reputación)

## Objetivo del módulo
Calificaciones de los eventos y reputación del organizador.

## Modelo
- `Resenia` (comprador, evento, detalle, puntuacion, fecha).
- `ReseniaRepository`: `findByEvento`, `findByOrganizador`, `findByCompradorYEvento`,
  `reputacionDeOrganizador(id) → { puntajePromedio (2 decimales o null), cantidadResenias }`.

---

## HU-11 — Puntuar y comentar con la entrada utilizada

### Historia
Como organizador, quiero que una vez utilizada una entrada el comprador pueda puntuar el Evento de forma numérica y
dejar un comentario escrito.

### Criterios de aceptación
- **CA-1**: Un comprador con una compra UTILIZADA del evento lo reseña → 201; la compra deja de ofrecer `RESENIAR`.
- **CA-2**: Sin compra utilizada en el evento → 422.
- **CA-3**: Segunda reseña del mismo comprador al mismo evento → 409.
- **CA-4**: `puntuacion` entero de 1 a 5 (D-16); `detalle` 1-1000 caracteres → si no, 400.
- **CA-5**: Un organizador no puede reseñar → 403. Evento inexistente → 404.

### Contrato
`POST /evento/:id/resenias { puntuacion, detalle }` (comprador). `GET /evento/:id/resenias` (público, paginado).

## HU-12 — Reseñas de eventos anteriores del organizador

### Historia
Como comprador, quiero que las reseñas de eventos anteriores se visualicen en los Eventos de cada organizador para
conocer experiencias previas antes de comprar.

### Criterios de aceptación
- **CA-1**: `GET /usuario/:id/resenias` devuelve la reputación del organizador y las reseñas de todos sus eventos,
  más recientes primero.
- **CA-2**: `GET /evento/:id` (incluso de un evento futuro sin reseñas propias) muestra las últimas 5 reseñas de los
  eventos del organizador y su reputación.
- **CA-3**: Una nueva reseña actualiza el promedio y el orden `puntaje` del catálogo (cierre de HU-03).
- **CA-4**: Un usuario que no es organizador → 404.

## Casos de prueba
`test/int/m6-resenias.int.test.js` (11 tests).

## Decisiones tomadas en este módulo
- La reseña se asocia a comprador + evento (como el diagrama), no a la compra: una por comprador y evento.
- La reputación se calcula al consultar (no se guarda): con persistencia en memoria el costo es despreciable y nunca queda desactualizada.
