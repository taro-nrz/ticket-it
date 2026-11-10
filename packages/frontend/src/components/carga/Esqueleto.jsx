import { Animated, StyleSheet, Text, View } from "react-native";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useTema } from "../../context/TemaContext.jsx";
import { espacio, radio } from "../../theme.js";
import { Icono } from "../icono/Icono.jsx";
import { Boton } from "../boton/Boton.jsx";
import { usePulso } from "../../hooks/usePulso.js";

// D-39: estados de carga. Cada situación tiene el suyo:
// - primera carga de una pantalla → esqueleto con la forma del contenido (no "salta" cuando llegan los datos)
// - recarga con datos ya visibles → barra fina arriba, sin tapar lo que se está leyendo
// - imágenes → bloque que late hasta que la foto carga, y aparece con un fundido
// - si tarda demasiado → aviso con opción de reintentar
// Para el lector de pantalla todo el esqueleto es UN indicador ("Cargando eventos"); las formas se ocultan.

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

const crearEstilos = ({ colores }) => ({
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
});
