import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";
import { Icono } from "../src/components/Icono.js";
import { TituloPagina } from "../src/components/Pantalla.js";
import { Titulo } from "../src/components/ui.js";
import { useEstilos } from "../src/hooks/useEstilos.js";
import { useTema } from "../src/store/TemaContext.js";
import { espacio, fuentes } from "../src/theme.js";

// D-35: pantalla propia para direcciones que no existen (en vez de la genérica de Expo Router)
export default function NoEncontrada() {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);
  return (
    <View style={styles.contenedor} role="main">
      <Stack.Screen options={{ headerShown: false }} />
      <TituloPagina titulo="Página no encontrada" />
      <View style={styles.icono}>
        <Icono name="ticket-outline" size={40} color={colores.acentoTexto} />
      </View>
      <Titulo nivel={1} style={styles.titulo}>
        Esta página no existe
      </Titulo>
      <Text style={[texto.secundario, { textAlign: "center" }]}>
        Puede que el enlace esté mal escrito o que el contenido ya no esté disponible.
      </Text>
      <Link href="/" replace style={styles.enlace} accessibilityRole="link">
        Volver al inicio
      </Link>
    </View>
  );
}

const crearEstilos = ({ colores }) => ({
  contenedor: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: espacio.m,
    padding: espacio.xxl,
    backgroundColor: colores.fondo,
  },
  icono: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colores.acentoSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: { fontFamily: fuentes.titulo, fontSize: 28, color: colores.texto, textAlign: "center" },
  enlace: {
    fontFamily: fuentes.negrita,
    fontSize: 16,
    color: colores.texto,
    textDecorationLine: "underline",
    paddingVertical: 12,
  },
});
