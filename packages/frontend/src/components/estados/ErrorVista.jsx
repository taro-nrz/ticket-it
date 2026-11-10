import { Text, View } from "react-native";
import { espacio } from "../../theme.js";
import { Icono } from "../icono/Icono.jsx";
import { useTema } from "../../context/TemaContext.jsx";
import { useEstilos } from "../../hooks/useEstilos.js";
import { Boton } from "../boton/Boton.jsx";

// Pauta 9: un error se anuncia de inmediato (role="alert") y ofrece cómo seguir
export function ErrorVista({ error, onReintentar }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);

  return (
    <View style={styles.centro}>
      <Icono name="cloud-offline-outline" size={44} color={colores.error} />
      <Text
        role="alert"
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
        style={styles.textoCentrado}
      >
        {error?.message ?? "Ocurrió un error. Intentá de nuevo más tarde."}
      </Text>
      {onReintentar && <Boton titulo="Reintentar" variante="secundario" onPress={onReintentar} />}
    </View>
  );
}

const crearEstilos = ({ texto }) => ({
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: espacio.xxl,
    gap: espacio.m,
  },
  textoCentrado: { ...texto.secundario, textAlign: "center", maxWidth: 280 },
});
