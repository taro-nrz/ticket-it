import { AccessibilityInfo, Platform } from "react-native";

const esWeb = Platform.OS === "web";

// Ajustes globales que en web no se pueden expresar con props de React Native
export function configurarAccesibilidadWeb() {
  if (!esWeb || typeof document === "undefined") return;

  // WCAG 3.1.1: idioma de la página (el contenido está en español)
  document.documentElement.lang = "es";

  if (document.getElementById("estilos-accesibilidad")) return;
  const estilos = document.createElement("style");
  estilos.id = "estilos-accesibilidad";
  estilos.textContent = `
    /* Pauta 4 · WCAG 2.4.7: foco visible sólo con teclado. Anillo azul con halo crema:
       contrasta tanto sobre el fondo claro como sobre las cabeceras oscuras. */
    :focus-visible {
      outline: 3px solid #1F4FB8 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 6px #F5F3EE !important;
      border-radius: 10px;
    }
    :focus:not(:focus-visible) { outline: none; }
    /* WCAG 2.3.3: respetar la preferencia de movimiento reducido */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
    }
  `;
  document.head.appendChild(estilos);
}

// Estado "presionado" de un botón que se puede activar/desactivar (chips, favoritos, selección).
// En web se expresa con aria-pressed (aria-selected no es válido en un botón); en mobile con accessibilityState.
export function estadoPresionado(activo) {
  return esWeb ? { "aria-pressed": activo } : { accessibilityState: { selected: activo } };
}

// Pauta 9: anunciar un cambio al lector de pantalla (en mobile; en web se usan regiones aria-live)
export function anunciar(mensaje) {
  if (!esWeb) AccessibilityInfo.announceForAccessibility(mensaje);
}

// Texto visualmente oculto pero leído por el lector de pantalla (región de anuncios)
export const ocultoVisualmente = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  opacity: 0,
};

// Nombre accesible resumido sólo en mobile (VoiceOver/TalkBack leen la tarjeta como una unidad).
// En web el nombre sale del texto visible: WCAG 2.5.3 pide que el nombre contenga lo que se ve,
// para que quien usa control por voz pueda decir lo que lee en pantalla.
export function etiquetaMobile(etiqueta) {
  return esWeb ? {} : { accessibilityLabel: etiqueta };
}
