import { Pressable, View } from "react-native";
import { espacio, radio, relieve, relieveBase } from "../../theme.js";
import { useTema } from "../../context/TemaContext.jsx";
import { useEstilos } from "../../hooks/useEstilos.js";

// Tarjeta; si es tocable se comporta como un botón con nombre accesible propio.
// D-48: sólo la tarjeta tocable lleva sombra dura (el relieve indica qué se puede tocar).
export function Tarjeta({ children, onPress, style, accessibilityLabel, accessibilityHint }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);

  if (!onPress) return <View style={[styles.tarjeta, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.tarjeta, relieve(colores, pressed), style]}
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
    borderWidth: relieveBase.grosor,
    borderColor: colores.contorno,
  },
});
