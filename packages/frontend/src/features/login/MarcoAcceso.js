import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icono } from "../../components/Icono.js";
import { BotonTema, TituloPagina } from "../../components/Pantalla.js";
import { Titulo } from "../../components/ui.js";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useTema } from "../../store/TemaContext.js";
import { espacio, fuentes } from "../../theme.js";

// Marco común de las pantallas de acceso (ingresar / crear cuenta): marca arriba y formulario en una hoja
export function MarcoAcceso({ tituloPagina, titulo, subtitulo, children }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);
  const { top } = useSafeAreaInsets();

  return (
    <View style={styles.fondo}>
      <TituloPagina titulo={tituloPagina} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.marca, { paddingTop: top + 40 }]}>
          <View style={styles.filaMarca}>
            <View style={styles.logoFila}>
              <View style={styles.logo}>
                <Icono name="ticket" size={28} color={colores.sobreAcento} />
              </View>
              <Text style={styles.nombreApp}>AI Ticket It</Text>
            </View>
            <BotonTema sobrePanel />
          </View>
          <Titulo nivel={1} style={styles.titulo}>
            {titulo}
          </Titulo>
          <Text style={styles.subtitulo}>{subtitulo}</Text>
        </View>
        <View style={styles.panel}>{children}</View>
      </ScrollView>
    </View>
  );
}

const crearEstilos = ({ colores }) => ({
  fondo: { flex: 1, backgroundColor: colores.panel },
  scroll: { flexGrow: 1, width: "100%", maxWidth: 520, alignSelf: "center" },
  marca: { paddingHorizontal: espacio.xxl, paddingBottom: 32, gap: 16 },
  filaMarca: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logoFila: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colores.acento,
    alignItems: "center",
    justifyContent: "center",
  },
  nombreApp: { fontFamily: fuentes.titulo, fontSize: 20, color: colores.sobrePanel },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 40,
    lineHeight: 43,
    letterSpacing: -1.5,
    color: colores.sobrePanel,
  },
  subtitulo: { fontFamily: fuentes.texto, fontSize: 16, color: colores.sobrePanelSuave },
  panel: {
    flexGrow: 1,
    backgroundColor: colores.fondo,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: espacio.xl,
    paddingTop: espacio.xxl,
  },
});
