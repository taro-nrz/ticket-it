# M8 — Mejoras: mensajes sin leer, galería y reseñas por evento

**Estado**: Implementada (decisiones D-26 a D-28 respondidas por el usuario)
**Depende de**: M5 (mensajería), M6 (reseñas), M7 (frontend)
**Historias incluidas**: HU-07/HU-08 (extensión), HU-12 (extensión), multimedia del enunciado

## Objetivo del módulo
Tres mejoras sobre lo ya implementado que hacen la demo más completa: saber qué compras tienen mensajes nuevos,
ver todo el material multimedia de un evento y leer las reseñas de un evento en particular.

## Modelo
- `Compra`: nuevo `ultimaLectura` (Map usuarioId → fecha) y métodos `marcarMensajesLeidos(usuario, ahora)` y
  `mensajesSinLeerPara(usuario)`. Quien envía un mensaje lo da por leído (actualiza su `ultimaLectura`).
- `ReseniaRepository.reputacionDeEvento(eventoId)`: promedio y cantidad de reseñas de un evento.
- Semilla: no cambia; con los mensajes existentes Lucía tiene 1 sin leer en la compra 1 (Sofía) y 1 en la de Juan.

## Preguntas abiertas
- [x] P-1: ¿cuándo se marcan leídos? → endpoint explícito `POST /compra/:id/mensajes/leidos` (el GET no modifica).
- [x] P-2: ¿quién ve el contador? → comprador y organizador.
- [x] P-3: ¿cómo es la galería? → carrusel en la portada del detalle.
- [x] P-4: ¿dónde se ven las reseñas de un evento? → en "Mis eventos" > Realizados y en el detalle de un evento realizado.

---

## HU-07/08+ — Mensajes sin leer

### Historia de usuario
Como comprador u organizador, quiero ver cuántos mensajes nuevos tiene cada compra para responder sin tener que
entrar a cada chat.

### Criterios de aceptación
- **CA-1**: Dado un participante de la compra, cuando la otra parte le escribe, entonces `mensajesSinLeer` de esa
  compra aumenta para él (y no para quien lo envió).
- **CA-2**: Cuando abre el chat (`POST /compra/:id/mensajes/leidos`), entonces `mensajesSinLeer` vuelve a 0.
- **CA-3**: En "Mis eventos" cada evento muestra el total de mensajes sin leer de sus compras; en "Ver compras" y en
  "Mis entradas" cada compra muestra su insignia; el botón del chat también la muestra.
- **CA-4**: La insignia no depende sólo del color: dice el número y el lector anuncia "N mensajes sin leer".

### Reglas de negocio
- RN-1: sólo los participantes (comprador de la compra u organizador del evento) pueden marcar como leídos.
- RN-2: los mensajes propios nunca cuentan como sin leer.

### Contrato de API
#### `POST /compra/:id/mensajes/leidos`
- Headers: `x-user-id`
- Respuestas: `204` sin cuerpo · `401` sin usuario · `403` no participa · `404` compra inexistente.
#### Cambios en respuestas existentes
- Compra (`GET /compra/mias`, `GET /compra/:id`, `GET /evento/:id/compras`): `mensajesSinLeer: number` (para quien mira).
- `GET /evento/mios`: `ventas.mensajesSinLeer` (suma de las compras del evento, para el organizador).

### Casos de prueba
| # | Caso | Esperado | CA |
|---|---|---|---|
| 1 | Lucía mira la compra 1 de la semilla | `mensajesSinLeer: 1` | CA-1 |
| 2 | Sofía escribe; Sofía mira la compra | `0` | CA-1, RN-2 |
| 3 | Lucía marca leídos y vuelve a mirar | `204` y luego `0` | CA-2 |
| 4 | Martín (no participa) marca leídos | `403` | RN-1 |
| 5 | Mis eventos de Lucía | evento de la compra 1 con `ventas.mensajesSinLeer ≥ 1` | CA-3 |

---

## Multimedia — Galería del evento

### Historia de usuario
Como comprador, quiero ver todas las fotos de un evento para conocer mejor el lugar y el show.

### Criterios de aceptación
- **CA-5**: Si el evento tiene más de una imagen, la portada del detalle es un carrusel que se desliza, con puntos
  indicadores y botones "Foto anterior" / "Foto siguiente" (teclado y lector de pantalla).
- **CA-6**: Se anuncia la posición ("Foto 2 de 3"). Con una sola imagen la portada queda como antes.

---

## HU-12+ — Reseñas de un evento

### Historia de usuario
Como organizador, quiero leer las reseñas de cada uno de mis eventos realizados; como comprador, quiero ver las
reseñas de un evento que ya pasó.

### Criterios de aceptación
- **CA-7**: En "Mis eventos" > Realizados, cada evento tiene "Ver reseñas (n)", que abre la pantalla "Reseñas del
  evento" con el promedio de ese evento y sus reseñas.
- **CA-8**: En el detalle de un evento ya realizado aparece la sección "Reseñas de este evento".

### Contrato de API
- `GET /evento/:id/resenias` (existente) agrega `evento` (id, nombre, fecha), `puntajePromedio` y `cantidadResenias`
  junto a la paginación (cambio compatible).
- `GET /evento/mios`: cada evento agrega `resenias: { puntajePromedio, cantidadResenias }`.

---

## Decisiones tomadas en este módulo
- D-26: lectura de mensajes con endpoint explícito (el GET del chat se consulta por sondeo y no debe modificar datos).
- D-27: galería como carrusel en la portada.
- D-28: reseñas por evento en "Mis eventos" y en el detalle de eventos realizados.
