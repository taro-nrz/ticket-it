import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { espacio, fuentes } from "../../theme.js";
import { Icono } from "../icono/Icono.jsx";
import { useTema } from "../../context/TemaContext.jsx";
import { useEstilos } from "../../hooks/useEstilos.js";

const variantesBoton = (colores) => ({
  primario: { fondo: colores.primario, texto: colores.sobrePrimario, borde: colores.primario },
  acento: { fondo: colores.acento, texto: colores.sobreAcento, borde: colores.acento },
  secundario: { fondo: "transparent", texto: colores.texto, borde: colores.texto },
  peligro: { fondo: "transparent", texto: colores.error, borde: colores.error },
  // acción destructiva confirmada (ej. en un modal): fondo lleno, contraste ≥ 5.8:1 en ambos temas
  peligroLleno: { fondo: colores.error, texto: colores.fondo, borde: colores.error },
  exito: { fondo: colores.exitoBoton, texto: "#FFFFFF", borde: colores.exitoBoton },
});

// Pauta 5: un <button> real (rol, foco y teclado). Pauta 6: alto mínimo 50 px.
export function Boton({
  titulo,
  onPress,
  variante = "primario",
  deshabilitado,
  cargando,
  icono,
  style,
  accessibilityHint,
}) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);
  const v = variantesBoton(colores)[variante];
  const inactivo = deshabilitado || cargando;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactivo, busy: !!cargando }}
      style={({ pressed }) => [
        styles.boton,
        { backgroundColor: v.fondo, borderColor: v.borde },
        (pressed || inactivo) && { opacity: inactivo ? 0.45 : 0.85 },
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={v.texto} accessibilityLabel="Procesando" />
      ) : (
        <View style={styles.fila}>
          {icono && <Icono name={icono} size={19} color={v.texto} />}
          <Text style={[styles.botonTexto, { color: v.texto }]}>{titulo}</Text>
        </View>
      )}
    </Pressable>
  );
}

const crearEstilos = () => ({
  fila: { flexDirection: "row", alignItems: "center", gap: espacio.s },
  boton: {
    minHeight: 50,
    paddingHorizontal: espacio.xl,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  botonTexto: { fontFamily: fuentes.negrita, fontSize: 16 },
});
