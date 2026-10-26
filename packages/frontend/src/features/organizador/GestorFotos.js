import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { subirImagen } from "../../api/api.js";
import { ImagenConCarga } from "../../components/Carga.js";
import { Icono } from "../../components/Icono.js";
import { Boton, Campo, Progreso } from "../../components/ui.js";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useTema } from "../../store/TemaContext.js";
import { espacio, fuentes, radio } from "../../theme.js";
import { anunciar } from "../../utils/accesibilidad.js";
import { avisarError } from "../../utils/confirmar.js";

const MAX_FOTOS = 10;
const URL_VALIDA = /^https?:\/\/\S+$/i;

// D-42: fotos del evento. Se suben desde el dispositivo (con barra de progreso real del envío) o se pegan por URL.
// La primera es la portada; cualquier otra se puede pasar a portada.
export function GestorFotos({ fotos, onCambiar }) {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);
  const [progreso, setProgreso] = useState(null);
  const [url, setUrl] = useState("");
  const [errorUrl, setErrorUrl] = useState(null);
  const lleno = fotos.length >= MAX_FOTOS;

  const subir = async () => {
    const eleccion = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (eleccion.canceled) return;
    const [foto] = eleccion.assets;
    setProgreso(0);
    anunciar("Subiendo la foto");
    try {
      const { url: subida } = await subirImagen(foto, setProgreso);
      onCambiar([...fotos, subida]);
      anunciar(`Foto subida. Ahora hay ${fotos.length + 1}`);
    } catch (e) {
      avisarError("No se pudo subir la foto", e.message);
    } finally {
      setProgreso(null);
    }
  };

  const agregarUrl = () => {
    if (!URL_VALIDA.test(url.trim())) {
      setErrorUrl("Pegá un enlace que empiece con http:// o https://");
      return;
    }
    onCambiar([...fotos, url.trim()]);
    setUrl("");
    anunciar("Foto agregada");
  };

  const quitar = (indice) => {
    onCambiar(fotos.filter((_, i) => i !== indice));
    anunciar(`Quitaste la foto ${indice + 1}`);
  };

  const hacerPortada = (indice) => {
    onCambiar([fotos[indice], ...fotos.filter((_, i) => i !== indice)]);
    anunciar(`La foto ${indice + 1} ahora es la portada`);
  };

  return (
    <View style={{ marginBottom: espacio.m }}>
      <Text style={styles.etiqueta}>Fotos (opcional)</Text>
      <Text style={[texto.chico, { marginBottom: espacio.s }]}>
        JPG, PNG o WebP de hasta 5 MB. La primera es la portada. Hasta {MAX_FOTOS} fotos.
      </Text>

      {fotos.length > 0 && (
        <View style={styles.grilla} role="list" aria-label="Fotos del evento">
          {fotos.map((foto, indice) => (
            <View key={`${foto}-${indice}`} style={styles.miniatura} role="listitem">
              <ImagenConCarga uri={foto} style={styles.imagen} />
              {indice === 0 && (
                <View style={styles.portada}>
                  <Text style={styles.portadaTexto}>Portada</Text>
                </View>
              )}
              <View style={styles.acciones}>
                {indice > 0 && (
                  <Pressable
                    onPress={() => hacerPortada(indice)}
                    accessibilityRole="button"
                    accessibilityLabel={`Usar la foto ${indice + 1} como portada`}
                    style={styles.boton}
                  >
                    <Icono name="star-outline" size={18} color={colores.texto} />
                  </Pressable>
                )}
                <Pressable
                  onPress={() => quitar(indice)}
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar la foto ${indice + 1}`}
                  style={styles.boton}
                >
                  <Icono name="trash-outline" size={18} color={colores.error} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* La subida tiene progreso real: barra con porcentaje (el lector sólo oye el inicio y el final) */}
      {progreso !== null ? (
        <View style={styles.subiendo}>
          <Text style={texto.cuerpoFuerte}>Subiendo foto… {Math.round(progreso * 100)} %</Text>
          <Progreso
            valor={Math.round(progreso * 100)}
            total={100}
            etiqueta="Progreso de la subida"
          />
        </View>
      ) : (
        <Boton
          titulo="Subir foto"
          icono="image-outline"
          variante="secundario"
          onPress={subir}
          deshabilitado={lleno}
          accessibilityHint="Elegí una imagen de tu dispositivo"
        />
      )}

      <View style={styles.porUrl}>
        <View style={{ flex: 1 }}>
          <Campo
            etiqueta="O pegá el enlace de una imagen"
            value={url}
            onChangeText={(valor) => {
              setUrl(valor);
              setErrorUrl(null);
            }}
            error={errorUrl}
            placeholder="https://..."
            inputMode="url"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
          />
        </View>
        <Boton
          titulo="Agregar"
          variante="secundario"
          onPress={agregarUrl}
          deshabilitado={lleno}
          style={styles.agregar}
        />
      </View>
    </View>
  );
}

const crearEstilos = ({ colores }) => ({
  etiqueta: { fontFamily: fuentes.semi, fontSize: 15, color: colores.texto, marginBottom: 4 },
  grilla: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: espacio.m },
  miniatura: {
    width: 104,
    height: 104,
    borderRadius: radio.m,
    overflow: "hidden",
    backgroundColor: colores.apagado,
  },
  imagen: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  portada: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: colores.primario,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  portadaTexto: { fontFamily: fuentes.negrita, fontSize: 11, color: colores.sobrePrimario },
  acciones: { position: "absolute", right: 4, bottom: 4, flexDirection: "row", gap: 4 },
  boton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colores.fondo,
    alignItems: "center",
    justifyContent: "center",
  },
  subiendo: { gap: 8, paddingVertical: espacio.s },
  porUrl: { flexDirection: "row", gap: espacio.s, alignItems: "flex-start", marginTop: espacio.m },
  agregar: { marginTop: 27, paddingHorizontal: 18 },
});
