// Sistema visual (diseñado en Claude Design, D-20) con modo claro y oscuro (D-22).
// Los colores tienen nombres por ROL (fondo, texto, primario, panel...) y cada tema define su valor.
// Todos los pares texto/fondo cumplen WCAG AA (≥ 4.5:1) en ambos temas.

const claro = {
  fondo: "#F5F3EE",
  superficie: "#FFFFFF",
  apagado: "#ECEAE6",
  borde: "#E6E2DA",
  bordeControl: "#857F8F", // 3,87:1 sobre blanco (WCAG 1.4.11)
  troquel: "#D5D0C6",
  texto: "#16112A",
  textoSecundario: "#5D5866",
  // botones principales, chip activo, mensajes propios
  primario: "#16112A",
  sobrePrimario: "#F5F3EE",
  sobrePrimarioSuave: "#C9C3D9",
  // cabeceras y paneles oscuros (login, panel del organizador, entrada)
  panel: "#16112A",
  panelSuave: "#251C42",
  sobrePanel: "#F5F3EE",
  sobrePanelSuave: "#C9C3D9",
  ticket: "#F5F3EE",
  acento: "#FF5A36",
  sobreAcento: "#16112A",
  acentoSuave: "#FFE3DB",
  acentoTexto: "#9C2A12",
  acentoOscuro: "#B8361A",
  error: "#A82E14",
  errorFondo: "#FBE9E5",
  exito: "#1D6B3A",
  exitoBoton: "#1D6B3A",
  estrella: "#E8A317",
};

const oscuro = {
  fondo: "#121018",
  superficie: "#1C1826",
  apagado: "#2A2536",
  borde: "#343046",
  bordeControl: "#7D7690", // 4,03:1 sobre la superficie
  troquel: "#4A4459",
  texto: "#F2EFF7",
  textoSecundario: "#B5AFC2",
  primario: "#F2EFF7",
  sobrePrimario: "#16112A",
  sobrePrimarioSuave: "#5D5866",
  panel: "#241D3B",
  panelSuave: "#2F2750",
  sobrePanel: "#F5F3EE",
  sobrePanelSuave: "#C9C3D9",
  ticket: "#1C1826",
  acento: "#FF5A36",
  sobreAcento: "#16112A",
  acentoSuave: "#4A2418",
  acentoTexto: "#FFB49F",
  acentoOscuro: "#FF8A6B",
  error: "#FF8A73",
  errorFondo: "#3A1A14",
  exito: "#6FD39A",
  exitoBoton: "#1D6B3A",
  estrella: "#E8A317",
};

export const paletas = { claro, oscuro };

// Estados de compra: se distinguen por tono Y claridad, siempre con texto (HU-05, WCAG 1.4.1)
const ETIQUETAS_ESTADO = {
  PENDIENTE: { etiqueta: "Pendiente de pago", corta: "Pendientes" },
  CONFIRMADA: { etiqueta: "Confirmada", corta: "Confirmadas" },
  UTILIZADA: { etiqueta: "Utilizada", corta: "Utilizadas" },
  CANCELADA: { etiqueta: "Cancelada", corta: "Canceladas" },
  REEMBOLSADA: { etiqueta: "Reembolsada", corta: "Reembolsadas" },
};

const COLORES_ESTADO = {
  claro: {
    PENDIENTE: { color: "#8A5A00", fondo: "#FFF1D6" },
    CONFIRMADA: { color: "#1F4FB8", fondo: "#E1ECFF" },
    UTILIZADA: { color: "#1D6B3A", fondo: "#DDF3E4" },
    CANCELADA: { color: "#5D5866", fondo: "#ECEAE6" },
    REEMBOLSADA: { color: "#6E2DA0", fondo: "#F0E4FA" },
  },
  oscuro: {
    PENDIENTE: { color: "#F5C76A", fondo: "#3A2C0E" },
    CONFIRMADA: { color: "#9DBBFF", fondo: "#172A4F" },
    UTILIZADA: { color: "#7FD6A2", fondo: "#143323" },
    CANCELADA: { color: "#B5AFC2", fondo: "#2A2536" },
    REEMBOLSADA: { color: "#D3A6F5", fondo: "#2E1A40" },
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

// Bricolage Grotesque para títulos (estilo cartel) y DM Sans para el texto
export const fuentes = {
  titulo: "BricolageGrotesque_800ExtraBold",
  subtitulo: "BricolageGrotesque_700Bold",
  texto: "DMSans_400Regular",
  medio: "DMSans_500Medium",
  semi: "DMSans_600SemiBold",
  negrita: "DMSans_700Bold",
};

export const espacio = { xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 28 };

export const radio = { s: 12, m: 16, l: 20, xl: 26 };

// Estilos de texto reutilizables (dependen del tema por el color)
export function estilosDeTexto(colores) {
  return {
    tituloGrande: {
      fontFamily: fuentes.titulo,
      fontSize: 30,
      letterSpacing: -0.8,
      color: colores.texto,
    },
    titulo: {
      fontFamily: fuentes.subtitulo,
      fontSize: 19,
      letterSpacing: -0.3,
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

// Color de bloque por categoría (detrás de la foto del evento; igual en ambos temas)
export const coloresCategoria = {
  Recitales: { fondo: "#2B1E52", marca: "#3A2B6B" },
  Teatro: { fondo: "#0F4C47", marca: "#186058" },
  Festivales: { fondo: "#7A2E12", marca: "#8F3A1C" },
  Conferencias: { fondo: "#1F3A6B", marca: "#2A4A80" },
  Deportes: { fondo: "#2D5016", marca: "#3A6420" },
};

export function colorDeCategoria(nombre) {
  return coloresCategoria[nombre] ?? { fondo: "#16112A", marca: "#251C42" };
}
