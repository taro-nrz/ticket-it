import { Text, View } from "react-native";
import { espacio, fuentes, radio } from "../../theme.js";
import { Icono } from "../icono/Icono.jsx";
import { useTema } from "../../context/TemaContext.jsx";
import { useEstilos } from "../../hooks/useEstilos.js";

// Pauta 9: resumen de errores de un formulario, anunciado de inmediato (role="alert")
export function ResumenErrores({ mensaje }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);

  if (!mensaje) return null;
  return (
    <View
      style={styles.resumenErrores}
      role="alert"
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Icono name="alert-circle" size={20} color={colores.error} />
      <Text style={styles.resumenErroresTexto}>{mensaje}</Text>
    </View>
  );
}

const crearEstilos = ({ colores }) => ({
  resumenErrores: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colores.errorFondo,
    borderWidth: 1,
    borderColor: colores.error,
    borderRadius: radio.m,
    padding: 14,
    marginBottom: espacio.l,
  },
  resumenErroresTexto: { flex: 1, fontFamily: fuentes.semi, fontSize: 14, color: colores.error },
});
