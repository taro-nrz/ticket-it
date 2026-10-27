# M24 — Tiempo real con WebSockets

**Estado**: Implementada · **Depende de**: M5 (chat), M12 (notificaciones), M9 (JWT)

## HU-RT1 — Chatear en vivo
Como comprador u organizador, quiero que los mensajes aparezcan al instante, sin esperar.
- **CA-1**: un mensaje enviado (por `POST /compra/:id/mensajes`) llega al instante a los participantes que tienen el
  chat abierto, por Socket.IO (`chat:mensaje`).
- **CA-2**: "X está escribiendo…" en vivo (`chat:escribiendo`), como máximo un aviso cada 2 s, que desaparece a
  los 3 s o al llegar el mensaje; sólo lo reciben los demás participantes.
- **CA-3**: el socket se autentica con el mismo JWT del login (sin token válido no conecta) y sólo los
  participantes de la compra pueden unirse a su sala (el mismo control que la API REST).
- **CA-4**: el chat muestra el estado: "En vivo" o "Sin conexión en vivo: se actualiza cada 4 s"; si se corta, se
  vuelve al sondeo y al reconectar se trae lo que faltó.

## HU-RT2 — Notificaciones en vivo
- **CA-5**: cada notificación nueva (`notificaciones:nueva`) y cada cambio del contador
  (`notificaciones:resumen`, también al marcar como leídas) llega al instante; la campana sólo consulta por
  sondeo si no hay conexión.

Tests: `test/int/m24-tiempo-real.int.test.js` (6, con un cliente Socket.IO real) y `e2e/tiempo-real.spec.mjs`
(4, con dos navegadores, uno con los WebSockets bloqueados).
