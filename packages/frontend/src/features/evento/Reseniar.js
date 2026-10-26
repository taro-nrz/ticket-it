import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { reseniarEvento } from "../../api/api.js";
import { BarraVolver, Pantalla } from "../../components/Pantalla.js";
import { Boton, Campo, Estrellas, Titulo } from "../../components/ui.js";
import { espacio, fuentes } from "../../theme.js";
import { avisarError, avisarExito } from "../../utils/confirmar.js";
import { useEstilos } from "../../hooks/useEstilos.js";

const ETIQUETAS = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];

// HU-11: puntuar (1 a 5) y comentar un evento con la entrada utilizada
export default function Reseniar() {
  const styles = useEstilos(crearEstilos);

  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [puntuacion, setPuntuacion] = useState(0);
  const [detalle, setDetalle] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    setEnviando(true);
    try {
      await reseniarEvento(id, puntuacion, detalle.trim());
      avisarExito("¡Gracias por tu reseña! Ya está publicada.");
      router.back();
    } catch (e) {
      avisarError("No se pudo enviar la reseña", e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <BarraVolver subtitulo="Tu experiencia" titulo="Calificar evento" />
      <Pantalla>
        <View style={styles.tarjeta}>
          <Titulo nivel={2} style={styles.titulo}>
            ¿Cómo la pasaste?
          </Titulo>
          <Estrellas valor={puntuacion} tamanio={42} onCambiar={setPuntuacion} />
          <Text style={styles.etiqueta} aria-live="polite" accessibilityLiveRegion="polite">
            {puntuacion
              ? `${puntuacion} de 5: ${ETIQUETAS[puntuacion]}`
              : "Tocá una estrella para puntuar"}
          </Text>
        </View>
        <Campo
          etiqueta="Comentario"
          value={detalle}
          onChangeText={setDetalle}
          placeholder="Contá qué te pareció el evento, la organización, el lugar..."
          multiline
          maxLength={1000}
          autoCapitalize="sentences"
          ayuda={`${detalle.length}/1000 caracteres`}
        />
        <Boton
          titulo="Enviar reseña"
          variante="acento"
          onPress={enviar}
          cargando={enviando}
          deshabilitado={puntuacion === 0 || !detalle.trim()}
          accessibilityHint={
            puntuacion === 0 || !detalle.trim()
              ? "Para enviar, elegí una puntuación y escribí un comentario"
              : undefined
          }
        />
      </Pantalla>
    </View>
  );
}

const crearEstilos = ({ colores, texto, estados }) => ({
  tarjeta: {
    alignItems: "center",
    gap: espacio.m,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 24,
    paddingVertical: espacio.xxl,
    marginBottom: espacio.xl,
  },
  titulo: { fontFamily: fuentes.titulo, fontSize: 24, color: colores.texto },
  etiqueta: { ...texto.secundario, fontFamily: fuentes.semi },
});
