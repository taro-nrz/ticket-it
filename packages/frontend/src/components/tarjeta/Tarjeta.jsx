import { Pressable, View } from "react-native";
import { espacio, radio } from "../../theme.js";
import { useEstilos } from "../../hooks/useEstilos.js";

// Tarjeta; si es tocable se comporta como un botón con nombre accesible propio
export function Tarjeta({ children, onPress, style, accessibilityLabel, accessibilityHint }) {
  const styles = useEstilos(crearEstilos);

  if (!onPress) return <View style={[styles.tarjeta, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.tarjeta, style, pressed && { opacity: 0.88 }]}
    >
      {children}
    </Pressable>
  );
}

const crearEstilos = ({ colores }) => ({
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radio.l,
    padding: espacio.l,
    marginBottom: espacio.m,
    borderWidth: 1,
    borderColor: colores.borde,
  },
});
