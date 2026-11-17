// Sistema visual "Plastilina" (D-48, reemplaza la paleta de D-20) con modo claro y oscuro (D-22).
// Los colores tienen nombres por ROL (fondo, texto, primario, panel...) y cada tema define su valor.
// Todos los pares texto/fondo cumplen WCAG AA (≥ 4.5:1) y los bordes de controles ≥ 3:1, en ambos temas.
// Lo que se puede tocar lleva `contorno` grueso y `sombra` dura; al presionarlo se "hunde" (ver `relieve`).

const claro = {
  fondo: "#E8DCFF",
  superficie: "#FFFFFF",
  apagado: "#F3EDFF",
  borde: "#D6CBF0", // separadores finos (decorativos)
  bordeControl: "#1B1530", // 17,6:1 sobre blanco (WCAG 1.4.11)
  troquel: "#B9A9E6",
  texto: "#1B1530",
  textoSecundario: "#4B4463",
  // botones principales, chip activo, mensajes propios
  primario: "#FF6FB0",
  sobrePrimario: "#1B1530",
  sobrePrimarioSuave: "#4A1030",
  // paneles (login, panel del organizador, entrada): menta con tinta
  panel: "#B8F2D6",
  panelSuave: "#9BE6C3",
  sobrePanel: "#1B1530",
  sobrePanelSuave: "#2F4A3E",
  ticket: "#FFE58A",
  // íconos y marcas: 3,5:1 sobre blanco y 5:1 con tinta encima
  acento: "#EC4D96",
  sobreAcento: "#1B1530",
  acentoSuave: "#FFE0EF",
  acentoTexto: "#A3155C",
  acentoOscuro: "#A3155C",
  dato: "#C2185B",
  error: "#B3261E",
  errorFondo: "#FDE7E4",
  exito: "#1D6B3A",
  exitoBoton: "#1D6B3A",
  estrella: "#E8A317",
  // D-48: contorno y sombra dura de los elementos tocables
  contorno: "#1B1530",
  sombra: "#1B1530",
};

const oscuro = {
  fondo: "#17122B",
  superficie: "#241D3F",
  apagado: "#2E2650",
  borde: "#3A3160",
  bordeControl: "#CFC3F7", // 9,7:1 sobre la superficie
  troquel: "#5A4F86",
  texto: "#F3EEFF",
  textoSecundario: "#BDB3DA",
  primario: "#FF7FBA",
  sobrePrimario: "#1B1530",
  sobrePrimarioSuave: "#4A1030",
  panel: "#8FDDB8",
  panelSuave: "#7CCFA8",
  sobrePanel: "#1B1530",
  sobrePanelSuave: "#2F4A3E",
  ticket: "#3A2F17",
  acento: "#FF7FBA",
  sobreAcento: "#1B1530",
  acentoSuave: "#4A1F3A",
  acentoTexto: "#FFA8CF",
  acentoOscuro: "#FFA8CF",
  dato: "#FF7FBA",
  error: "#FF8A73",
  errorFondo: "#3A1A14",
  exito: "#6FD39A",
  exitoBoton: "#1D6B3A",
  estrella: "#E8A317",
  // P-1 de M26: en oscuro el contorno es lila claro y la sombra casi negra (efecto "recortado")
  contorno: "#CFC3F7",
  sombra: "#0A0716",
};

export const paletas = { claro, oscuro };

// Estados de compra: se distinguen por tono Y claridad, siempre con texto (HU-05, WCAG 1.4.1)
const ETIQUETAS_ESTADO = {
  PENDIENTE: { etiqueta: "Pendiente de pago", corta: "Pendientes" },
  CONFIRMADA: { etiqueta: "Confirmada", corta: "Confirmadas" },
  UTILIZADA: { etiqueta: "Utilizada", corta: "Utilizadas" },
  CANCELADA: { etiqueta: "Cancelada", corta: "Canceladas" },
  REEMBOLSADA: { etiqueta: "Reembolsada", corta: "Reembolsadas" },
  VENCIDA: { etiqueta: "Vencida", corta: "Vencidas" },
};

const COLORES_ESTADO = {
  claro: {
    PENDIENTE: { color: "#8A5A00", fondo: "#FFF1D6" },
    CONFIRMADA: { color: "#1F4FB8", fondo: "#E1ECFF" },
    UTILIZADA: { color: "#1D6B3A", fondo: "#DDF3E4" },
    CANCELADA: { color: "#5D5866", fondo: "#ECEAE6" },
    REEMBOLSADA: { color: "#6E2DA0", fondo: "#F0E4FA" },
    VENCIDA: { color: "#8C3B12", fondo: "#FBE6DA" },
  },
  oscuro: {
    PENDIENTE: { color: "#F5C76A", fondo: "#3A2C0E" },
    CONFIRMADA: { color: "#9DBBFF", fondo: "#172A4F" },
    UTILIZADA: { color: "#7FD6A2", fondo: "#143323" },
    CANCELADA: { color: "#B5AFC2", fondo: "#2A2536" },
    REEMBOLSADA: { color: "#D3A6F5", fondo: "#2E1A40" },
    VENCIDA: { color: "#F2A27A", fondo: "#3A1E12" },
  },
};

export function estadosDelTema(nombreTema) {
  return Object.fromEntries(
    Object.entries(ETIQUETAS_ESTADO).map(([estado, textos]) => [
      estado,
      { ...textos, ...COLORES_ESTADO[nombreTema][estado] },
    ]),
  );
}

// Etiquetas de los estados (no dependen del tema)
export const estadosCompra = ETIQUETAS_ESTADO;

// D-48: Bagel Fat One (un solo peso, muy redonda) sólo para los títulos grandes y los números destacados;
// Figtree para subtítulos y texto, así las listas no quedan pesadas (P-3 de M26)
export const fuentes = {
  titulo: "BagelFatOne_400Regular",
  subtitulo: "Figtree_800ExtraBold",
  texto: "Figtree_400Regular",
  medio: "Figtree_500Medium",
  semi: "Figtree_600SemiBold",
  negrita: "Figtree_700Bold",
};

export const espacio = { xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 28 };

export const radio = { s: 12, m: 16, l: 20, xl: 26 };

// D-48: grosor del contorno y desplazamiento de la sombra dura
export const relieveBase = { grosor: 2.5, desplazamiento: 3 };

// Contorno + sombra dura de lo que se puede tocar. Presionado, la sombra desaparece y el elemento
// se corre lo mismo que medía la sombra, como si se hundiera (sin animación: no depende de "reducir movimiento").
export function relieve(colores, presionado = false) {
  const { grosor, desplazamiento: d } = relieveBase;
  return {
    borderWidth: grosor,
    borderColor: colores.contorno,
    boxShadow: presionado ? "none" : `${d}px ${d}px 0px ${colores.sombra}`,
    transform: presionado ? [{ translateX: d }, { translateY: d }] : [],
  };
}

// Estilos de texto reutilizables (dependen del tema por el color)
export function estilosDeTexto(colores) {
  return {
    tituloGrande: {
      fontFamily: fuentes.titulo,
      fontSize: 30,
      color: colores.texto,
    },
    titulo: {
      fontFamily: fuentes.subtitulo,
      fontSize: 19,
      color: colores.texto,
    },
    seccion: { fontFamily: fuentes.subtitulo, fontSize: 18, color: colores.texto },
    cuerpo: { fontFamily: fuentes.texto, fontSize: 15, color: colores.texto },
    cuerpoFuerte: { fontFamily: fuentes.negrita, fontSize: 15, color: colores.texto },
    secundario: { fontFamily: fuentes.texto, fontSize: 14, color: colores.textoSecundario },
    chico: { fontFamily: fuentes.texto, fontSize: 13, color: colores.textoSecundario },
    etiqueta: {
      fontFamily: fuentes.negrita,
      fontSize: 12,
      letterSpacing: 1.1,
      color: colores.textoSecundario,
      textTransform: "uppercase",
    },
    categoria: {
      fontFamily: fuentes.negrita,
      fontSize: 12,
      letterSpacing: 1,
      color: colores.acentoOscuro,
    },
  };
}

// Color pastel por categoría (detrás de la foto del evento; igual en ambos temas). La tinta sobre
// cada uno supera 11:1. `marca` es la marca de agua con el nombre de la categoría y `circulo` el adorno.
export const coloresCategoria = {
  Recitales: { fondo: "#FFC3A8", marca: "#F2A584", circulo: "#FFE58A" },
  Teatro: { fondo: "#B8F2D6", marca: "#93E0BB", circulo: "#A9D8FF" },
  Festivales: { fondo: "#FFE58A", marca: "#F2D263", circulo: "#FF9FCB" },
  Conferencias: { fondo: "#A9D8FF", marca: "#86C2F2", circulo: "#C9F29B" },
  Deportes: { fondo: "#C9F29B", marca: "#AEDE79", circulo: "#FFE58A" },
};

// Tinta y fondo del sticker de fecha que va encima del color de categoría (iguales en ambos temas)
export const tintaCategoria = "#1B1530";
export const stickerCategoria = "#FFFFFF";

export function colorDeCategoria(nombre) {
  return coloresCategoria[nombre] ?? { fondo: "#E8DCFF", marca: "#D3C2F7", circulo: "#FFE58A" };
}
