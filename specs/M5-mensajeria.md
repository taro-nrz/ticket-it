# M5 — Mensajería de la compra

**Estado**: Implementada
**Depende de**: M3
**Historias incluidas**: HU-07, HU-08 (+ R-11 polling)

## Objetivo del módulo
Un chat simple dentro de cada compra entre el comprador y el organizador del evento.

## Modelo
- `Mensaje` (id, usuario, mensaje, enviado). Viven dentro de la compra (`Compra.mensajes`, como en el diagrama).
- `Compra.agregarMensaje(usuario, texto, ahora)`, `Compra.mensajesDesde(fecha)`.

---

## HU-07 — El comprador envía mensajes
Como comprador, quiero enviar mensajes en cualquier momento relacionados a una compra mediante un chat dentro de la misma.

## HU-08 — El organizador responde mensajes
Como organizador, quiero responder mensajes en cualquier momento relacionados a una compra mediante un chat dentro de la misma.

### Criterios de aceptación (ambas)
- **CA-1**: Comprador u organizador del evento envían un mensaje → 201 con autor (`usuario` con `rol`) y fecha.
- **CA-2**: La conversación se lista en orden cronológico.
- **CA-3**: Se puede chatear en **cualquier** estado de la compra (también cancelada o utilizada).
- **CA-4**: `desde=<ISO>` devuelve sólo los mensajes posteriores (polling del front).
- **CA-5**: Mensaje vacío, sólo espacios o > 1000 caracteres → 400.
- **CA-6**: Un usuario que no participa de la compra → 403. Compra inexistente → 404.
- **CA-7**: La compra informa `cantidadMensajes`.

### Contrato
`GET /compra/:id/mensajes?desde` y `POST /compra/:id/mensajes { mensaje }`.

## Casos de prueba
`test/int/m5-mensajes.int.test.js` (8 tests).

## Decisiones tomadas en este módulo
- La lista de mensajes no se pagina: un chat de compra es corto y el front necesita la conversación completa;
  para refrescar se usa `desde`.
- El id del mensaje es correlativo dentro de la compra.
