import { forwardRef, useId, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useEstilos } from "../hooks/useEstilos.js";
import { useTema } from "../store/TemaContext.js";
import { espacio, fuentes } from "../theme.js";
import { anunciar } from "../utils/accesibilidad.js";
import { aTextoFecha, Calendario, deTextoFecha, fechaLarga } from "./Calendario.js";
import { Icono } from "./Icono.js";
import { ModalAccesible } from "./ModalAccesible.js";
import { Boton } from "./ui.js";

// Campo de formulario que abre el calendario. `valor` es "AAAA-MM-DD"; sólo se pueden elegir fechas desde `minimo`.
export const CampoFecha = forwardRef(function CampoFecha(
  { etiqueta, valor, onCambiar, minimo = new Date(), error },
  ref,
) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);
  const [abierto, setAbierto] = useState(false);
  const id = useId();
  const fecha = deTextoFecha(valor);
  const textoFecha = fecha ? fechaLarga(fecha) : "Elegí una fecha";

  const elegir = (dia) => {
    onCambiar(aTextoFecha(dia));
    setAbierto(false);
    anunciar(`Fecha elegida: ${fechaLarga(dia)}`);
  };

  return (
    <View style={{ marginBottom: espacio.m }}>
      <Text nativeID={`${id}-etiqueta`} style={styles.etiqueta}>
        {etiqueta}
      </Text>
      <Pressable
        ref={ref}
        onPress={() => setAbierto(true)}
        accessibilityRole="button"
        aria-haspopup="dialog"
        accessibilityLabel={`${etiqueta}: ${textoFecha}`}
        accessibilityHint="Abre el calendario"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        style={[styles.boton, error && styles.botonError]}
      >
        <Icono name="calendar-outline" size={20} color={colores.texto} />
        <Text style={[styles.valor, !fecha && styles.placeholder]}>
          {fecha ? textoFecha.charAt(0).toUpperCase() + textoFecha.slice(1) : textoFecha}
        </Text>
        <Icono name="chevron-down" size={18} color={colores.textoSecundario} />
      </Pressable>
      {error && (
        <View style={styles.error}>
          <Icono name="alert-circle" size={16} color={colores.error} />
          <Text nativeID={`${id}-error`} style={styles.textoError}>
            {error}
          </Text>
        </View>
      )}

      <ModalAccesible
        visible={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={etiqueta === "Fecha" ? "Elegí la fecha del evento" : etiqueta}
        posicion="abajo"
      >
        <Calendario valor={fecha} minimo={minimo} onElegir={elegir} />
        <Boton titulo="Cancelar" variante="secundario" onPress={() => setAbierto(false)} />
      </ModalAccesible>
    </View>
  );
});

const crearEstilos = ({ colores }) => ({
  etiqueta: { fontFamily: fuentes.semi, fontSize: 15, color: colores.texto, marginBottom: 6 },
  boton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.bordeControl,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  botonError: { borderColor: colores.error, borderWidth: 2 },
  valor: { flex: 1, fontFamily: fuentes.texto, fontSize: 16, color: colores.texto },
  placeholder: { color: colores.textoSecundario },
  error: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  textoError: { flex: 1, fontFamily: fuentes.medio, color: colores.error, fontSize: 14 },
});
