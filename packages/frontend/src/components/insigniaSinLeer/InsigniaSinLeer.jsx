import { Text, View } from "react-native";
import { fuentes } from "../../theme.js";
import { textoSinLeer } from "../../utils/formato.js";
import { Icono } from "../icono/Icono.jsx";
import { useTema } from "../../context/TemaContext.jsx";
import { useEstilos } from "../../hooks/useEstilos.js";

// D-26: insignia de mensajes sin leer. Dice el número y "nuevo(s)": no depende sólo del color
export function InsigniaSinLeer({ cantidad }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);

  if (!cantidad) return null;
  return (
    <View style={styles.insignia} accessible accessibilityLabel={textoSinLeer(cantidad)}>
      <Icono name="chatbubble-ellipses" size={12} color={colores.sobreAcento} />
      <Text style={styles.insigniaTexto}>
        {cantidad} {cantidad === 1 ? "nuevo" : "nuevos"}
      </Text>
    </View>
  );
}

const crearEstilos = ({ colores }) => ({
  insignia: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: colores.acento,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  insigniaTexto: { fontFamily: fuentes.negrita, fontSize: 12, color: colores.sobreAcento },
});
