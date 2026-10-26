import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEstilos } from "../hooks/useEstilos.js";
import { useTema } from "../store/TemaContext.js";
import { fuentes } from "../theme.js";
import { Icono } from "./Icono.js";
import { ImagenConCarga } from "./Carga.js";

// D-27: carrusel con las fotos del evento (multimedia). Se desliza con el dedo y también tiene botones
// "Foto anterior" / "Foto siguiente" para teclado y lector de pantalla; la posición se anuncia.
export function Galeria({ imagenes, margenInferior = 0 }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);
  const scroll = useRef(null);
  const [ancho, setAncho] = useState(0);
  const [indice, setIndice] = useState(0);

  const irA = (nuevo) => {
    setIndice(nuevo);
    scroll.current?.scrollTo({ x: nuevo * ancho, animated: true });
  };

  const alDeslizar = (evento) => {
    if (!ancho) return;
    const actual = Math.round(evento.nativeEvent.contentOffset.x / ancho);
    if (actual !== indice) setIndice(actual);
  };

  const hayAnterior = indice > 0;
  const haySiguiente = indice < imagenes.length - 1;

  return (
    <>
      <ScrollView
        ref={scroll}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
        onScroll={alDeslizar}
        scrollEventThrottle={16}
        style={StyleSheet.absoluteFill}
        // Las fotos no tienen descripción: son decorativas y el lector usa los botones
        tabIndex={-1}
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {imagenes.map((uri) => (
          <ImagenConCarga key={uri} uri={uri} style={{ width: ancho, height: "100%" }} />
        ))}
      </ScrollView>

      <View style={[styles.controles, { bottom: margenInferior + 14 }]}>
        <Pressable
          onPress={() => irA(indice - 1)}
          disabled={!hayAnterior}
          accessibilityRole="button"
          accessibilityLabel="Foto anterior"
          accessibilityState={{ disabled: !hayAnterior }}
          style={[styles.boton, !hayAnterior && styles.deshabilitado]}
        >
          <Icono name="chevron-back" size={20} color={colores.texto} />
        </Pressable>
        <View style={styles.posicion}>
          <View style={styles.puntos} aria-hidden>
            {imagenes.map((uri, i) => (
              <View key={uri} style={[styles.punto, i === indice && styles.puntoActivo]} />
            ))}
          </View>
          <Text style={styles.posicionTexto} aria-live="polite" accessibilityLiveRegion="polite">
            Foto {indice + 1} de {imagenes.length}
          </Text>
        </View>
        <Pressable
          onPress={() => irA(indice + 1)}
          disabled={!haySiguiente}
          accessibilityRole="button"
          accessibilityLabel="Foto siguiente"
          accessibilityState={{ disabled: !haySiguiente }}
          style={[styles.boton, !haySiguiente && styles.deshabilitado]}
        >
          <Icono name="chevron-forward" size={20} color={colores.texto} />
        </Pressable>
      </View>
    </>
  );
}

const crearEstilos = ({ colores }) => ({
  controles: {
    position: "absolute",
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colores.fondo,
    borderRadius: 999,
    padding: 4,
  },
  boton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  deshabilitado: { opacity: 0.35 },
  posicion: { alignItems: "center", gap: 3, minWidth: 74 },
  puntos: { flexDirection: "row", gap: 4 },
  punto: { width: 6, height: 6, borderRadius: 3, backgroundColor: colores.troquel },
  // El punto activo además es más ancho: no depende sólo del color
  puntoActivo: { width: 16, backgroundColor: colores.texto },
  posicionTexto: { fontFamily: fuentes.negrita, fontSize: 12, color: colores.texto },
});
