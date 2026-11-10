# M25 — Estructura del front como el ejercicio de clase (megasuper)

**Estado**: Implementada (D-46)
**Depende de**: M7–M24 (no agrega funciones: reorganiza el front que ya existe)
**Historias incluidas**: HT-1 a HT-4 (historias técnicas)

## Objetivo del módulo
Reorganizar el front de `ticket-it-pro` con la estructura del ejercicio de clase `ejercicio-megasuper-2026`
(ramas `clase9-front-react-pt1` a `clase11-integracion-front-back` y `chore/emotion-css-refactor`), **sin
cambiar ninguna funcionalidad**. Seguir el enunciado: **sigue siendo React Native con Expo** y corre en el
celular (Expo Go).

Agregar custom hooks **sólo donde hay repetición real**. Cada hook nuevo tiene que reemplazar código
duplicado que hoy existe en al menos 3 pantallas.

## Qué tomamos del ejercicio y cómo se traslada a React Native

| Megasuper (React web, CRA) | Ticket It Pro hoy | Ticket It Pro con M25 |
|---|---|---|
| `src/service/api.js`: instancia de axios + `mensajeDeError(error)` | `src/api/cliente.js` | `src/service/api.js` (misma idea, ya convierte los errores en mensajes legibles) |
| `src/service/productsService.js`: una función por endpoint + mapeo `aProducto` | `src/api/api.js` (125 líneas, todos los recursos juntos) | Un service por recurso: `authService`, `eventosService`, `comprasService`, `cuponesService`, `notificacionesService`, `reseniasService`, `imagenesService`, `tiempoReal`. Se mapea sólo donde la UI necesita algo distinto del DTO (por ejemplo, URL absoluta de las imágenes) |
| `src/context/CartContext.jsx` + hook `useCart()` | `src/store/*Context.js` | `src/context/` (`SesionContext`, `TemaContext`, `DialogosContext`, `NotificacionesContext`), cada uno con su hook `useX()` |
| `src/components/<nombre>/Componente.jsx` (+ `.css`) | `src/components/*.js` sueltos; `ui.js` (625 líneas) y `Pantalla.js` (422) agrupan muchos componentes | Una carpeta por componente: `components/eventoCard/EventoCard.jsx`. `ui.js` y `Pantalla.js` se separan en sus componentes (Boton, Campo, Chip, Encabezado, Campana…) |
| `src/features/<pantalla>/Pantalla.jsx` | `src/features/<pantalla>/*.js` | Igual, pero con extensión `.jsx` |
| `App.jsx` con `<Routes>`, `Layout` con `<Outlet/>` | `app/` de Expo Router (`_layout.js` = Layout) | Sin cambios: Expo Router es el equivalente nativo de React Router (D-18) |
| Estilos con `.css` o Emotion + `theme.js` | `StyleSheet` + `useEstilos` + `theme.js` | Sin cambios: en React Native no hay CSS. `useEstilos` cumple el rol del tema de Emotion |
| `mockdata/` | `src/mocks/` (MSW, D-39) | Sin cambios |

## Custom hooks

### Se mantienen (ya existen y se usan)
- `useCarga`: se usa en 17 pantallas para cargar datos con su estado de carga y error.
- `useEstilos`: se usa en todos los componentes para que los estilos sigan el tema.

### Nuevos (justificados por la repetición)
- **`useFormulario`**: es el equivalente al `useForm` de la rama `evolutivo-9` de clase. Hoy 7 formularios (Login,
  Registro, Recuperar, CrearEvento, Perfil, Checkout y Cupones) repiten lo mismo:
  - el estado de los valores;
  - `intentoEnviar`;
  - los errores de validación y los que manda el backend por campo;
  - el error general;
  - el estado `enviando`;
  - las refs de los campos, para mover el foco al primer error y anunciar al lector de pantalla "Hay N campos para corregir".

  API propuesta:
  ```js
  const { valores, cambiar, error, registrar, enviar, enviando, errorGeneral } =
    useFormulario({ inicial, validar, alEnviar });
  // cambiar("email")(texto) · error("email") · ref={registrar("email")} · onPress={enviar}
  ```
- **`useAccion`**: hoy 9 pantallas repiten el mismo patrón en 13 lugares:
  - guardar qué acción está en curso, para deshabilitar el botón;
  - `try { … avisarExito } catch { avisarError } finally`.

  API propuesta:
  ```js
  const { ejecutar, enCurso } = useAccion();
  ejecutar("CANCELAR", () => cancelarCompra(id), { exito: "Compra cancelada" });
  // enCurso === "CANCELAR" mientras se ejecuta
  ```

### Descartados (no ameritan un hook)
- `useSondeo` / `useEnVivo`: el Chat y las Notificaciones tienen lógicas distintas: el chat se pone al día al
  reconectar y avisa quién está escribiendo. Un hook común necesitaría tantas opciones que quedaría más
  confuso que el código actual.
- `usePaginacion`: las listas cargan hasta 100 elementos y no paginan en el cliente.
- Hooks por pantalla (por ejemplo `useEventoDetalle`) que sólo moverían código a otro archivo, sin
  reutilizarlo.

## Preguntas abiertas
- [x] P-1 (sí): ¿Extensión `.jsx` para todo lo que tiene JSX, como en megasuper? Propuesta: sí. Eso incluye
  componentes, pantallas y contexts, porque los contexts renderizan su Provider. `.js` queda para service,
  hooks y utils.
- [x] P-2 (español): ¿Nombres de carpetas y archivos en español, como el resto del TP (`eventoCard/EventoCard.jsx`), o en
  inglés como megasuper (`productGrid`)? Propuesta: español, como el dominio y las decisiones anteriores.

---

## HT-1 — Capa `service/` (antes `api/`)
Como desarrollador, quiero un service por recurso, para encontrar rápido cada endpoint y mapear las respuestas
en un único lugar.
- **CA-1**: `src/api/` desaparece y cada pantalla importa del service de su recurso.
- **CA-2**: El manejo de errores, el token y el rechazo de sesión siguen en `service/api.js`.

## HT-2 — `context/` y componentes en carpetas
- **CA-1**: `src/store/` pasa a llamarse `src/context/`.
- **CA-2**: Cada componente vive en `components/<nombre>/<Nombre>.jsx`, y `ui.js` y `Pantalla.js` quedan separados
  en un archivo por componente.
- **CA-3**: Las pantallas pasan a `.jsx`.

## HT-3 — Hook `useFormulario`
- **CA-1**: Los 7 formularios lo usan, y siguen funcionando igual: validación, errores del backend por campo,
  foco en el primer error y anuncio al lector de pantalla.

## HT-4 — Hook `useAccion`
- **CA-1**: Las acciones con aviso de éxito o error lo usan, y el botón de la acción en curso queda deshabilitado
  igual que hoy.

## Verificación (la funcionalidad no cambia)
| # | Qué | Esperado |
|---|---|---|
| 1 | `npm run test:e2e` (web, mobile, mobile-oscuro, sin-backend + axe) | 262 en verde, sin modificar los tests salvo imports |
| 2 | `npm run lint` y `npm run format:check` | 0 avisos |
| 3 | `npx expo export` y `expo-doctor` | Sin errores |
| 4 | Expo Go en el celular (Samsung A54) | Login, compra, QR y chat funcionan |

## Tareas (un commit por tarea)
- [x] HT-1: service por recurso
- [x] HT-2: context/, componentes en carpetas, `.jsx`
- [x] HT-3: `useFormulario` + los 7 formularios
- [x] HT-4: `useAccion` + sus usos (12 acciones en 9 pantallas; en CrearEvento el error lo maneja `useFormulario`)
- [x] Documentar la decisión D-46 en `docs/DOCUMENTACION.md` y la estructura en el README
