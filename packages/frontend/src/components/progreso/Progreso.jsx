import { View } from "react-native";
import { useTema } from "../../context/TemaContext.jsx";
import { useEstilos } from "../../hooks/useEstilos.js";

// Barra de progreso con rol y valores para el lector de pantalla
export function Progreso({ valor, total, color, etiqueta = "Entradas vendidas" }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);

  const porcentaje = total ? Math.max(0, Math.min(100, (valor / total) * 100)) : 0;
  return (
    <View
      style={styles.barra}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={etiqueta}
      accessibilityValue={{ min: 0, max: total, now: valor, text: `${valor} de ${total}` }}
    >
      <View
        style={[
          styles.barraLlena,
          { width: `${porcentaje}%`, backgroundColor: color ?? colores.primario },
        ]}
      />
    </View>
  );
}

const crearEstilos = ({ colores }) => ({
  barra: { height: 8, borderRadius: 4, backgroundColor: colores.apagado, overflow: "hidden" },
  barraLlena: { height: 8, borderRadius: 4 },
});
