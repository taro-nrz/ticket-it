# M17 — Cupones de descuento

**Estado**: Implementada · **Depende de**: M2, M3, M15

## Modelo
`Cupon` (código único por evento, usos, usosMaximos, vence, activo) con subclases **`CuponPorcentaje`**,
**`CuponMontoFijo`** y **`CuponDosPorUno`**: cada una implementa `descuentoPara(precio, cantidad)` y
`descripcion()` (polimorfismo, como los descuentos de `domain.js` de clase). `crearCupon()` es la fábrica.
`Compra` guarda `subtotal`, `descuento`, `total` y el cupón.

## HU-D1 — Crear cupones para mi evento
Como organizador, quiero crear cupones para vender más entradas.
- **CA-1**: `POST /evento/:id/cupones` (porcentaje 1–100, monto > 0 o 2×1; código 3–20 letras o números; usos
  máximos y vencimiento opcionales). Código repetido en el evento → 409; evento ajeno → 403; no vigente → 422.
- **CA-2**: `GET /evento/:id/cupones` lista con usos y disponibilidad; `DELETE …/:cuponId` lo desactiva.

## HU-D2 — Usar un cupón al comprar
Como comprador, quiero aplicar un cupón y ver cuánto ahorro antes de comprar.
- **CA-3**: `GET /evento/:id/cupones/validar` muestra subtotal, descuento y total sin usar el cupón.
- **CA-4**: `POST /compra { …, codigoCupon }` aplica el descuento (nunca mayor al subtotal); si el cupón no
  existe (404) o no aplica (422: inactivo, vencido, sin usos, 2×1 con 1 entrada) no se reserva cupo.
- **CA-5**: si la compra se cancela o vence, el uso del cupón se devuelve.

Semilla: `INDIE20` (20 %) e `INDIE2X1` (2×1, 5 usos) en el evento 1; `RISAS` ($ 2.000) en el stand-up.
Tests: 4 unitarios del polimorfismo, `test/int/m17-cupones.int.test.js` (8), `e2e/cupones.spec.mjs` (4, con axe).
