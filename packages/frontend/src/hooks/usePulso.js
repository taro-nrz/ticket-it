import { useEffect, useRef } from "react";
import { Animated, Platform } from "react-native";
import { useMovimientoReducido } from "./useMovimientoReducido.js";

const usaDriverNativo = Platform.OS !== "web";

// Pulso compartido por todas las formas de un mismo esqueleto (laten juntas, no desfasadas)
export function usePulso() {
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
