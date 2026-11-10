import { forwardRef, useId } from "react";
import { Text, TextInput, View } from "react-native";
import { espacio, fuentes } from "../../theme.js";
import { Icono } from "../icono/Icono.jsx";
import { useTema } from "../../context/TemaContext.jsx";
import { useEstilos } from "../../hooks/useEstilos.js";

// Pautas 1, 3 y 7: etiqueta visible asociada al campo, error con ícono + texto asociado al campo
// (aria-invalid / aria-describedby) y tipo de teclado/autocompletado que recibe por props.
export const Campo = forwardRef(function Campo({ etiqueta, error, ayuda, ...props }, ref) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);
  const id = useId();
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;
  const descripciones = [error && idError, ayuda && idAyuda].filter(Boolean).join(" ") || undefined;
  return (
    <View style={{ marginBottom: espacio.m }}>
      {etiqueta && (
        <Text nativeID={`${id}-etiqueta`} style={styles.etiquetaCampo}>
          {etiqueta}
        </Text>
      )}
      <TextInput
        ref={ref}
        placeholderTextColor={colores.textoSecundario}
        accessibilityLabel={etiqueta}
        accessibilityHint={error ? `Error: ${error}` : ayuda}
        aria-invalid={error ? true : undefined}
        aria-describedby={descripciones}
        style={[
          styles.input,
          props.multiline && styles.inputMultilinea,
          error && styles.inputError,
        ]}
        {...props}
      />
      {ayuda && !error && (
        <Text nativeID={idAyuda} style={styles.ayuda}>
          {ayuda}
        </Text>
      )}
      {error && (
        <View style={styles.error}>
          <Icono name="alert-circle" size={16} color={colores.error} />
          <Text nativeID={idError} style={styles.textoError}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
});

const crearEstilos = ({ colores, texto }) => ({
  etiquetaCampo: { fontFamily: fuentes.semi, fontSize: 15, color: colores.texto, marginBottom: 6 },
  input: {
    minHeight: 48,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.bordeControl,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fuentes.texto,
    color: colores.texto,
  },
  inputMultilinea: { minHeight: 96, textAlignVertical: "top" },
  inputError: { borderColor: colores.error, borderWidth: 2 },
  ayuda: { ...texto.chico, marginTop: 4 },
  error: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  textoError: { flex: 1, fontFamily: fuentes.medio, color: colores.error, fontSize: 14 },
});
