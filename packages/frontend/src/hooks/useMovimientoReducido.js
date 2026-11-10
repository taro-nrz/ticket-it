import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

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
