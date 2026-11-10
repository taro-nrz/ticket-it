import { Animated, Text, View } from "react-native";
import { useEstilos } from "../../hooks/useEstilos.js";
import { fuentes } from "../../theme.js";
import { Icono } from "../icono/Icono.jsx";
import { usePulso } from "../../hooks/usePulso.js";

// Pantalla de arranque con la marca (mientras cargan las fuentes y se recupera la sesión)
export function PantallaInicio() {
  const styles = useEstilos(crearEstilos);
  const pulso = usePulso();
  return (
    <View
      style={styles.inicio}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Abriendo AI Ticket It"
      aria-busy
    >
      <Animated.View style={[styles.logo, { opacity: pulso }]}>
        <Icono name="ticket" size={40} color="#16112A" />
      </Animated.View>
      <Text style={styles.marca}>AI Ticket It</Text>
    </View>
  );
}

const crearEstilos = ({ colores, texto }) => ({
  inicio: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: colores.panel,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: colores.acento,
    alignItems: "center",
    justifyContent: "center",
  },
  marca: { ...texto.titulo, fontFamily: fuentes.titulo, fontSize: 24, color: colores.sobrePanel },
});
