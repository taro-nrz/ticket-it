# Changelog — versión pro

Diferencias respecto del TP original (`ticket-it/`, módulos M0–M8). Cada entrada es un commit en este repo.

## Agregado
- **Autenticación real (M9)** — registro y login con email y contraseña (bcrypt), sesión con JWT de 8 h,
  límite de intentos de login por IP, cierre de sesión automático si el token vence. Reemplaza al header
  `x-user-id` (D-29).
- **Perfil (M10)** — editar nombre y apellido; cambiar la contraseña pidiendo la actual (D-30).
- **Gestión de eventos (M11)** — editar un evento publicado (sin romper las ventas hechas) y cancelarlo con
  motivo, con cancelación y reembolso automático de todas sus compras (D-31).
- **Notificaciones (M12)** — campana con contador, lista de avisos (ventas, mensajes, cancelaciones, entradas
  validadas, reseñas), agrupación de avisos repetidos y "marcar todas como leídas" (D-32).
- **Entrada con QR (M13)** — código único por compra pagada, QR en el detalle, pantalla "Validar entradas" para
  el organizador con cámara (celular) o código escrito (D-33).
- **Estadísticas (M14)** — ocupación, recaudación, ticket promedio, cancelaciones, asistencia, ventas por día y
  por tipo, con resumen en texto y tabla accesible (D-34).
- **Infraestructura (D-35)** — Dockerfiles + `docker-compose.yml`, GitHub Actions (lint, formato, cobertura,
  E2E + axe, build de imágenes), `helmet`, `X-Request-Id`, límite de tamaño del body, configuración validada
  al arrancar, cierre ordenado, pantalla 404, "deslizar para recargar".

### Segunda tanda (M15–M23)
- **Reserva con vencimiento (M15)** — una compra sin pagar vence a los 15 minutos y libera el cupo (D-36).
- **Checkout (M16)** — pago con tarjeta y pasarela simulada; sólo se guardan marca y últimos 4 (D-37).
- **Cupones (M17)** — porcentaje, monto fijo y 2×1 por evento, con polimorfismo (D-38).
- **Estados de carga y MSW (M18)** — esqueletos, barra de recarga, imágenes progresivas, aviso de demora; MSW con
  latencia y modo sin backend con datos generados desde la API real (D-39).
- **Lista de espera (M19)** — aviso y 30 minutos de prioridad cuando se libera cupo (D-40).
- **Transferir entrada (M20)** — a otra cuenta, con un QR nuevo (D-41).
- **Fotos (M21)** — subida con validación por firma del archivo y progreso real (D-42).
- **Compartir y calendario (M22)** — hoja de compartir del sistema y archivo .ics (D-43).
- **Recuperar contraseña (M23)** — código de 6 números por email simulado (D-44).
- **Tiempo real (M24)** — chat, "escribiendo…" y notificaciones por WebSocket (Socket.IO), con el sondeo como
  respaldo si no hay conexión (D-45).

## Cambiado
- El encabezado de las pantallas principales: saludo + campana + Cuenta arriba, título + acción abajo.
- `CrearEvento` sirve también para editar. El menú "Cuenta" suma "Mi perfil" y muestra el email.
- ESLint revisa también el frontend (React + hooks) y `npm run lint` falla ante cualquier aviso.
- `app.json`: modo oscuro del sistema también en el celular (`userInterfaceStyle: automatic`), colores de marca.

## Corregido
- El resumen de errores de "Publicar evento" usaba un color fijo que no respetaba el modo oscuro.
- 38 avisos de lint en el frontend (imports y variables sin usar, un componente sin nombre).

## Verificación
| | TP original | Versión pro |
|---|---|---|
| Tests del backend | 133 | 251 (cobertura 95 %) |
| Tests E2E + axe | 90 | 262 |
| Lint del frontend | no se revisaba | 0 errores, 0 avisos |
