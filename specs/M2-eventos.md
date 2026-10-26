# M2 — Eventos

**Estado**: Implementada
**Depende de**: M1
**Historias incluidas**: HU-01, HU-02, HU-03 (+ R-02 multimedia, R-03 rango de precio, R-04 mis eventos, R-10 lugar)

## Objetivo del módulo
Publicación de eventos por los organizadores y el catálogo que exploran los compradores.

## Modelo
- `Evento` (nombre, descripcion, categoria, fecha, lugar, direccion, tiposEntrada, multimedia, organizador):
  `tuPrecioEstaEntre(min, max)`, `precioMinimo()`, `precioMaximo()`, `yaSeRealizo(ahora)`, `esElDiaOPosterior(ahora)`,
  `buscarTipoEntrada(id)`, `estaAgotado()`, `esOrganizadoPor(usuario)`, `coincideConTexto(texto)`.
- `TipoEntrada` (nombre, descripcion, precio, cupo, vendidas): `hayCupoPara(cant)`, `disponibles()`, `reservar(cant)`, `liberar(cant)`.
  Los ids de los tipos son locales al evento (1..n).
- `EventoRepository.buscar(filtros, ahora)`, `findByOrganizador`, `findByNombreYOrganizador`.

---

## HU-01 — Crear un evento con tipos de entrada

### Historia
Como organizador, quiero crear un Evento ofreciendo distintos tipos de entrada, cada uno con su precio y cupo,
para adaptarme a diferentes públicos y presupuestos.

### Criterios de aceptación
- **CA-1**: Dado un organizador, cuando envía un evento válido con ≥1 tipo de entrada, entonces se crea (201) y él queda como organizador.
- **CA-2**: Un comprador no puede crear eventos (403).
- **CA-3**: Sin tipos de entrada → 400.
- **CA-4**: Precio negativo o cupo no entero/≤0 → 400 con el campo exacto (`tiposEntrada.0.precio`).
- **CA-5**: Tipos con nombre repetido (sin distinguir mayúsculas) → 400.
- **CA-6**: Fecha pasada → 400.
- **CA-7**: Categoría inexistente → 404.
- **CA-8**: Mismo organizador, mismo nombre y misma fecha → 409.

### Contrato
`POST /evento` — body: `nombre (3-100)`, `descripcion (10-2000)`, `categoriaId`, `fecha (ISO, futura)`, `lugar`,
`direccion`, `multimedia (URLs, máx. 10, opcional)`, `tiposEntrada [{ nombre, descripcion?, precio ≥ 0, cupo entero ≥ 1 }] (1-10)`.

## HU-02 — Buscar por texto o explorar por categorías

### Historia
Como comprador, quiero buscar Eventos por texto o explorarlos por categorías.

### Criterios de aceptación
- **CA-1**: Por defecto se listan sólo eventos futuros, paginados.
- **CA-2**: `texto` busca en nombre, descripción, lugar y categoría, sin distinguir mayúsculas ni acentos.
- **CA-3**: `categoria` filtra por id de categoría (las categorías se listan en `GET /categoria`).
- **CA-4**: `incluirPasados=true` incluye eventos realizados.
- **CA-5**: `precioMin`/`precioMax` filtran con `Evento.tuPrecioEstaEntre`; `precioMin > precioMax` → 400.
- **CA-6**: Sin resultados → 200 con `data: []`.

## HU-03 — Ordenar por precio, fecha y puntaje del organizador

### Criterios de aceptación
- **CA-1**: `orden=precio` usa el precio más bajo del evento; `dir=asc|desc`.
- **CA-2**: `orden=fecha` (default, ascendente).
- **CA-3**: `orden=puntaje` usa el promedio de reseñas del organizador; los organizadores sin reseñas van al final.
- **CA-4**: Un orden inválido → 400.

### Contrato
`GET /evento?texto&categoria&precioMin&precioMax&fechaDesde&fechaHasta&incluirPasados&orden&dir&page&limit` (público).

## Detalle y mis eventos
- `GET /evento/:id` (público): tipos con `cupo/vendidas/disponibles/agotado`, multimedia, reputación del organizador
  y sus últimas 5 reseñas (HU-12).
- `GET /evento/mios` (organizador): sus eventos (próximos primero) con `tiposEntrada` y `ventas`
  (`cupoTotal`, `entradasVendidas`, `cantidadCompras`, `comprasPendientes`, `recaudacion`).

## Casos de prueba
`test/int/m2-eventos.int.test.js` (24 tests) y `test/unit/entidades.test.js` (Evento, TipoEntrada).

## Decisiones tomadas en este módulo
- El catálogo oculta eventos pasados por defecto: un comprador no puede comprarlos.
- Desempate del ordenamiento: fecha y luego id (orden estable).
- La validación de "fecha futura" y "tipos repetidos" vive en el service (depende de "ahora" / de varios campos);
  la de formato, en el schema Zod del controller.
