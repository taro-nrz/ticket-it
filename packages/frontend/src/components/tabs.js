import { View } from "react-native";
import { fuentes } from "../theme.js";
import { Icono } from "./Icono.js";

// Opciones comunes a las tabs del comprador y del organizador (dependen del tema).
// Cada pantalla dibuja su propio encabezado grande (componente Encabezado).
export function opcionesTabs(colores) {
  return {
    headerShown: false,
    tabBarActiveTintColor: colores.texto,
    tabBarInactiveTintColor: colores.textoSecundario,
    tabBarStyle: {
      backgroundColor: colores.superficie,
      borderTopColor: colores.borde,
      height: 72,
      paddingTop: 8,
    },
    tabBarLabelStyle: { fontFamily: fuentes.semi, fontSize: 12 },
    sceneStyle: { backgroundColor: colores.fondo },
  };
}

// Ícono con "píldora" coral detrás cuando la tab está activa
export const iconoTab =
  (nombre, colores) =>
  ({ focused, color }) => (
    <View
      style={{
        paddingHorizontal: 18,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: focused ? colores.acentoSuave : "transparent",
      }}
    >
      <Icono name={focused ? nombre : `${nombre}-outline`} color={color} size={22} />
    </View>
  );
