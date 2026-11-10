import { Text, View } from "react-native";
import { espacio } from "../../theme.js";
import { Icono } from "../icono/Icono.jsx";
import { useTema } from "../../context/TemaContext.jsx";
import { useEstilos } from "../../hooks/useEstilos.js";

export function Vacio({ icono = "file-tray-outline", mensaje }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);

  return (
    <View style={styles.centro}>
      <View style={styles.vacioIcono}>
        <Icono name={icono} size={30} color={colores.acentoTexto} />
      </View>
      <Text style={styles.textoCentrado}>{mensaje}</Text>
    </View>
  );
}

const crearEstilos = ({ colores, texto }) => ({
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: espacio.xxl,
    gap: espacio.m,
  },
  textoCentrado: { ...texto.secundario, textAlign: "center", maxWidth: 280 },
  vacioIcono: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colores.acentoSuave,
    alignItems: "center",
    justifyContent: "center",
  },
});
