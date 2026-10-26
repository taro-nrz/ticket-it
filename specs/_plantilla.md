# MXX — <Nombre del módulo>

**Estado**: Borrador | En revisión | Aprobada | Implementada
**Depende de**: MXX
**Historias incluidas**: HU-XX, HU-XX

## Objetivo del módulo
Qué componente del sistema construye este módulo y qué habilita para los siguientes.

## Modelo
- Entidades nuevas o modificadas (atributos y métodos de dominio):
- Repositorios en memoria (métodos nuevos):
- Datos semilla que agrega:

## Preguntas abiertas
- [ ] P-1: ...

---

## HU-XX — <Título corto>

### Historia de usuario
Como <rol>, quiero <acción> para <beneficio>.

### Criterios de aceptación
- **CA-1**: Dado <contexto>, cuando <acción>, entonces <resultado esperado>.
- **CA-2**: ...

### Reglas de negocio
- RN-1: ...

### Contrato de API
#### `METODO /ruta`
- Headers: `x-user-id`
- Query / params:
- Body:
```json
{}
```
- Respuestas:
  - `200/201`:
  - `400` — validación:
  - `401/403` — usuario faltante / sin permiso:
  - `404` — no existe:
  - `409/422` — regla de negocio:

### Casos de prueba
| # | Caso | Esperado | CA |
|---|---|---|---|
| 1 | | | CA-1 |

### Tareas
- [ ] Entity
- [ ] Repository
- [ ] Service
- [ ] Controller + validación Zod
- [ ] Routes
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] OpenAPI / Postman

_(repetir el bloque HU-XX por cada historia del módulo)_

---

## Decisiones tomadas en este módulo
- ...
