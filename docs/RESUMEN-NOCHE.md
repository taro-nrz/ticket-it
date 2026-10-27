# Resumen del trabajo autónomo — versión pro

Copia del TP en `ticket-it-pro/`, con repo git propio y un commit por fase (`git log --oneline`). El TP original
(`ticket-it/`) **no se tocó**: sigue siendo la entrega segura.

## Qué se hizo

| Fase | Commit | Qué agrega |
|---|---|---|
| F0 | Línea base | Copia del TP (M0–M8) con todos los tests en verde |
| F1 | M9 | Registro y login con email y contraseña, JWT, límite de intentos, sesión vencida |
| F2 | M10 | Perfil: editar datos y cambiar contraseña |
| F3 | M11 | Editar y cancelar eventos (con reembolso automático de las compras) |
| F4 | M12 | Notificaciones in-app con campana, agrupación y sondeo |
| F5 | M13 | Entrada con QR y pantalla "Validar entradas" (cámara en el celular o código escrito) |
| F6 | M14 | Estadísticas del evento con gráficos y tabla accesible |
| F7 | Calidad e infra | helmet, request-id, config validada, Docker + compose, CI, lint del frontend, cobertura, 404 |
| F8 | Documentación | README, changelog, guion del video pro, backlog M9–M14 |

## Segunda tanda (a pedido, con las decisiones consultadas)

| Módulo | Qué agrega |
|---|---|
| M15 | Reservas sin pagar que vencen a los 15 min (estado VENCIDA) |
| M16 | Checkout con tarjeta y pasarela simulada |
| M17 | Cupones por evento: porcentaje, monto fijo y 2×1 (polimorfismo) |
| M18 | Estados de carga según la ocasión + MSW (latencia y modo sin backend) |
| M19 | Lista de espera con 30 min de prioridad |
| M20 | Transferir una entrada con QR nuevo |
| M21 | Subida de fotos con validación por firma y progreso real |
| M22 | Compartir el evento y agregarlo al calendario (.ics) |
| M23 | Recuperar la contraseña con código por email simulado |
| M24 | Chat y notificaciones en tiempo real con WebSockets (el sondeo queda de respaldo) |

## Cómo verificarlo

```bash
cd ticket-it-pro
npm install
npm run verificar                                  # lint + formato + 251 tests del backend
CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e   # 262 E2E + accesibilidad (incluye el modo sin backend)
npm run start:web                                  # y entrar con sofia@ticketit.com / ticketit123
```

Estado al terminar: **251** tests de backend (cobertura 95 % líneas), **262** E2E en web, celular, modo oscuro y sin backend
(axe sin violaciones), ESLint y Prettier sin avisos, `expo-doctor` 20/20 y `docker compose up` probado con un
navegador sobre la build de producción.

## Decisiones tomadas sin consultar (para revisar)
1. **`bcryptjs` en lugar de `bcrypt`**: mismo algoritmo, sin compilar código nativo.
2. **`x-user-id` eliminado por completo**: no quedó como "modo desarrollo", para no dejar una puerta trasera.
   Los tests firman un JWT con el helper `auth(usuarioId)`.
3. **Contraseña demo única `ticketit123`** para los 5 usuarios, y "Cuentas de prueba" en el login que completan el
   formulario (la demo sigue siendo ágil sin saltear el login real).
4. **El email no se puede cambiar** desde el perfil. Cambiar la contraseña no invalida los tokens ya emitidos
   (haría falta una lista de revocación).
5. **Cancelar un evento exige un motivo** que ven los compradores; los eventos cancelados no se borran (baja lógica).
6. **Notificaciones por sondeo** cada 15 s (después, a pedido, pasaron a WebSockets en M24; el sondeo quedó de
   respaldo).
7. **Un código QR por compra** (vale para todas sus entradas), no uno por entrada. El QR sólo contiene el código.
8. **El encabezado se reorganizó** en dos filas para que entre la campana.
9. **No se hizo MongoDB (F9 opcional)**: el enunciado y la decisión D-02 piden persistencia en memoria, y migrar
   el grafo de entidades con referencias compartidas tenía riesgo alto para algo que no suma a la entrega.

Decisiones de la segunda tanda tomadas sin consultar: ver los apartados "Sin consultar" de D-36 a D-44 en
`docs/DOCUMENTACION.md` (por ejemplo: el chat empieza de cero al transferir, MSW sólo en web, orden estricto en la
lista de espera, duración de 3 h en el .ics).

## Qué no se pudo probar
- **El celular real**: el escaneo con `expo-camera`, el guardado del token con `expo-secure-store`, el selector de
  fotos y la hoja de compartir nativa sólo funcionan en un dispositivo. En web todo está probado; en Expo Go
  conviene revisar el escáner de "Validar entradas".
- **El CI en GitHub**: el workflow está escrito y su YAML es válido, pero no se ejecutó (el repo no tiene remoto).
  Todo lo que corre ya pasa localmente.

## Ideas para seguir
- Revocación de tokens o refresh tokens; envío real de emails (SMTP o un proveedor) en lugar del simulado.
- Notificaciones push reales (Expo Notifications) en lugar de sondeo.
- Persistencia con MongoDB si la cátedra lo permite (los repositorios ya tienen interfaz async).
