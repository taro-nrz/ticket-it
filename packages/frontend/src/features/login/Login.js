import { etiquetaMobile } from "../../utils/accesibilidad.js";
import { Icono } from "../../components/Icono.js";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getUsuarios } from "../../api/api.js";
import { BotonTema, TituloPagina } from "../../components/Pantalla.js";
import { Avatar, Cargando, ErrorVista, Titulo } from "../../components/ui.js";
import { useCarga } from "../../hooks/useCarga.js";
import { useSesion } from "../../store/SesionContext.js";
import { espacio, fuentes } from "../../theme.js";
import { nombreCompleto } from "../../utils/formato.js";
import { useTema } from "../../store/TemaContext.js";
import { useEstilos } from "../../hooks/useEstilos.js";

// D-03: no hay login real; se elige con qué usuario de prueba operar
export default function Login() {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);

  const { iniciarSesion } = useSesion();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { datos: usuarios, cargando, error, recargar } = useCarga(getUsuarios);

  const elegir = async (usuario) => {
    await iniciarSesion(usuario);
    router.replace("/");
  };

  const grupo = (rol, titulo) => (
    <View style={styles.grupo}>
      <Titulo nivel={2} style={texto.etiqueta}>
        {titulo}
      </Titulo>
      {usuarios
        .filter((usuario) => usuario.rol === rol)
        .map((usuario) => (
          <Pressable
            key={usuario.id}
            onPress={() => elegir(usuario)}
            accessibilityRole="button"
            {...etiquetaMobile(
              `Ingresar como ${nombreCompleto(usuario)}, ${rol === "COMPRADOR" ? "comprador" : "organizador"}`,
            )}
            style={({ pressed }) => [styles.usuario, pressed && { opacity: 0.85 }]}
          >
            <Avatar usuario={usuario} />
            <Text style={styles.nombre}>{nombreCompleto(usuario)}</Text>
            <Icono name="chevron-forward" size={18} color={colores.textoSecundario} />
          </Pressable>
        ))}
    </View>
  );

  return (
    <View style={styles.fondo}>
      <TituloPagina titulo="Ingresar" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.marca, { paddingTop: top + 48 }]}>
          <View style={styles.filaMarca}>
            <View style={styles.logo}>
              <Icono name="ticket" size={30} color={colores.sobreAcento} />
            </View>
            <BotonTema sobrePanel />
          </View>
          <Titulo nivel={1} style={styles.titulo}>
            Tu próxima noche empieza acá.
          </Titulo>
          <Text style={styles.subtitulo}>Elegí con qué cuenta querés entrar a AI Ticket It.</Text>
        </View>
        <View style={styles.panel}>
          {cargando && <Cargando />}
          {error && <ErrorVista error={error} onReintentar={recargar} />}
          {usuarios && (
            <>
              {grupo("COMPRADOR", "Compradores")}
              {grupo("ORGANIZADOR", "Organizadores")}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const crearEstilos = ({ colores, texto, estados }) => ({
  fondo: { flex: 1, backgroundColor: colores.panel },
  scroll: { flexGrow: 1, width: "100%", maxWidth: 520, alignSelf: "center" },
  marca: { paddingHorizontal: espacio.xxl, paddingBottom: 36, gap: 18 },
  filaMarca: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colores.acento,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 44,
    lineHeight: 46,
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
    minHeight: 300,
  },
  grupo: { gap: 10, marginBottom: espacio.xl },
  usuario: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  nombre: { flex: 1, fontFamily: fuentes.semi, fontSize: 16, color: colores.texto },
});
