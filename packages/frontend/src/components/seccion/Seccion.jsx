import { View } from "react-native";
import { espacio } from "../../theme.js";
import { useTema } from "../../context/TemaContext.jsx";
import { useEstilos } from "../../hooks/useEstilos.js";
import { Titulo } from "../titulo/Titulo.jsx";

export function Seccion({ titulo, children, accion }) {
  const { texto } = useTema();
  const styles = useEstilos(crearEstilos);

  return (
    <View style={styles.seccion}>
      <View style={[styles.fila, { justifyContent: "space-between", marginBottom: espacio.m }]}>
        <Titulo nivel={2} style={texto.seccion}>
          {titulo}
        </Titulo>
        {accion}
      </View>
      {children}
    </View>
  );
}

const crearEstilos = () => ({
  fila: { flexDirection: "row", alignItems: "center", gap: espacio.s },
  seccion: { marginBottom: espacio.xxl },
});
