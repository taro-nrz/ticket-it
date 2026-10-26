import { Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useEstilos } from "../hooks/useEstilos.js";
import { useTema } from "../store/TemaContext.js";
import { espacio, fuentes, radio } from "../theme.js";
import { Icono } from "./Icono.js";

// D-33: la entrada digital. El QR siempre es negro sobre blanco (los lectores lo necesitan con buen contraste,
// también en modo oscuro) y el código se muestra en texto para dictarlo o escribirlo si no hay cámara.
export function EntradaQR({ compra }) {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);
  const usada = compra.estado === "UTILIZADA";
  const codigoLegible = compra.codigo.split("").join(" ");

  return (
    <View style={styles.contenedor}>
      <Text style={texto.etiqueta}>Tu entrada</Text>
      <View
        style={[styles.qr, usada && { opacity: 0.35 }]}
        accessible
        role="img"
        accessibilityLabel={`Código QR de la entrada ${codigoLegible}`}
      >
        <QRCode value={compra.codigo} size={184} color="#000000" backgroundColor="#FFFFFF" />
      </View>
      <Text style={styles.codigo} selectable accessibilityLabel={`Código ${codigoLegible}`}>
        {compra.codigo}
      </Text>
      {usada ? (
        <View style={styles.estado}>
          <Icono name="checkmark-done" size={18} color={colores.exito} />
          <Text style={[texto.cuerpoFuerte, { color: colores.exito }]}>Ya se usó para entrar</Text>
        </View>
      ) : (
        <Text style={[texto.secundario, { textAlign: "center" }]}>
          Mostrá este código en la puerta. Vale para las {compra.cantidad} entradas de la compra.
        </Text>
      )}
    </View>
  );
}

const crearEstilos = ({ colores }) => ({
  contenedor: {
    alignItems: "center",
    gap: espacio.m,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.l,
    padding: espacio.xl,
    marginBottom: espacio.l,
  },
  qr: { backgroundColor: "#FFFFFF", padding: 12, borderRadius: radio.m },
  codigo: {
    fontFamily: fuentes.negrita,
    fontSize: 24,
    letterSpacing: 2,
    color: colores.texto,
  },
  estado: { flexDirection: "row", alignItems: "center", gap: 6 },
});
