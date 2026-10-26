import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { validarCupon } from "../../api/api.js";
import { Icono } from "../../components/Icono.js";
import { Boton, Campo } from "../../components/ui.js";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useTema } from "../../store/TemaContext.js";
import { espacio, fuentes, radio } from "../../theme.js";
import { anunciar } from "../../utils/accesibilidad.js";
import { formatearPrecio } from "../../utils/formato.js";

// D-38: el comprador aplica un cupón antes de comprar y ve el descuento. Si cambia la cantidad o el tipo,
// el descuento se recalcula (por ejemplo, un 2×1 deja de aplicar con una sola entrada).
export function CampoCupon({ eventoId, tipo, cantidad, aplicado, onCambiar }) {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);
  const [abierto, setAbierto] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState(null);
  const [validando, setValidando] = useState(false);

  const aplicar = async (valor) => {
    if (!valor.trim()) {
      setError("Escribí el código del cupón");
      return;
    }
    setValidando(true);
    try {
      const resultado = await validarCupon(eventoId, valor.trim(), tipo.id, cantidad);
      setError(null);
      onCambiar(resultado);
      anunciar(
        `Cupón ${resultado.cupon.codigo} aplicado: ${formatearPrecio(resultado.descuento)} de descuento`,
      );
    } catch (e) {
      setError(e.message);
      onCambiar(null);
    } finally {
      setValidando(false);
    }
  };

  // Recalcular si cambia la compra con un cupón ya aplicado
  useEffect(() => {
    if (aplicado) aplicar(aplicado.cupon.codigo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo.id, cantidad]);

  if (aplicado) {
    return (
      <View style={styles.aplicado}>
        <Icono name="pricetag" size={20} color={colores.exito} />
        <View style={{ flex: 1 }}>
          <Text style={texto.cuerpoFuerte}>
            {aplicado.cupon.codigo} · {aplicado.cupon.descripcion}
          </Text>
          <Text style={texto.chico}>Ahorrás {formatearPrecio(aplicado.descuento)}</Text>
        </View>
        <Pressable
          onPress={() => {
            onCambiar(null);
            setCodigo("");
            anunciar("Quitaste el cupón");
          }}
          accessibilityRole="button"
          accessibilityLabel={`Quitar el cupón ${aplicado.cupon.codigo}`}
          style={styles.quitar}
        >
          <Icono name="close" size={20} color={colores.texto} />
        </Pressable>
      </View>
    );
  }

  if (!abierto) {
    return (
      <Pressable onPress={() => setAbierto(true)} accessibilityRole="button" style={styles.enlace}>
        <Icono name="pricetag-outline" size={18} color={colores.texto} />
        <Text style={styles.enlaceTexto}>¿Tenés un cupón de descuento?</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.formulario}>
      <View style={{ flex: 1 }}>
        <Campo
          etiqueta="Cupón de descuento"
          value={codigo}
          onChangeText={(valor) => {
            setCodigo(valor.toUpperCase());
            setError(null);
          }}
          error={error}
          placeholder="Ej: INDIE20"
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          returnKeyType="done"
          onSubmitEditing={() => aplicar(codigo)}
        />
      </View>
      <Boton
        titulo="Aplicar"
        variante="secundario"
        onPress={() => aplicar(codigo)}
        cargando={validando}
        style={styles.botonAplicar}
      />
    </View>
  );
}

const crearEstilos = ({ colores }) => ({
  enlace: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    minHeight: 44,
    marginBottom: espacio.s,
  },
  enlaceTexto: {
    fontFamily: fuentes.semi,
    fontSize: 15,
    color: colores.texto,
    textDecorationLine: "underline",
  },
  formulario: { flexDirection: "row", gap: espacio.s, alignItems: "flex-start" },
  botonAplicar: { marginTop: 27, paddingHorizontal: 18 },
  aplicado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colores.superficie,
    borderWidth: 1.5,
    borderColor: colores.exito,
    borderRadius: radio.m,
    padding: 12,
    marginBottom: espacio.m,
  },
  quitar: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
