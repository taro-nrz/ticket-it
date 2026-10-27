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
import { ErrorVista, EstadoBadge, Vacio } from "../../components/ui.js";
import { useSesion } from "../../store/SesionContext.js";
import { useNotificaciones } from "../../store/NotificacionesContext.js";
import { anunciar, ocultoVisualmente } from "../../utils/accesibilidad.js";
import { espacio, fuentes } from "../../theme.js";
import { avisarError } from "../../utils/confirmar.js";
import { formatearHora, nombreCompleto } from "../../utils/formato.js";
import { useTema } from "../../store/TemaContext.js";
import { useEstilos } from "../../hooks/useEstilos.js";
import { EsqueletoChat } from "../../components/Carga.js";
import { emitir, escuchar, estaConectado, useConexionEnVivo } from "../../api/tiempoReal.js";

const INTERVALO_POLLING_MS = 4000;
const MS_ESCRIBIENDO = 3000; // cuánto dura el "escribiendo…" sin novedades
const MS_ENTRE_AVISOS = 2000; // cada cuánto se avisa que se está escribiendo

// HU-07 / HU-08: chat de la compra.
// D-45: los mensajes llegan en vivo por WebSocket; si no hay conexión, se piden por polling (?desde=).
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
  const enVivo = useConexionEnVivo();
  const [escribiendo, setEscribiendo] = useState(null);
  const finEscribiendo = useRef(null);
  const ultimoAvisoEscribiendo = useRef(0);
  // Si ya se cargó la conversación (para saber si una conexión nueva es una REconexión)
  const cargado = useRef(false);

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
        cargado.current = true;
        marcarLeidos();
      } catch (e) {
        if (activo) setError(e);
      }
    };
    cargarIniciales();

    // Polling de respaldo (como el popup de promociones de clase): sólo si no hay conexión en vivo
    const intervalo = setInterval(async () => {
      if (estaConectado()) return;
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

    // D-45: mensajes y "escribiendo…" en vivo
    const dejarMensajes = escuchar("chat:mensaje", ({ compraId, mensaje }) => {
      if (!activo || String(compraId) !== String(id)) return;
      agregar([mensaje]);
      if (mensaje.usuario.id !== usuario.id) setEscribiendo(null);
      anunciarRecibidos([mensaje]);
    });
    const dejarEscribiendo = escuchar("chat:escribiendo", ({ compraId, usuario: quien }) => {
      if (!activo || String(compraId) !== String(id)) return;
      setEscribiendo(quien.nombre);
      clearTimeout(finEscribiendo.current);
      finEscribiendo.current = setTimeout(() => setEscribiendo(null), MS_ESCRIBIENDO);
    });

    return () => {
      activo = false;
      cargado.current = false;
      clearInterval(intervalo);
      clearTimeout(finEscribiendo.current);
      dejarMensajes();
      dejarEscribiendo();
      emitir("chat:salir", { compraId: id });
    };
    // El sondeo se reinicia sólo al cambiar de chat; las funciones que usa leen refs y setters estables
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Unirse a la sala del chat cada vez que hay conexión (al entrar y después de una reconexión), y traer
  // lo que haya llegado mientras no había conexión
  useEffect(() => {
    if (!enVivo) return;
    emitir("chat:unirse", { compraId: id });
    // En la primera conexión la carga inicial ya trae todo; en una reconexión se trae lo que faltó
    if (!cargado.current) return;
    getMensajes(id, ultimoEnviado.current ?? undefined)
      .then((nuevos) => {
        agregar(nuevos);
        anunciarRecibidos(nuevos);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enVivo, id]);

  const cambiarTexto = (valor) => {
    setTexto(valor);
    const ahora = Date.now();
    if (valor && ahora - ultimoAvisoEscribiendo.current > MS_ENTRE_AVISOS) {
      ultimoAvisoEscribiendo.current = ahora;
      emitir("chat:escribiendo", { compraId: id });
    }
  };

  const enviar = async () => {
    const contenido = texto_.trim();
    if (!contenido) return;
    setEnviando(true);
    try {
      agregar([await enviarMensaje(id, contenido)]);
      setTexto("");
      ultimoAvisoEscribiendo.current = 0;
    } catch (e) {
      avisarError("No se pudo enviar el mensaje", e.message);
    } finally {
      setEnviando(false);
    }
  };

  if (error) return <ErrorVista error={error} />;
  if (!mensajes || !compra) {
    return (
      <View style={{ flex: 1 }}>
        <BarraVolver subtitulo="Chat de la compra" titulo="Cargando…" />
        <EsqueletoChat />
      </View>
    );
  }

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
      {/* D-45: estado de la conexión (texto + punto: no depende sólo del color) */}
      <View style={[styles.ancho, styles.estado]}>
        <View
          style={[
            styles.punto,
            { backgroundColor: enVivo ? colores.exito : colores.textoSecundario },
          ]}
        />
        <Text style={texto.chico}>
          {enVivo
            ? "En vivo"
            : `Sin conexión en vivo: se actualiza cada ${INTERVALO_POLLING_MS / 1000} s`}
        </Text>
      </View>
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
      {/* Se anuncia una vez por cada vez que empieza a escribir (no en cada tecla) */}
      <View style={styles.ancho} aria-live="polite" accessibilityLiveRegion="polite">
        {escribiendo && <Text style={styles.escribiendo}>{escribiendo} está escribiendo…</Text>}
      </View>
      <View style={[styles.barra, { paddingBottom: bottom + 14 }]}>
        <View style={[styles.ancho, styles.barraContenido]}>
          <TextInput
            value={texto_}
            onChangeText={cambiarTexto}
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
  estado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: espacio.xl,
    marginTop: 8,
  },
  punto: { width: 8, height: 8, borderRadius: 4 },
  escribiendo: {
    fontFamily: fuentes.texto,
    fontStyle: "italic",
    fontSize: 13,
    color: colores.textoSecundario,
    paddingHorizontal: espacio.xl,
    paddingBottom: 6,
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
