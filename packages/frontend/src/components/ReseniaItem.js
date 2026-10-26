import { Text, View } from "react-native";
import { espacio, fuentes } from "../theme.js";
import { Avatar, Estrellas } from "./ui.js";
import { useTema } from "../store/TemaContext.js";
import { useEstilos } from "../hooks/useEstilos.js";

export function ReseniaItem({ resenia, ultima = false }) {
  const { texto } = useTema();
  const styles = useEstilos(crearEstilos);

  return (
    <View
      style={[styles.contenedor, ultima && { borderBottomWidth: 0 }]}
      accessible
      accessibilityLabel={`Reseña de ${resenia.comprador.nombre}, ${resenia.puntuacion} de 5 estrellas, sobre ${resenia.evento.nombre}: ${resenia.detalle}`}
    >
      <View style={styles.encabezado}>
        <Avatar usuario={resenia.comprador} tamanio={32} />
        <View style={{ flex: 1 }}>
          <Text style={styles.autor}>{resenia.comprador.nombre}</Text>
          <Text style={texto.chico} numberOfLines={1}>
            {resenia.evento.nombre} · {new Date(resenia.evento.fecha).toLocaleDateString("es-AR")}
          </Text>
        </View>
        <Estrellas valor={resenia.puntuacion} tamanio={13} />
      </View>
      <Text style={styles.detalle}>{resenia.detalle}</Text>
    </View>
  );
}

const crearEstilos = ({ colores, texto }) => ({
  contenedor: {
    paddingVertical: espacio.m,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
    gap: 6,
  },
  encabezado: { flexDirection: "row", alignItems: "center", gap: 10 },
  autor: { fontFamily: fuentes.negrita, fontSize: 14, color: colores.texto },
  detalle: { ...texto.cuerpo, fontSize: 14, lineHeight: 20 },
});
