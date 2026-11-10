import { useRef, useState } from "react";
import { Animated, Image, Platform, StyleSheet, View } from "react-native";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido.js";
import { usePulso } from "../../hooks/usePulso.js";

const usaDriverNativo = Platform.OS !== "web";

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
