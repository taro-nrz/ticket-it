import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTema } from "../store/TemaContext.js";

// Custom hook: crea los estilos de un componente a partir del tema actual
// y los vuelve a crear sólo cuando cambia el tema (claro / oscuro).
// Uso: const crearEstilos = ({ colores, texto }) => ({ ... }); const styles = useEstilos(crearEstilos);
export function useEstilos(crearEstilos) {
  const tema = useTema();
  return useMemo(() => StyleSheet.create(crearEstilos(tema)), [tema, crearEstilos]);
}
