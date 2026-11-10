import { Pressable, Text, View } from "react-native";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useTema } from "../../context/TemaContext.jsx";
import { espacio, fuentes } from "../../theme.js";
import { anunciar } from "../../utils/accesibilidad.js";
import { Icono } from "../icono/Icono.jsx";

const OPCIONES_TEMA = [
  { valor: "sistema", texto: "Sistema", icono: "contrast-outline" },
  { valor: "claro", texto: "Claro", icono: "sunny-outline" },
  { valor: "oscuro", texto: "Oscuro", icono: "moon-outline" },
];

// Selector de tema con texto visible y semántica de radio (una sola opción elegida)
export function SelectorTema() {
  const { colores, texto, preferencia, setPreferencia } = useTema();
  const styles = useEstilos(crearEstilosSelector);
  return (
    <View style={{ gap: espacio.s }}>
      <Text style={texto.etiqueta} nativeID="etiqueta-tema">
        Tema
      </Text>
      <View
        style={styles.opciones}
        role="radiogroup"
        aria-labelledby="etiqueta-tema"
        accessibilityRole="radiogroup"
        accessibilityLabel="Tema"
      >
        {OPCIONES_TEMA.map((opcion) => {
          const activa = preferencia === opcion.valor;
          return (
            <Pressable
              key={opcion.valor}
              onPress={() => {
                setPreferencia(opcion.valor);
                anunciar(`Tema ${opcion.texto}`);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: activa }}
              aria-checked={activa}
              style={[styles.opcion, activa && styles.opcionActiva]}
            >
              <Icono
                name={opcion.icono}
                size={18}
                color={activa ? colores.sobrePrimario : colores.texto}
              />
              <Text style={[styles.opcionTexto, activa && styles.opcionTextoActiva]}>
                {opcion.texto}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={texto.chico}>"Sistema" usa la configuración de tu dispositivo.</Text>
    </View>
  );
}

const crearEstilosSelector = ({ colores }) => ({
  opciones: { flexDirection: "row", gap: espacio.s },
  opcion: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colores.bordeControl,
  },
  opcionActiva: { backgroundColor: colores.primario, borderColor: colores.primario },
  opcionTexto: { fontFamily: fuentes.semi, fontSize: 15, color: colores.texto },
  opcionTextoActiva: { color: colores.sobrePrimario, fontFamily: fuentes.negrita },
});
