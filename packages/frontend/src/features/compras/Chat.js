import { Icono } from "../../components/Icono.js";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { enviarMensaje, getCompra, getMensajes, marcarMensajesLeidos } from "../../api/api.js";
import { BarraVolver } from "../../components/Pantalla.js";
import { Cargando, ErrorVista, EstadoBadge, Vacio } from "../../components/ui.js";
import { useSesion } from "../../store/SesionContext.js";
import { useNotificaciones } from "../../store/NotificacionesContext.js";
import { anunciar, ocultoVisualmente } from "../../utils/accesibilidad.js";
import { espacio, fuentes } from "../../theme.js";
import { avisarError } from "../../utils/confirmar.js";
import { formatearHora, nombreCompleto } from "../../utils/formato.js";
import { useTema } from "../../store/TemaContext.js";
import { useEstilos } from "../../hooks/useEstilos.js";

const INTERVALO_POLLING_MS = 4000;

// HU-07 / HU-08: chat de la compra. Se actualiza con polling pidiendo sólo los mensajes nuevos (?desde=)
export default function Chat() {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);

  const { id } = useLocalSearchParams();
  const { usuario, esComprador } = useSesion();
  const { recargar: recargarNotificaciones } = useNotificaciones();
  const { bottom } = useSafeAreaInsets();
  const [compra, setCompra] = useState(null);
  const [mensajes, setMensajes] = useState(null);
  const [error, setError] = useState(null);
  const [texto_, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [anuncio, setAnuncio] = useState("");
  const lista = useRef(null);
  const ultimoEnviado = useRef(null);

  // Pauta 9: los mensajes que llegan de la otra persona se anuncian al lector de pantalla
  const anunciarRecibidos = (nuevos) => {
    const ajenos = nuevos.filter((m) => m.usuario.id !== usuario.id);
    if (ajenos.length === 0) return;
    // Con el chat abierto, lo que llega ya se está leyendo (D-26)
    marcarLeidos();
    const ultimo = ajenos[ajenos.length - 1];
    const texto = `Nuevo mensaje de ${ultimo.usuario.nombre}: ${ultimo.mensaje}`;
    setAnuncio(texto);
    anunciar(texto);
  };

  // D-26: abrir el chat marca la conversación como leída. Si falla, sólo queda el contador desactualizado.
  const marcarLeidos = () =>
    marcarMensajesLeidos(id)
      .then(recargarNotificaciones)
      .catch(() => {});

  const agregar = (nuevos) => {
    if (nuevos.length === 0) return;
    ultimoEnviado.current = nuevos[nuevos.length - 1].enviado;
    setMensajes((previos) => {
      const ids = new Set((previos ?? []).map((m) => m.id));
      return [...(previos ?? []), ...nuevos.filter((m) => !ids.has(m.id))];
    });
  };

  useEffect(() => {
    let activo = true;
    const cargarIniciales = async () => {
      try {
        const [datosCompra, iniciales] = await Promise.all([getCompra(id), getMensajes(id)]);
        if (!activo) return;
        setCompra(datosCompra);
        setMensajes([]);
        agregar(iniciales);
        marcarLeidos();
      } catch (e) {
        if (activo) setError(e);
      }
    };
    cargarIniciales();

    // Polling (como el popup de promociones de clase, con setInterval y cleanup)
    const intervalo = setInterval(async () => {
      try {
        const nuevos = await getMensajes(id, ultimoEnviado.current ?? undefined);
        if (activo) {
          agregar(nuevos);
          anunciarRecibidos(nuevos);
        }
      } catch (_e) {
        // si falla un polling se reintenta en el próximo
      }
    }, INTERVALO_POLLING_MS);

    return () => {
      activo = false;
      clearInterval(intervalo);
    };
    // El sondeo se reinicia sólo al cambiar de chat; las funciones que usa leen refs y setters estables
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const enviar = async () => {
    const contenido = texto_.trim();
    if (!contenido) return;
    setEnviando(true);
    try {
      agregar([await enviarMensaje(id, contenido)]);
      setTexto("");
    } catch (e) {
      avisarError("No se pudo enviar el mensaje", e.message);
    } finally {
      setEnviando(false);
    }
  };

  if (error) return <ErrorVista error={error} />;
  if (!mensajes || !compra) return <Cargando />;

  const otro = esComprador ? compra.organizador : compra.comprador;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colores.fondo }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <BarraVolver
        titulo={nombreCompleto(otro)}
        subtitulo={`${esComprador ? "Organizador" : "Comprador"} · ${compra.evento.nombre}`}
      />
      <View style={styles.ancho}>
        <View style={styles.resumen}>
          <Text
            style={texto.chico}
            accessibilityLabel={`Compra número ${compra.id}: ${compra.cantidad} ${compra.tipoEntrada.nombre}`}
          >
            Compra #{compra.id} · {compra.cantidad} × {compra.tipoEntrada.nombre}
          </Text>
          <EstadoBadge estado={compra.estado} corta />
        </View>
      </View>
      <Text style={ocultoVisualmente} aria-live="polite" accessibilityLiveRegion="polite">
        {anuncio}
      </Text>
      <FlatList
        ref={lista}
        data={mensajes}
        accessibilityLabel="Conversación"
        keyExtractor={(mensaje) => String(mensaje.id)}
        contentContainerStyle={styles.lista}
        onContentSizeChange={() => lista.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <Vacio
            icono="chatbubbles-outline"
            mensaje="Todavía no hay mensajes. ¡Escribí el primero!"
          />
        }
        renderItem={({ item }) => {
          const esMio = item.usuario.id === usuario.id;
          return (
            <View
              style={[styles.burbuja, esMio ? styles.mia : styles.ajena]}
              accessible
              accessibilityLabel={`${esMio ? "Vos" : item.usuario.nombre}, ${formatearHora(item.enviado)}: ${item.mensaje}`}
            >
              <Text style={[styles.mensaje, esMio && { color: colores.sobrePrimario }]}>
                {item.mensaje}
              </Text>
              <Text style={[styles.hora, esMio && { color: colores.sobrePrimarioSuave }]}>
                {formatearHora(item.enviado)}
              </Text>
            </View>
          );
        }}
      />
      <View style={[styles.barra, { paddingBottom: bottom + 14 }]}>
        <View style={[styles.ancho, styles.barraContenido]}>
          <TextInput
            value={texto_}
            onChangeText={setTexto}
            onSubmitEditing={enviar}
            placeholder="Escribí un mensaje…"
            placeholderTextColor={colores.textoSecundario}
            accessibilityLabel={`Mensaje para ${otro.nombre}`}
            autoComplete="off"
            enterKeyHint="send"
            style={styles.input}
            maxLength={1000}
          />
          <Pressable
            onPress={enviar}
            disabled={enviando || !texto_.trim()}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
            accessibilityState={{ disabled: enviando || !texto_.trim() }}
            style={[styles.enviar, (enviando || !texto_.trim()) && { opacity: 0.4 }]}
          >
            <Icono name="send" size={19} color={colores.sobreAcento} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const crearEstilos = ({ colores }) => ({
  ancho: { width: "100%", maxWidth: 720, alignSelf: "center" },
  resumen: {
    marginHorizontal: espacio.xl,
    marginTop: 14,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lista: {
    padding: espacio.xl,
    gap: 10,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    flexGrow: 1,
  },
  burbuja: { maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 10 },
  mia: {
    alignSelf: "flex-end",
    backgroundColor: colores.primario,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  ajena: {
    alignSelf: "flex-start",
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  mensaje: { fontFamily: fuentes.texto, fontSize: 15, color: colores.texto },
  hora: {
    fontFamily: fuentes.texto,
    fontSize: 11,
    color: colores.textoSecundario,
    alignSelf: "flex-end",
    marginTop: 2,
  },
  barra: {
    backgroundColor: colores.superficie,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    paddingTop: 12,
    paddingHorizontal: 14,
  },
  barraContenido: { flexDirection: "row", gap: 10, alignItems: "center" },
  input: {
    flex: 1,
    height: 46,
    backgroundColor: colores.fondo,
    borderRadius: 23,
    paddingHorizontal: espacio.l,
    fontSize: 15,
    fontFamily: fuentes.texto,
    color: colores.texto,
  },
  enviar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colores.acento,
    alignItems: "center",
    justifyContent: "center",
  },
});
