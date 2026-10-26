# M22 — Compartir un evento y agregarlo al calendario

**Estado**: Implementada · **Depende de**: M2

## HU-S1 — Compartir un evento
Como comprador, quiero compartir un evento con mis amigos.
- **CA-1**: "Compartir el evento" en el detalle abre la hoja de compartir del sistema (celular y navegadores que
  la tienen) con el nombre, la fecha, el lugar y el link; si el navegador no la tiene, copia el enlace y avisa.
- **CA-2**: el link abre el evento: en web la dirección de la app; en el celular el link de la app
  (`ticketit://evento/:id`) o la web pública si se configuró `EXPO_PUBLIC_WEB_URL`.

## HU-S2 — Agregar al calendario
- **CA-3**: `GET /evento/:id/calendario.ics` (público) devuelve el evento en iCalendar (RFC 5545): inicio, fin
  (3 h), lugar, link, recordatorio 2 h antes, `STATUS:CANCELLED` si se canceló; textos escapados y líneas de
  hasta 75 bytes.
- **CA-4**: "Agregar al calendario" (eventos vigentes) descarga el archivo y el sistema ofrece agregarlo.

Tests: `test/int/m22-calendario.int.test.js` (4), `e2e/compartir.spec.mjs` (2).
