import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useTema } from "../../context/TemaContext.jsx";
import { espacio } from "../../theme.js";
import { Titulo } from "../titulo/Titulo.jsx";
import { estilosPantalla, TituloPagina } from "../pantalla/Pantalla.jsx";
import { BotonNotificaciones } from "../botonNotificaciones/BotonNotificaciones.jsx";
import { BotonCuenta } from "../botonCuenta/BotonCuenta.jsx";

// Encabezado grande de las pantallas principales (tabs): saludo, título <h1>, tema y cuenta
export function Encabezado({ saludo, titulo, oscuro = false, derecha, children }) {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilosEncabezado);
  const { top } = useSafeAreaInsets();
  return (
    <View
      role="banner"
      style={[
        styles.contenedor,
        { paddingTop: top + 18 },
        oscuro && { backgroundColor: colores.panel },
      ]}
    >
      <TituloPagina titulo={titulo} />
      <View style={[estilosPantalla.ancho, { gap: espacio.l }]}>
        {/* Arriba el saludo con las acciones de la cuenta; abajo el título con la acción de la pantalla */}
        <View style={styles.fila}>
          <Text
            style={[texto.secundario, { flex: 1 }, oscuro && { color: colores.sobrePanelSuave }]}
            numberOfLines={1}
          >
            {saludo}
          </Text>
          <BotonNotificaciones claro={oscuro} />
          <BotonCuenta claro={oscuro} />
        </View>
        <View style={[styles.fila, { marginTop: -espacio.s }]}>
          <Titulo
            nivel={1}
            style={[texto.tituloGrande, { flex: 1 }, oscuro && { color: colores.sobrePanel }]}
          >
            {titulo}
          </Titulo>
          {derecha}
        </View>
        {children}
      </View>
    </View>
  );
}

const crearEstilosEncabezado = ({ colores }) => ({
  contenedor: { backgroundColor: colores.fondo, paddingHorizontal: espacio.xl, paddingBottom: 14 },
  fila: { flexDirection: "row", alignItems: "center", gap: espacio.s },
});
