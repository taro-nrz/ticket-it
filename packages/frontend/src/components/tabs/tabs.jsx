import { View } from "react-native";
import { fuentes, relieveBase } from "../../theme.js";
import { Icono } from "../icono/Icono.jsx";

// Opciones comunes a las tabs del comprador y del organizador (dependen del tema).
// Cada pantalla dibuja su propio encabezado grande (componente Encabezado).
export function opcionesTabs(colores) {
  return {
    headerShown: false,
    tabBarActiveTintColor: colores.texto,
    tabBarInactiveTintColor: colores.textoSecundario,
    tabBarStyle: {
      backgroundColor: colores.superficie,
      borderTopColor: colores.contorno,
      borderTopWidth: relieveBase.grosor,
      height: 76,
      paddingTop: 10,
    },
    tabBarLabelStyle: { fontFamily: fuentes.semi, fontSize: 12 },
    sceneStyle: { backgroundColor: colores.fondo },
  };
}

// Ícono con "píldora" rosa con contorno detrás cuando la tab está activa
export function iconoTab(nombre, colores) {
  function IconoTab({ focused, color }) {
    return (
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 1,
          marginBottom: 2,
          borderRadius: 999,
          borderWidth: 2,
          borderColor: focused ? colores.contorno : "transparent",
          backgroundColor: focused ? colores.primario : "transparent",
        }}
      >
        <Icono
          name={focused ? nombre : `${nombre}-outline`}
          color={focused ? colores.sobrePrimario : color}
          size={22}
        />
      </View>
    );
  }
  return IconoTab;
}
