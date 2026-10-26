import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Image, Platform, StyleSheet, Text, View } from "react-native";
import { useEstilos } from "../hooks/useEstilos.js";
import { useTema } from "../store/TemaContext.js";
import { espacio, fuentes, radio } from "../theme.js";
import { Icono } from "./Icono.js";
import { Boton } from "./ui.js";

// D-39: estados de carga. Cada situación tiene el suyo:
// - primera carga de una pantalla → esqueleto con la forma del contenido (no "salta" cuando llegan los datos)
// - recarga con datos ya visibles → barra fina arriba, sin tapar lo que se está leyendo
// - imágenes → bloque que late hasta que la foto carga, y aparece con un fundido
// - si tarda demasiado → aviso con opción de reintentar
// Para el lector de pantalla todo el esqueleto es UN indicador ("Cargando eventos"); las formas se ocultan.

const usaDriverNativo = Platform.OS !== "web";

// WCAG 2.3.3: con "reducir movimiento" activado, los esqueletos no laten
export function useMovimientoReducido() {
  const [reducido, setReducido] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then(setReducido)
      .catch(() => {});
    const suscripcion = AccessibilityInfo.addEventListener?.("reduceMotionChanged", setReducido);
    return () => suscripcion?.remove?.();
  }, []);
  return reducido;
}

// Pulso compartido por todas las formas de un mismo esqueleto (laten juntas, no desfasadas)
function usePulso() {
  const reducido = useMovimientoReducido();
  const opacidad = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    if (reducido) {
      opacidad.setValue(0.7);
      return;
    }
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidad, { toValue: 1, duration: 750, useNativeDriver: usaDriverNativo }),
        Animated.timing(opacidad, {
          toValue: 0.55,
          duration: 750,
          useNativeDriver: usaDriverNativo,
        }),
      ]),
    );
    animacion.start();
    return () => animacion.stop();
  }, [opacidad, reducido]);
  return opacidad;
}

// Forma gris que ocupa el lugar de un texto, una imagen o un botón
export function Forma({ ancho = "100%", alto = 14, redondeo = 6, style }) {
  const { colores } = useTema();
  return (
    <View
      style={[
        { width: ancho, height: alto, borderRadius: redondeo, backgroundColor: colores.apagado },
        style,
      ]}
    />
  );
}

// Contenedor de un esqueleto: un solo anuncio para el lector y el pulso para todas las formas.
// `demorado` muestra el aviso de que está tardando (con reintentar).
export function Esqueleto({
  etiqueta = "Cargando",
  demorado = false,
  onReintentar,
  children,
  style,
}) {
  const opacidad = usePulso();
  return (
    <View style={[{ flex: 1 }, style]}>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={etiqueta}
        aria-busy
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={{ opacity: opacidad }}
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
      >
        {children}
      </Animated.View>
      {demorado && <AvisoDemora onReintentar={onReintentar} />}
    </View>
  );
}

function AvisoDemora({ onReintentar }) {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);
  return (
    <View style={styles.demora} role="status" aria-live="polite">
      <Icono name="cloud-offline-outline" size={22} color={colores.texto} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={texto.cuerpoFuerte}>Está tardando más de lo normal</Text>
        <Text style={texto.chico}>Puede ser la conexión. Podés esperar o volver a intentar.</Text>
      </View>
      {onReintentar && (
        <Boton
          titulo="Reintentar"
          variante="secundario"
          onPress={onReintentar}
          style={{ paddingHorizontal: 14 }}
        />
      )}
    </View>
  );
}

// Barra fina e indeterminada para recargas (filtros, volver a la pantalla, deslizar para recargar)
export function BarraCargando({ activa, etiqueta = "Actualizando" }) {
  const { colores } = useTema();
  const reducido = useMovimientoReducido();
  const avance = useRef(new Animated.Value(0)).current;
  const [ancho, setAncho] = useState(0);

  useEffect(() => {
    if (!activa || reducido) return;
    avance.setValue(0);
    const animacion = Animated.loop(
      Animated.timing(avance, { toValue: 1, duration: 1100, useNativeDriver: usaDriverNativo }),
    );
    animacion.start();
    return () => animacion.stop();
  }, [activa, reducido, avance]);

  if (!activa) return null;
  const desplazamiento = avance.interpolate({
    inputRange: [0, 1],
    outputRange: [-ancho * 0.4, ancho],
  });
  return (
    <View
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      style={{ height: 3, overflow: "hidden", backgroundColor: colores.apagado }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={etiqueta}
      aria-busy
    >
      <Animated.View
        style={{
          width: reducido ? "100%" : "40%",
          height: "100%",
          backgroundColor: colores.acento,
          transform: reducido ? [] : [{ translateX: desplazamiento }],
        }}
      />
    </View>
  );
}

// Imagen que muestra un bloque latiendo mientras descarga y aparece con un fundido.
// Si falla, queda el fondo (el color de la categoría del evento).
export function ImagenConCarga({ uri, style }) {
  const reducido = useMovimientoReducido();
  const opacidad = useRef(new Animated.Value(0)).current;
  const pulso = usePulso();
  const [estado, setEstado] = useState("cargando");

  const alCargar = () => {
    setEstado("lista");
    Animated.timing(opacidad, {
      toValue: 1,
      duration: reducido ? 0 : 350,
      useNativeDriver: usaDriverNativo,
    }).start();
  };

  return (
    <View style={style} aria-hidden pointerEvents="none">
      {estado === "cargando" && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: pulso, backgroundColor: "rgba(255,255,255,0.18)" },
          ]}
        />
      )}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacidad }]}>
        <Image
          source={{ uri }}
          alt=""
          style={StyleSheet.absoluteFill}
          onLoad={alCargar}
          onError={() => setEstado("error")}
        />
      </Animated.View>
    </View>
  );
}

// Pantalla de arranque con la marca (mientras cargan las fuentes y se recupera la sesión)
export function PantallaInicio() {
  const styles = useEstilos(crearEstilos);
  const pulso = usePulso();
  return (
    <View
      style={styles.inicio}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Abriendo AI Ticket It"
      aria-busy
    >
      <Animated.View style={[styles.logo, { opacity: pulso }]}>
        <Icono name="ticket" size={40} color="#16112A" />
      </Animated.View>
      <Text style={styles.marca}>AI Ticket It</Text>
    </View>
  );
}

// ---------- Esqueletos con la forma de cada pantalla ----------

export function EsqueletoTarjetaEvento() {
  const styles = useEstilos(crearEstilos);
  return (
    <View style={styles.tarjeta}>
      <Forma alto={150} redondeo={0} />
      <View style={{ padding: espacio.l, gap: 10 }}>
        <Forma ancho="30%" alto={10} />
        <Forma ancho="75%" alto={20} />
        <Forma ancho="50%" alto={12} />
        <View style={styles.filaEntre}>
          <Forma ancho="35%" alto={18} />
          <Forma ancho={90} alto={26} redondeo={13} />
        </View>
      </View>
    </View>
  );
}

export function EsqueletoListaEventos({ cantidad = 3, ...props }) {
  return (
    <Esqueleto etiqueta="Cargando eventos" {...props}>
      {Array.from({ length: cantidad }, (_, i) => (
        <EsqueletoTarjetaEvento key={i} />
      ))}
    </Esqueleto>
  );
}

// Entradas con la forma de ticket (Mis entradas)
export function EsqueletoListaEntradas({ cantidad = 4, ...props }) {
  const styles = useEstilos(crearEstilos);
  return (
    <Esqueleto etiqueta="Cargando tus entradas" {...props}>
      {Array.from({ length: cantidad }, (_, i) => (
        <View key={i} style={[styles.tarjeta, styles.ticket]}>
          <Forma ancho={78} alto={110} redondeo={0} />
          <View style={{ flex: 1, padding: espacio.l, gap: 10 }}>
            <Forma ancho={90} alto={20} redondeo={10} />
            <Forma ancho="80%" alto={18} />
            <Forma ancho="55%" alto={12} />
          </View>
        </View>
      ))}
    </Esqueleto>
  );
}

// Filas con avatar (compras de un evento, notificaciones, reseñas)
export function EsqueletoFilas({
  cantidad = 5,
  etiqueta = "Cargando",
  conAvatar = true,
  ...props
}) {
  const styles = useEstilos(crearEstilos);
  return (
    <Esqueleto etiqueta={etiqueta} {...props}>
      {Array.from({ length: cantidad }, (_, i) => (
        <View key={i} style={[styles.tarjeta, styles.fila]}>
          {conAvatar && <Forma ancho={40} alto={40} redondeo={20} />}
          <View style={{ flex: 1, gap: 8 }}>
            <Forma ancho="60%" alto={14} />
            <Forma ancho="85%" alto={12} />
          </View>
        </View>
      ))}
    </Esqueleto>
  );
}

// Panel de "Mis eventos": métricas + tarjetas de ventas
export function EsqueletoPanelEventos(props) {
  const styles = useEstilos(crearEstilos);
  return (
    <Esqueleto etiqueta="Cargando tus eventos" {...props}>
      {[0, 1].map((i) => (
        <View key={i} style={[styles.tarjeta, { padding: espacio.l, gap: 12 }]}>
          <Forma ancho={150} alto={20} redondeo={10} />
          <Forma ancho="70%" alto={20} />
          <Forma ancho="40%" alto={12} />
          <Forma alto={10} redondeo={5} />
          <Forma ancho="55%" alto={16} />
        </View>
      ))}
    </Esqueleto>
  );
}

// Detalle de un evento: portada, título, datos y tipos de entrada
export function EsqueletoDetalleEvento(props) {
  const styles = useEstilos(crearEstilos);
  return (
    <Esqueleto etiqueta="Cargando el evento" {...props}>
      <Forma alto={300} redondeo={0} />
      <View style={{ padding: espacio.xl, gap: 14 }}>
        <Forma ancho="25%" alto={10} />
        <Forma ancho="80%" alto={32} />
        <View style={styles.filaEntre}>
          <Forma ancho="48%" alto={80} redondeo={radio.m} />
          <Forma ancho="48%" alto={80} redondeo={radio.m} />
        </View>
        <Forma alto={12} />
        <Forma ancho="90%" alto={12} />
        <Forma ancho="40%" alto={20} style={{ marginTop: espacio.m }} />
        {[0, 1, 2].map((i) => (
          <Forma key={i} alto={64} redondeo={radio.m} />
        ))}
      </View>
    </Esqueleto>
  );
}

// Detalle de una compra: el ticket y los botones
export function EsqueletoDetalleCompra(props) {
  return (
    <Esqueleto etiqueta="Cargando la compra" {...props}>
      <View style={{ padding: espacio.xl, gap: 14 }}>
        <Forma ancho="40%" alto={24} />
        <Forma alto={260} redondeo={radio.l} />
        <Forma alto={52} redondeo={radio.m} />
        <Forma alto={52} redondeo={radio.m} />
        <Forma ancho="35%" alto={20} style={{ marginTop: espacio.m }} />
        <Forma ancho="70%" alto={14} />
        <Forma ancho="60%" alto={14} />
      </View>
    </Esqueleto>
  );
}

// Chat: burbujas alternadas
export function EsqueletoChat(props) {
  const styles = useEstilos(crearEstilos);
  const burbujas = [
    ["flex-start", "65%"],
    ["flex-end", "50%"],
    ["flex-start", "40%"],
    ["flex-end", "70%"],
  ];
  return (
    <Esqueleto etiqueta="Cargando la conversación" {...props}>
      <View style={{ padding: espacio.xl, gap: 12 }}>
        {burbujas.map(([lado, ancho], i) => (
          <Forma key={i} ancho={ancho} alto={46} redondeo={18} style={{ alignSelf: lado }} />
        ))}
      </View>
      <View style={styles.filaEntre} />
    </Esqueleto>
  );
}

// Estadísticas: indicadores y un gráfico
export function EsqueletoEstadisticas(props) {
  const styles = useEstilos(crearEstilos);
  return (
    <Esqueleto etiqueta="Cargando las estadísticas" {...props}>
      <View style={{ padding: espacio.xl, gap: 12 }}>
        <View style={styles.grilla}>
          {[0, 1, 2, 3].map((i) => (
            <Forma key={i} ancho="48%" alto={96} redondeo={radio.m} />
          ))}
        </View>
        <Forma ancho="50%" alto={20} style={{ marginTop: espacio.m }} />
        <Forma alto={200} redondeo={radio.l} />
      </View>
    </Esqueleto>
  );
}

// Formulario (editar evento, checkout, cupones)
export function EsqueletoFormulario({ campos = 5, etiqueta = "Cargando", ...props }) {
  return (
    <Esqueleto etiqueta={etiqueta} {...props}>
      <View style={{ padding: espacio.xl, gap: 10 }}>
        {Array.from({ length: campos }, (_, i) => (
          <View key={i} style={{ gap: 8, marginBottom: 6 }}>
            <Forma ancho="35%" alto={12} />
            <Forma alto={48} redondeo={14} />
          </View>
        ))}
        <Forma alto={52} redondeo={radio.m} style={{ marginTop: espacio.m }} />
      </View>
    </Esqueleto>
  );
}

// Cabecera grande de reputación (reseñas del organizador / de un evento)
export function EsqueletoReputacion(props) {
  const styles = useEstilos(crearEstilos);
  return (
    <Esqueleto etiqueta="Cargando las reseñas" {...props}>
      <View style={{ padding: espacio.xl, gap: 14 }}>
        <Forma alto={210} redondeo={24} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.fila, { paddingVertical: 6 }]}>
            <Forma ancho={32} alto={32} redondeo={16} />
            <View style={{ flex: 1, gap: 8 }}>
              <Forma ancho="45%" alto={13} />
              <Forma ancho="90%" alto={12} />
            </View>
          </View>
        ))}
      </View>
    </Esqueleto>
  );
}

const crearEstilos = ({ colores, texto }) => ({
  tarjeta: {
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.l + 2,
    overflow: "hidden",
    marginBottom: 14,
  },
  ticket: { flexDirection: "row" },
  fila: { flexDirection: "row", alignItems: "center", gap: espacio.m, padding: 14 },
  filaEntre: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  grilla: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  demora: {
    position: "absolute",
    left: espacio.l,
    right: espacio.l,
    top: espacio.l,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.bordeControl,
    borderRadius: radio.m,
    padding: 14,
  },
  inicio: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: colores.panel,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: colores.acento,
    alignItems: "center",
    justifyContent: "center",
  },
  marca: { ...texto.titulo, fontFamily: fuentes.titulo, fontSize: 24, color: colores.sobrePanel },
});
