# M21 — Fotos del evento subidas desde el dispositivo

**Estado**: Implementada · **Depende de**: M2, M11, D-39 (carga de imágenes)

## HU-F1 — Subir las fotos de mi evento
Como organizador, quiero subir fotos desde el celular o la computadora en lugar de pegar enlaces.
- **CA-1**: `POST /archivos/imagenes` (multipart, campo `imagen`, sólo organizadores) guarda la imagen y devuelve
  su URL pública (`/uploads/<uuid>.<ext>`), que se usa en `multimedia`.
- **CA-2**: sólo JPG, PNG o WebP verificados por la **firma del archivo** (un texto renombrado a .png se rechaza,
  400) y de hasta 5 MB (413).
- **CA-3**: las imágenes se sirven con caché larga y `Cross-Origin-Resource-Policy: cross-origin` (la app web
  está en otro origen que la API).
- **CA-4**: en el formulario del evento: miniaturas con "Portada" en la primera, "Usar como portada", "Quitar",
  **barra de progreso real** de la subida con porcentaje, y la opción de pegar un enlace. Hasta 10 fotos.

Tests: `test/int/m21-imagenes.int.test.js` (6), `e2e/fotos.spec.mjs` (3, con axe).
