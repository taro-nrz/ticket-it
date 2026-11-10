import { Text, View } from "react-native";
import { fuentes } from "../../theme.js";
import { useTema } from "../../context/TemaContext.jsx";
import { useEstilos } from "../../hooks/useEstilos.js";

// El estado de una compra siempre va con texto, no sólo con color (WCAG 1.4.1)
export function EstadoBadge({ estado, corta = false }) {
  const { estados } = useTema();
  const styles = useEstilos(crearEstilos);

  const info = estados[estado];
  const etiqueta = corta && estado === "PENDIENTE" ? "Pendiente" : info.etiqueta;
  return (
    <View
      style={[styles.badge, { backgroundColor: info.fondo }]}
      accessible
      accessibilityLabel={`Estado: ${info.etiqueta}`}
    >
      <Text style={[styles.badgeTexto, { color: info.color }]}>{etiqueta}</Text>
    </View>
  );
}

const crearEstilos = () => ({
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeTexto: { fontFamily: fuentes.negrita, fontSize: 12 },
});
