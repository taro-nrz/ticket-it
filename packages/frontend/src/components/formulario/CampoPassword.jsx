import { forwardRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { espacio, fuentes } from "../../theme.js";
import { Icono } from "../icono/Icono.jsx";
import { useTema } from "../../context/TemaContext.jsx";
import { estadoPresionado } from "../../utils/accesibilidad.js";
import { useEstilos } from "../../hooks/useEstilos.js";
import { Campo } from "./Campo.jsx";

// D-29: campo de contraseña con botón para mostrarla (ayuda a no equivocarse al escribir, WCAG 3.3.7/3.3.8).
// `visible` / `onCambiarVisible` permiten que un solo botón controle varios campos (ej. "repetir contraseña").
export const CampoPassword = forwardRef(function CampoPassword(
  { visible: visibleControlado, onCambiarVisible, conBoton = true, ...props },
  ref,
) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);
  const [visibleInterno, setVisibleInterno] = useState(false);
  const visible = visibleControlado ?? visibleInterno;
  const setVisible = onCambiarVisible ?? setVisibleInterno;

  return (
    <View>
      <Campo ref={ref} secureTextEntry={!visible} autoCapitalize="none" {...props} />
      {conBoton && (
        <Pressable
          onPress={() => setVisible(!visible)}
          accessibilityRole="button"
          accessibilityLabel="Mostrar contraseña"
          {...estadoPresionado(visible)}
          style={styles.mostrarPassword}
        >
          <Icono
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={18}
            color={colores.texto}
          />
          <Text style={styles.mostrarPasswordTexto}>Mostrar contraseña</Text>
        </Pressable>
      )}
    </View>
  );
});

const crearEstilos = ({ colores }) => ({
  mostrarPassword: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    minHeight: 44,
    marginTop: -6,
    marginBottom: espacio.s,
  },
  mostrarPasswordTexto: { fontFamily: fuentes.semi, fontSize: 14, color: colores.texto },
});
