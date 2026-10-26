# M1 — Usuarios, Categorías, identificación y datos semilla

**Estado**: Implementada
**Depende de**: M0
**Historias incluidas**: HT-01, R-01 (favoritos), R-12 (datos semilla)

## Objetivo del módulo
Modelar los actores del sistema, el mecanismo de identificación que usan todos los módulos y los datos de prueba.

## Modelo
- `Usuario` (nombre, apellido, rol, favoritos) + `esOrganizador()`, `esComprador()`, `agregarFavorito()` (idempotente),
  `quitarFavorito()`, `tieneFavorito()`.
- `RolUsuario` = `COMPRADOR | ORGANIZADOR` (D-10).
- `Categoria` (nombre, descripcion).
- `InMemoryRepository` genérico (`findAll`, `findById`, `findBy`, `findOneBy`, `save`, `delete`, `count`, `clear`),
  extendido por `UsuarioRepository` y `CategoriaRepository`.
- `middlewares/usuarioMiddleware.js`: `usuarioOpcional`, `requiereUsuario`, `requiereRol(...roles)`.
- `data/seed.js`: 2 organizadores, 3 compradores, 5 categorías, 9 eventos, 13 compras en los 5 estados, mensajes,
  4 reseñas y favoritos. Fechas relativas a "ahora".

| id | Usuario | Rol |
|---|---|---|
| 1 | Lucía Fernández | ORGANIZADOR |
| 2 | Martín Gómez | ORGANIZADOR |
| 3 | Sofía Pérez | COMPRADOR |
| 4 | Juan Rodríguez | COMPRADOR |
| 5 | Valentina López | COMPRADOR |

---

## HT-01 — Identificación del usuario

### Criterios de aceptación
- **CA-1**: Sin `x-user-id` en un endpoint protegido → `401`.
- **CA-2**: `x-user-id` no numérico → `401`.
- **CA-3**: `x-user-id` de un usuario inexistente → `404`.
- **CA-4**: Usuario válido con rol incorrecto → `403`.
- **CA-5**: En endpoints públicos el header es opcional; si viene, se usa (ej. `esFavorito`).

### Contrato de API
- `GET /usuario?rol=` — lista (público).
- `GET /usuario/me` — usuario identificado.
- `GET /usuario/:id` — un usuario.
- `GET /categoria`, `GET /categoria/:id` — categorías (público).

## R-01 — Favoritos (extra, comprador)

### Historia
Como comprador, quiero guardar eventos favoritos para encontrarlos rápido.

### Criterios de aceptación
- **CA-1**: `POST /usuario/me/favoritos/:eventoId` agrega el evento (201); repetirlo no lo duplica.
- **CA-2**: `DELETE /usuario/me/favoritos/:eventoId` lo quita (204); si no era favorito → 404.
- **CA-3**: `GET /usuario/me/favoritos` lista paginada de resúmenes de eventos.
- **CA-4**: Evento inexistente → 404. Un organizador → 403.
- **CA-5**: El catálogo y el detalle marcan `esFavorito` para el comprador identificado.

## R-12 — Datos semilla
- **CA-1**: Al iniciar el server se cargan los datos semilla.
- **CA-2**: `POST /dev/reset` los recarga (no disponible con `NODE_ENV=production`).

## Casos de prueba
`test/int/m1-usuarios.int.test.js` (14 tests).

## Decisiones tomadas en este módulo
- Agregar un favorito es **idempotente** (201 aunque ya existiera): simplifica el botón "corazón" del front.
- Los middlewares de usuario se inyectan en el `Server` (`setAuth`) y llegan a cada factory de rutas como segundo
  parámetro `(getController, auth)`, manteniendo el patrón de rutas de clase.
