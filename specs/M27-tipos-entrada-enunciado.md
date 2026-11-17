# M27 — Tipos de entrada del enunciado y retiro de cupones

**Estado**: Implementada (D-49)
**Depende de**: M2 (eventos), M11 (editar eventos), M17 (cupones, que se retira)
**Historias incluidas**: HU-01 (ajuste), HT-1 (historia técnica)

## Objetivo del módulo
Ajustar el alcance al enunciado:
1. El enunciado dice que el organizador define "los distintos **tipos de entrada** disponibles (por ejemplo,
   General, Platea o VIP)". Hoy el nombre del tipo es libre (en la semilla había Popular, Pullman, Campo,
   Estudiante). Pasa a ser una lista fija: **General, Platea y VIP**.
2. Los **cupones de descuento** (M17, D-38) no los pide el enunciado. Se retiran de punta a punta.

## Decisiones (consultadas)
- Lista fija General / Platea / VIP en el back (falso enum) y en el front (chips), no sólo sugerencias.
- Cupones: se sacan enteros (back, front, Swagger, semilla, mocks y tests). Quedan en el historial de git y
  documentados en D-38.

---

## HU-01 (ajuste) — Tipos de entrada al publicar o editar un evento
Como organizador, quiero elegir cada tipo de entrada entre General, Platea y VIP, para que los compradores
encuentren siempre las mismas categorías.

### Criterios de aceptación
- **CA-1**: Dado un evento con un tipo que no es General, Platea ni VIP, cuando se publica o edita, entonces
  responde **400** con el error en `tiposEntrada.N.nombre` ("El tipo de entrada debe ser General, Platea o VIP").
- **CA-2**: Dado un evento con dos tipos iguales, cuando se publica, entonces responde **400** (regla que ya existía).
- **CA-3**: Un evento tiene como máximo 3 tipos de entrada (uno de cada uno).
- **CA-4**: En el formulario, cada entrada se elige con chips. Sólo se ofrecen los tipos que todavía no usa otra
  entrada del evento, y "Agregar tipo de entrada" se deshabilita con los tres.

### Reglas de negocio
- RN-1: `NombreTipoEntrada = Object.freeze({ GENERAL: "General", PLATEA: "Platea", VIP: "VIP" })`. El valor es el
  nombre visible, así los DTO y la app no traducen nada.
- RN-2: La semilla usa sólo esos tres. Lo que antes era el nombre pasa a la descripción (por ejemplo, Superclásico:
  General "Tribuna popular"; Hamlet: General "Pullman, primer piso").

## HT-1 — Retirar los cupones
- **CA-1**: No existen las rutas `/evento/:id/cupones` (responden 404 como cualquier ruta inexistente).
- **CA-2**: `POST /compra` ya no acepta `codigoCupon`, y la compra no tiene `subtotal`, `descuento` ni `cupon`:
  el total es precio × cantidad.
- **CA-3**: En la app no aparecen la pantalla "Cupones de descuento" ni el campo de cupón al comprar.

## Verificación
| # | Qué | Esperado |
|---|---|---|
| 1 | `npm run test:backend` | 240 en verde (se borran los 8 tests de cupones y se suma el de CA-1) |
| 2 | `npm run test:e2e` | En verde, sin `cupones.spec.mjs` |
| 3 | Swagger | Sin la sección Cupones; `TipoEntrada.nombre` con `enum: [General, Platea, VIP]` |
