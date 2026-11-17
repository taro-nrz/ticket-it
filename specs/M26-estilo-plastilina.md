# M26 — Estilo visual "Plastilina"

**Estado**: Implementada (D-48)
**Depende de**: M25 (estructura del front), D-20 (sistema visual), D-21 (accesibilidad), D-22 (modo oscuro)
**Historias incluidas**: HT-1 a HT-4 (historias técnicas)

## Objetivo del módulo
Cambiar la identidad visual de la app por la dirección **Plastilina**, elegida entre las opciones de estilo
(fondo lila, colores pastel, contornos gruesos y sombras duras). La idea es que no se parezca al estilo
crema + acento único que generan por defecto las IA y que tendrán otros TPs.

**No cambia ninguna funcionalidad.** Se mantienen:
- las mismas pantallas, en el mismo orden y con la misma navegación;
- los mismos textos;
- los mismos roles y nombres accesibles.

Sólo cambian colores, tipografías, bordes, sombras y radios.

## Qué se toma del prototipo
| Elemento | Hoy (D-20) | Con M26 |
|---|---|---|
| Fondo | Crema `#F5F3EE` | Lila `#E8DCFF` |
| Botón principal | Azul noche con texto crema | Rosa `#FF6FB0` con texto tinta `#1B1530` |
| Tarjetas, campos, chips, botones | Borde fino de 1 px, sin sombra | Contorno tinta de 2,5 px + sombra dura `3px 3px 0` |
| Al tocar un botón o una tarjeta | Baja la opacidad | Se "hunde": la sombra desaparece y se corre 3 px (sin animación) |
| Títulos | Bricolage Grotesque 800 | Bagel Fat One |
| Texto | DM Sans | Figtree (400, 500, 600, 700, 800) |
| Paneles oscuros (login, panel del organizador, entrada) | Azul noche con texto claro | Menta `#B8F2D6` con texto tinta |
| Fondo por categoría en las tarjetas de evento | Bloques oscuros | Pastel: Recitales durazno, Teatro menta, Festivales manteca, Conferencias celeste, Deportes lima |
| Fecha en la tarjeta del evento | Recuadro | Sticker redondo levemente girado |
| Colores de los estados de compra | Por tono y claridad (HU-05) | Iguales (ya cumplen AA); se suma el contorno |

## Cómo se implementa
- **`src/theme.js`**: se cambian los valores de `paletas.claro` y `paletas.oscuro`, de `fuentes` y de
  `radio`. Los nombres de los tokens no cambian (`fondo`, `primario`, `panel`…), así que los ~60 componentes
  que los usan no se tocan.
- Tokens nuevos:
  - `contorno` (color del contorno grueso);
  - `sombra` (la sombra dura, con la prop `boxShadow` de React Native 0.88, que anda en Android, iOS y web);
  - `grosor` (2,5 px).
- **Componentes con el gesto propio**: `Boton`, `Tarjeta`, `Chips`, `Campo`, `EventoCard`, `CompraCard`,
  `EntradaQR`, `Tabs` y `ModalAccesible`. Usan `contorno`, `sombra` y el estado presionado.
- **`app/_layout.jsx`**: carga Bagel Fat One y Figtree. Se desinstalan Bricolage Grotesque y DM Sans
  (`@expo-google-fonts/bagel-fat-one`, `@expo-google-fonts/figtree`).
- `coloresCategoria` pasa a los colores pastel y la marca de agua usa tinta con transparencia.

## Paleta propuesta (contraste verificado)
Cada par texto/fondo se verificó con la fórmula de WCAG:
- texto: mínimo 4,5:1;
- bordes de controles y marcas de gráficos: mínimo 3:1.

### Claro
| Token | Valor | Par verificado |
|---|---|---|
| fondo | `#E8DCFF` | texto 13,5 · textoSecundario 7,0 · acentoTexto 5,7 |
| superficie | `#FFFFFF` | textoSecundario 9,1 · acentoTexto 7,5 · error 6,5 |
| apagado | `#F3EDFF` | texto 15,4 |
| texto / contorno / bordeControl | `#1B1530` | bordeControl sobre superficie 17,6 |
| textoSecundario | `#4B4463` | — |
| borde (separadores finos) | `#D6CBF0` | decorativo |
| primario | `#FF6FB0` | sobrePrimario `#1B1530` 6,8 · sobrePrimarioSuave `#4A1030` 5,8 |
| acento (íconos, insignias) | `#EC4D96` | 3,5:1 sobre blanco · sobreAcento `#1B1530` 5,1 |
| acentoSuave / acentoTexto | `#FFE0EF` / `#A3155C` | 6,1 |
| panel / sobrePanel / sobrePanelSuave | `#B8F2D6` / `#1B1530` / `#2F4A3E` | 14,0 · 7,7 |
| ticket | `#FFE58A` | texto 14,1 |
| dato (gráficos) | `#C2185B` | 5,9 sobre superficie |
| error / errorFondo | `#B3261E` / `#FDE7E4` | 5,5 |
| Categorías | `#FFC3A8` `#B8F2D6` `#FFE58A` `#A9D8FF` `#C9F29B` | tinta sobre cada una ≥ 11,4 |

### Oscuro
| Token | Valor | Par verificado |
|---|---|---|
| fondo | `#17122B` | texto `#F3EEFF` 16,0 · contorno `#CFC3F7` 11,1 |
| superficie | `#241D3F` | textoSecundario `#BDB3DA` 8,0 · bordeControl `#CFC3F7` 9,7 · acentoTexto `#FFA8CF` 8,9 · error `#FF8A73` 6,9 · exito `#6FD39A` 8,7 |
| primario | `#FF7FBA` | sobrePrimario `#1B1530` 7,5 |
| acentoSuave | `#4A1F3A` | acentoTexto 7,6 |
| panel | `#8FDDB8` | sobrePanel `#1B1530` 11,0 · sobrePanelSuave `#2F4A3E` 6,1 |
| ticket | `#3A2F17` | texto 11,6 |
| dato | `#FF7FBA` | 6,8 sobre superficie |

## Preguntas abiertas
- [x] **P-1: Contorno y sombra en modo oscuro.** Una sombra tinta sobre fondo oscuro casi no se ve. Hay dos opciones:
  - **(a) Recomendada:** contorno lila claro `#CFC3F7` y sombra negra `#0A0716`. El contorno da el efecto
    "recortado" y cumple 3:1 como borde de control.
  - **(b)** Contorno lila y sombra rosa `#FF7FBA`, más llamativa y con menos sobriedad.
- [x] **P-2: El estilo actual.** Hay dos opciones:
  - **Recomendada:** se reemplaza. Queda en el historial de git y documentado en D-20.
  - Se conserva como tercer tema ("Clásico") en el selector. Eso duplica las paletas y suma tests.
- [x] **P-3: Títulos.** Bagel Fat One tiene un solo peso y es muy redonda. Propuesta:
  - Bagel sólo para `titulo` (títulos de pantalla y de evento);
  - Figtree 800 para `subtitulo` y `seccion`, para que las listas no queden pesadas.
- [x] **P-4:** ¿Aprovecho para corregir el texto "1 disponibles" → "Queda 1" / "Quedan N"? Es el único cambio
  de texto, y es un error gramatical, no funcional.

---

## HT-1 — Tokens nuevos en `theme.js`
Como desarrollador, quiero cambiar la identidad visual desde un único archivo, para que ningún componente
tenga colores propios.
- **CA-1**: `paletas.claro` y `paletas.oscuro` tienen los valores de las tablas, con los mismos nombres que hoy
  más `contorno`, `sombra` y `grosor`.
- **CA-2**: `fuentes` apunta a Bagel Fat One y Figtree, y las fuentes viejas se desinstalan.
- **CA-3**: No queda ningún color escrito a mano fuera de `theme.js`, salvo el blanco del botón de éxito, que ya existe hoy.

## HT-2 — Componentes con contorno y sombra dura
Como usuario, quiero que lo que se puede tocar se vea como un objeto con relieve, para distinguirlo del texto.
- **CA-1**: Botones, tarjetas tocables, chips, campos, pestañas y modales tienen contorno de 2,5 px y sombra `3px 3px 0`.
- **CA-2**: Al presionarlos, la sombra desaparece y el elemento se corre 3 px, como si se hundiera.
  No hay animación, así que no depende de "reducir movimiento".
- **CA-3**: Lo que no se toca (textos, separadores, secciones) no lleva sombra. Así el relieve indica qué es interactivo.
- **CA-4**: El foco visible del teclado en web (D-21) sigue siendo un anillo de 2 px distinto del contorno.

## HT-3 — Detalles propios del estilo
- **CA-1**: La fecha de `EventoCard` es un sticker circular blanco con contorno, girado −8°. Sigue oculto para
  el lector de pantalla, porque la fecha ya está en el nombre accesible de la tarjeta.
- **CA-2**: Las tarjetas de evento sin foto muestran el color pastel de su categoría con dos círculos decorativos.
- **CA-3**: `EntradaQR` usa el color `ticket` (manteca), y el QR queda sobre blanco con contorno para que se lea bien en la puerta.

## HT-4 — Accesibilidad y regresión
- **CA-1**: `npm run test:e2e` pasa completo en los proyectos web, mobile, mobile-oscuro y sin-backend, con axe sin violaciones.
  El único test que depende de un color es `e2e/tema.spec.mjs`: comprueba el fondo de la página en claro y oscuro.
  Se actualiza a `rgb(232, 220, 255)` y `rgb(23, 18, 43)`.
- **CA-2**: Con letra al 200 % (WCAG 1.4.4), Bagel Fat One no corta títulos: los títulos ocupan las líneas que necesiten.
- **CA-3**: Los objetivos táctiles siguen en 44–50 px. El contorno se dibuja hacia adentro, no achica el área.
- **CA-4**: Probado en Expo Go en el Samsung A54. La prop `boxShadow` se verifica en el dispositivo, porque los E2E
  corren en web y ahí no detectarían un problema propio de Android (lección de D-47).

## Verificación
| # | Qué | Esperado |
|---|---|---|
| 1 | `npm run test:e2e` | 262 en verde |
| 2 | `npm run lint` y `npm run format:check` | 0 avisos |
| 3 | `npx expo export --platform android` | Sin errores |
| 4 | Recorrido en el A54, claro y oscuro: login, explorar, comprar, QR, chat y panel del organizador | Mismo comportamiento que hoy, con el estilo nuevo |
| 5 | Script de contraste sobre `theme.js` | Todos los pares ≥ 4,5:1 (texto) y ≥ 3:1 (bordes y gráficos) |

## Tareas (un commit por tarea)
- [x] HT-1: tokens y fuentes
- [x] HT-2: contorno, sombra y presionado en los componentes base
- [x] HT-3: sticker de fecha, categorías pastel y entrada
- [x] HT-4: E2E y capturas en web
- [ ] HT-4: prueba en el Samsung A54 con Expo Go (pendiente, la hace el usuario)
- [x] Documentar la decisión D-48 en `docs/DOCUMENTACION.md` (reemplaza la paleta de D-20/D-22) y actualizar README y guion
