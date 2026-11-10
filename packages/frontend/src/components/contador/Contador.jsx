import { Pressable, Text, View } from "react-native";
import { fuentes } from "../../theme.js";
import { Icono } from "../icono/Icono.jsx";
import { useTema } from "../../context/TemaContext.jsx";
import { useEstilos } from "../../hooks/useEstilos.js";

// Selector de cantidad: botones de 44 px con nombre, y el valor se anuncia al cambiar (pauta 9)
export function Contador({ valor, minimo = 1, maximo, onCambiar, etiqueta = "Cantidad" }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);

  const puedeRestar = valor > minimo;
  const puedeSumar = valor < maximo;
  return (
    <View style={styles.contador}>
      <Pressable
        onPress={() => onCambiar(valor - 1)}
        disabled={!puedeRestar}
        accessibilityRole="button"
        accessibilityLabel={`Quitar una (${etiqueta.toLowerCase()} actual: ${valor})`}
        accessibilityState={{ disabled: !puedeRestar }}
        style={[styles.contadorBoton, !puedeRestar && { opacity: 0.35 }]}
      >
        <Icono name="remove" size={20} color={colores.texto} />
      </Pressable>
      <Text
        style={styles.contadorValor}
        aria-live="polite"
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${etiqueta}: ${valor}`}
      >
        {valor}
      </Text>
      <Pressable
        onPress={() => onCambiar(valor + 1)}
        disabled={!puedeSumar}
        accessibilityRole="button"
        accessibilityLabel={`Agregar una (${etiqueta.toLowerCase()} actual: ${valor})`}
        accessibilityState={{ disabled: !puedeSumar }}
        style={[styles.contadorBoton, styles.contadorBotonLleno, !puedeSumar && { opacity: 0.35 }]}
      >
        <Icono name="add" size={20} color={colores.sobrePrimario} />
      </Pressable>
    </View>
  );
}

const crearEstilos = ({ colores }) => ({
  contador: { flexDirection: "row", alignItems: "center", gap: 12 },
  contadorBoton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colores.bordeControl,
    alignItems: "center",
    justifyContent: "center",
  },
  contadorBotonLleno: { backgroundColor: colores.primario, borderColor: colores.primario },
  contadorValor: {
    fontFamily: fuentes.negrita,
    fontSize: 18,
    minWidth: 22,
    textAlign: "center",
    color: colores.texto,
  },
});
