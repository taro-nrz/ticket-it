import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useSesion } from "../../context/SesionContext.jsx";
import { useNotificaciones } from "../../context/NotificacionesContext.jsx";
import { useTema } from "../../context/TemaContext.jsx";
import { fuentes } from "../../theme.js";
import { Icono } from "../icono/Icono.jsx";

// D-32: campana con la cantidad de notificaciones sin leer
export function BotonNotificaciones({ claro = false }) {
  const { usuario } = useSesion();
  const { noLeidas } = useNotificaciones();
  const { colores } = useTema();
  const styles = useEstilos(crearEstilosCuenta);
  const router = useRouter();

  if (!usuario) return null;
  const color = claro ? colores.sobrePanel : colores.texto;
  return (
    <Pressable
      onPress={() => router.push("/notificaciones")}
      accessibilityRole="button"
      accessibilityLabel={
        noLeidas ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones, ninguna sin leer"
      }
      style={[styles.campana, claro && styles.botonClaro]}
    >
      <Icono name={noLeidas ? "notifications" : "notifications-outline"} size={22} color={color} />
      {noLeidas > 0 && (
        <View style={styles.contadorCampana}>
          <Text style={styles.contadorCampanaTexto}>{noLeidas > 9 ? "9+" : noLeidas}</Text>
        </View>
      )}
    </Pressable>
  );
}

const crearEstilosCuenta = ({ colores }) => ({
  botonClaro: { backgroundColor: "transparent", borderColor: colores.sobrePanelSuave },
  campana: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colores.bordeControl,
    backgroundColor: colores.superficie,
  },
  contadorCampana: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: colores.acento,
    alignItems: "center",
    justifyContent: "center",
  },
  contadorCampanaTexto: { fontFamily: fuentes.negrita, fontSize: 11, color: colores.sobreAcento },
});
