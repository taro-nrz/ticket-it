import { Ionicons } from "@expo/vector-icons";

// Pauta 8: los íconos son decorativos. El nombre accesible lo da el botón o el texto que acompaña,
// así que el ícono se oculta del lector de pantalla (si no, se lee como un carácter vacío).
export function Icono(props) {
  return (
    <Ionicons
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      {...props}
    />
  );
}
