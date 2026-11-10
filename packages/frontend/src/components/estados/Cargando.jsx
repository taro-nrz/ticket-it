import { ActivityIndicator, View } from "react-native";
import { espacio } from "../../theme.js";
import { useTema } from "../../context/TemaContext.jsx";
import { useEstilos } from "../../hooks/useEstilos.js";

// Pauta 9: la carga se anuncia
export function Cargando({ color, mensaje = "Cargando" }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);

  return (
    <View
      style={styles.centro}
      accessible
      accessibilityLabel={mensaje}
      accessibilityRole="progressbar"
      aria-busy
    >
      <ActivityIndicator size="large" color={color ?? colores.primario} />
    </View>
  );
}

const crearEstilos = () => ({
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: espacio.xxl,
    gap: espacio.m,
  },
});
