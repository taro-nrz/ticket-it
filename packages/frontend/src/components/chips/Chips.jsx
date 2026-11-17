import { Pressable, ScrollView, Text } from "react-native";
import { espacio, fuentes, relieve } from "../../theme.js";
import { Icono } from "../icono/Icono.jsx";
import { useTema } from "../../context/TemaContext.jsx";
import { estadoPresionado } from "../../utils/accesibilidad.js";
import { useEstilos } from "../../hooks/useEstilos.js";

// Chips de filtro: botones con estado "presionado" (aria-pressed), alto ≥ 44 px.
// El estado no depende sólo del color: el chip activo cambia fondo, texto y peso de la fuente.
export function Chips({ opciones, seleccionada, onSeleccionar, etiqueta }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
      accessibilityLabel={etiqueta}
      role={etiqueta ? "group" : undefined}
      aria-label={etiqueta}
    >
      {opciones.map((opcion) => {
        const activa = opcion.valor === seleccionada;
        return (
          <Pressable
            key={String(opcion.valor)}
            onPress={() => onSeleccionar(opcion.valor)}
            accessibilityRole="button"
            accessibilityLabel={opcion.etiquetaAccesible ?? opcion.etiqueta}
            {...estadoPresionado(activa)}
            style={({ pressed }) => [
              styles.chip,
              relieve(colores, pressed),
              opcion.fondo && { backgroundColor: opcion.fondo, borderColor: opcion.color },
              activa && styles.chipActiva,
            ]}
          >
            {activa && <Icono name="checkmark" size={15} color={colores.sobrePrimario} />}
            <Text
              style={[
                styles.chipTexto,
                opcion.color && { color: opcion.color, fontFamily: fuentes.semi },
                activa && styles.chipTextoActiva,
              ]}
            >
              {opcion.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const crearEstilos = ({ colores }) => ({
  // margen para que no se corte la sombra dura del último chip ni la de abajo
  chips: { gap: espacio.s, paddingTop: 2, paddingBottom: 5, paddingRight: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colores.superficie,
  },
  chipActiva: { backgroundColor: colores.primario },
  chipTexto: { fontFamily: fuentes.medio, fontSize: 14, color: colores.texto },
  chipTextoActiva: { color: colores.sobrePrimario, fontFamily: fuentes.negrita },
});
