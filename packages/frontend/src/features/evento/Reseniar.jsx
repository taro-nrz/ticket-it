import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { reseniarEvento } from "../../service/reseniasService.js";
import { BarraVolver } from "../../components/encabezado/BarraVolver.jsx";
import { Pantalla } from "../../components/pantalla/Pantalla.jsx";
import { Boton } from "../../components/boton/Boton.jsx";
import { Campo } from "../../components/formulario/Campo.jsx";
import { Estrellas } from "../../components/estrellas/Estrellas.jsx";
import { Titulo } from "../../components/titulo/Titulo.jsx";
import { espacio, fuentes, relieveBase } from "../../theme.js";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useAccion } from "../../hooks/useAccion.js";

const ETIQUETAS = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];

// HU-11: puntuar (1 a 5) y comentar un evento con la entrada utilizada
export default function Reseniar() {
  const styles = useEstilos(crearEstilos);

  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [puntuacion, setPuntuacion] = useState(0);
  const [detalle, setDetalle] = useState("");
  const { ejecutar, enCurso } = useAccion();

  const enviar = async () => {
    const enviada = await ejecutar("ENVIAR", () => reseniarEvento(id, puntuacion, detalle.trim()), {
      exito: "¡Gracias por tu reseña! Ya está publicada.",
      error: "No se pudo enviar la reseña",
    });
    if (enviada) router.back();
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
          cargando={enCurso === "ENVIAR"}
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

const crearEstilos = ({ colores, texto }) => ({
  tarjeta: {
    alignItems: "center",
    gap: espacio.m,
    backgroundColor: colores.superficie,
    borderWidth: relieveBase.grosor,
    borderColor: colores.contorno,
    borderRadius: 24,
    paddingVertical: espacio.xxl,
    marginBottom: espacio.xl,
  },
  titulo: { fontFamily: fuentes.titulo, fontSize: 24, color: colores.texto },
  etiqueta: { ...texto.secundario, fontFamily: fuentes.semi },
});
