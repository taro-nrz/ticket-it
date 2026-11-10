import { useEffect, useRef, useState } from "react";
import { Animated, Platform, View } from "react-native";
import { useTema } from "../../context/TemaContext.jsx";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido.js";

const usaDriverNativo = Platform.OS !== "web";

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
