import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useTema } from "../../context/TemaContext.jsx";
import { espacio, fuentes } from "../../theme.js";
import { Icono } from "../icono/Icono.jsx";
import { Titulo } from "../titulo/Titulo.jsx";
import { estilosPantalla, TituloPagina } from "../pantalla/Pantalla.jsx";

// Cabecera de las pantallas de detalle (con botón para volver y título <h1>)
export function BarraVolver({ titulo, subtitulo, oscuro = false, derecha }) {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilosBarra);
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const colorTexto = oscuro ? colores.sobrePanel : colores.texto;
  return (
    <View
      role="banner"
      style={[
        styles.contenedor,
        { paddingTop: top + 8 },
        oscuro ? { backgroundColor: colores.panel } : styles.clara,
      ]}
    >
      <TituloPagina titulo={titulo} />
      <View style={[estilosPantalla.ancho, styles.fila]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={styles.volver}
        >
          <Icono name="chevron-back" size={24} color={colorTexto} />
        </Pressable>
        <View style={{ flex: 1 }}>
          {subtitulo && (
            <Text style={[texto.chico, oscuro && { color: colores.sobrePanelSuave }]}>
              {subtitulo}
            </Text>
          )}
          <Titulo nivel={1} numberOfLines={1} style={[styles.titulo, { color: colorTexto }]}>
            {titulo}
          </Titulo>
        </View>
        {derecha}
      </View>
    </View>
  );
}

const crearEstilosBarra = ({ colores }) => ({
  contenedor: { paddingHorizontal: espacio.m, paddingBottom: 12 },
  clara: {
    backgroundColor: colores.superficie,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  fila: { flexDirection: "row", alignItems: "center", gap: 6 },
  volver: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  titulo: { fontFamily: fuentes.subtitulo, fontSize: 18 },
});
