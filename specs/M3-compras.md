# M3 — Compras: crear y consultar

**Estado**: Implementada
**Depende de**: M2
**Historias incluidas**: HU-04, HU-05, HU-06 (+ R-05 historial, R-06 acciones disponibles)

## Objetivo del módulo
La compra de entradas y su visualización para el comprador y para el organizador.

## Modelo
- `Compra` (comprador, evento, tipoEntrada, cantidad, total, estado, mensajes, fechaCompra, historial):
  `actualizarEstado(estado, quien, ahora)`, `diasParaElEvento(ahora)`, `esDelComprador()`, `esParticipante()`,
  `accionesDisponiblesPara(usuario, ahora)`.
- `EstadoCompra` + `TRANSICIONES_VALIDAS` (máquina de estados).
- `CambioEstadoCompra` (compra, estado, quien, fechaHora).
- `CompraRepository`: `findByComprador(id, estado?)`, `findByEvento(id, estado?)`, `findByCompradorYEstadoEnEvento`.

---

## HU-04 — Comprar entradas sin superar el cupo

### Historia
Como comprador, quiero realizar una compra sobre un Evento seleccionando un tipo de entrada y la cantidad deseada,
sin superar el cupo disponible.

### Criterios de aceptación
- **CA-1**: Compra válida → 201, estado `PENDIENTE`, `total = precio × cantidad`, cupo reservado, primer cambio en el historial.
- **CA-2**: Cantidad mayor a los disponibles → 422 indicando cuántas quedan.
- **CA-3**: Se puede comprar exactamente el remanente; el tipo queda `agotado`.
- **CA-4**: Más de `MAX_ENTRADAS_POR_COMPRA` (10) → 400.
- **CA-5**: Evento ya realizado → 422.
- **CA-6**: Evento o tipo de entrada inexistente → 404.
- **CA-7**: Un organizador no puede comprar → 403.

### Contrato
`POST /compra` — `{ eventoId, tipoEntradaId, cantidad }` (comprador).

## HU-05 — Mis compras con estado y días restantes

### Historia
Como comprador, quiero visualizar mis compras diferenciando con claridad su estado y cuántos días faltan para el
evento en caso de estar confirmada.

### Criterios de aceptación
- **CA-1**: Lista las compras del comprador con su `estado`.
- **CA-2**: `diasRestantes` sólo en compras `CONFIRMADA`; `null` en el resto.
- **CA-3**: Si el evento es hoy, `diasRestantes = 0` (días calendario).
- **CA-4**: Filtro `estado`; orden: próximos eventos primero, luego los pasados.
- **CA-5**: Cada compra trae `accionesDisponibles` (PAGAR, CANCELAR, RESENIAR, CHATEAR).

### Contrato
`GET /compra/mias?estado&page&limit` (comprador). `GET /compra/:id` (comprador u organizador del evento; incluye historial).

## HU-06 — Compras de un evento con disponibilidad por tipo

### Historia
Como organizador, quiero visualizar las compras de un Evento diferenciando su estado y cuántas entradas quedan
disponibles de cada tipo.

### Criterios de aceptación
- **CA-1**: Devuelve compras paginadas, `disponibilidad` por tipo y `resumenPorEstado` (los 5 estados).
- **CA-2**: Filtro `estado`.
- **CA-3**: Otro organizador → 403.
- **CA-4**: Una cancelación se refleja en la disponibilidad.

### Contrato
`GET /evento/:id/compras?estado&page&limit` (organizador del evento).

## Casos de prueba
`test/int/m3-compras.int.test.js` (18 tests), `test/unit/compraService.test.js` (service con repos mockeados).

## Decisiones tomadas en este módulo
- El cupo se reserva al crear la compra (aunque esté PENDIENTE) para evitar sobreventa (D-12).
- Tope de 10 entradas por compra, configurable por `.env` (D-14).
- Un tercero que intenta ver una compra recibe 403 (no 404): el TP no requiere ocultar la existencia del recurso.
