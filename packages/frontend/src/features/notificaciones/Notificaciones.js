import { useRouter } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { getNotificaciones, marcarNotificacionLeida, marcarTodasLeidas } from "../../api/api.js";
import { Icono } from "../../components/Icono.js";
import { BarraVolver, estilosPantalla } from "../../components/Pantalla.js";
import { Boton, Cargando, ErrorVista, Vacio } from "../../components/ui.js";
import { useCarga } from "../../hooks/useCarga.js";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useNotificaciones } from "../../store/NotificacionesContext.js";
import { useTema } from "../../store/TemaContext.js";
import { espacio, fuentes, radio } from "../../theme.js";
import { anunciar, etiquetaMobile } from "../../utils/accesibilidad.js";
import { avisarError } from "../../utils/confirmar.js";
import { formatearHace } from "../../utils/formato.js";

const ICONOS = {
  NUEVA_VENTA: "cash-outline",
  COMPRA_CANCELADA: "close-circle-outline",
  NUEVO_MENSAJE: "chatbubble-ellipses-outline",
  ENTRADA_UTILIZADA: "checkmark-done-outline",
  EVENTO_CANCELADO: "alert-circle-outline",
  NUEVA_RESENIA: "star-outline",
};

// D-32: lista de notificaciones; tocar una la marca como leída y lleva a lo que avisa
export default function Notificaciones() {
  const router = useRouter();
  const { recargar: recargarContador } = useNotificaciones();
  const { datos, cargando, error, recargar, setDatos } = useCarga(getNotificaciones, [], {
    alEnfocar: true,
  });

  const abrir = async (notificacion) => {
    try {
      if (notificacion.estado === "NO_LEIDA") {
        await marcarNotificacionLeida(notificacion.id);
        recargarContador();
      }
      router.push(notificacion.link);
    } catch (e) {
      avisarError("No se pudo abrir la notificación", e.message);
    }
  };

  const leerTodas = async () => {
    try {
      await marcarTodasLeidas();
      setDatos({
        ...datos,
        noLeidas: 0,
        data: datos.data.map((n) => ({ ...n, estado: "LEIDA" })),
      });
      recargarContador();
      anunciar("Marcaste todas las notificaciones como leídas");
    } catch (e) {
      avisarError("No se pudieron marcar como leídas", e.message);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <BarraVolver
        subtitulo={
          datos ? (datos.noLeidas ? `${datos.noLeidas} sin leer` : "Estás al día") : "Tu actividad"
        }
        titulo="Notificaciones"
      />
      {cargando && !datos ? (
        <Cargando />
      ) : error ? (
        <ErrorVista error={error} onReintentar={recargar} />
      ) : (
        <FlatList
          data={datos.data}
          keyExtractor={(n) => String(n.id)}
          contentContainerStyle={estilosPantalla.contenido}
          ListHeaderComponent={
            datos.noLeidas > 0 ? (
              <Boton
                titulo="Marcar todas como leídas"
                icono="checkmark-done-outline"
                variante="secundario"
                onPress={leerTodas}
                style={{ marginBottom: espacio.l }}
              />
            ) : null
          }
          renderItem={({ item }) => <ItemNotificacion notificacion={item} onPress={abrir} />}
          ListEmptyComponent={
            <Vacio
              icono="notifications-off-outline"
              mensaje="Todavía no tenés notificaciones. Te avisamos acá cuando pase algo con tus compras o eventos."
            />
          }
        />
      )}
    </View>
  );
}

function ItemNotificacion({ notificacion, onPress }) {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);
  const nueva = notificacion.estado === "NO_LEIDA";
  const titulo =
    notificacion.cantidad > 1
      ? `${notificacion.titulo} (${notificacion.cantidad})`
      : notificacion.titulo;

  return (
    <Pressable
      onPress={() => onPress(notificacion)}
      accessibilityRole="button"
      {...etiquetaMobile(
        `${nueva ? "Nueva. " : ""}${titulo}. ${notificacion.mensaje}. ${formatearHace(notificacion.fecha)}`,
      )}
      style={({ pressed }) => [
        styles.item,
        nueva && styles.itemNueva,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.icono, nueva && { backgroundColor: colores.acentoSuave }]}>
        <Icono
          name={ICONOS[notificacion.tipo] ?? "notifications-outline"}
          size={20}
          color={nueva ? colores.acentoTexto : colores.textoSecundario}
        />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.filaTitulo}>
          <Text style={[styles.titulo, !nueva && { fontFamily: fuentes.semi }]}>{titulo}</Text>
          {nueva && (
            <View style={styles.nueva}>
              <Text style={styles.nuevaTexto}>Nueva</Text>
            </View>
          )}
        </View>
        <Text style={texto.secundario}>{notificacion.mensaje}</Text>
        <Text style={texto.chico}>{formatearHace(notificacion.fecha)}</Text>
      </View>
    </Pressable>
  );
}

const crearEstilos = ({ colores }) => ({
  item: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.m,
    padding: 14,
    marginBottom: 10,
  },
  itemNueva: { borderColor: colores.acento, borderLeftWidth: 4 },
  icono: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colores.apagado,
    alignItems: "center",
    justifyContent: "center",
  },
  filaTitulo: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  titulo: { fontFamily: fuentes.negrita, fontSize: 15, color: colores.texto, flexShrink: 1 },
  nueva: {
    backgroundColor: colores.acento,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  nuevaTexto: { fontFamily: fuentes.negrita, fontSize: 11, color: colores.sobreAcento },
});
