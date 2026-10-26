import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useEstilos } from "../hooks/useEstilos.js";
import { useTema } from "../store/TemaContext.js";
import { espacio, fuentes } from "../theme.js";
import { estadoPresionado } from "../utils/accesibilidad.js";
import { Icono } from "./Icono.js";

const DIAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];

const inicioDelDia = (fecha) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
const mismoDia = (a, b) => a && b && inicioDelDia(a).getTime() === inicioDelDia(b).getTime();

// "2027-03-15" ↔ Date en hora local (sin corrimientos por zona horaria)
export function aTextoFecha(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function deTextoFecha(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto ?? "")) return null;
  const [anio, mes, dia] = texto.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

export function fechaLarga(fecha) {
  return fecha.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// D-24: calendario propio (igual en web y mobile, con el tema y accesible).
// Los días anteriores a `minimo` están deshabilitados y no se puede retroceder a meses anteriores.
export function Calendario({ valor, minimo = new Date(), onElegir }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);
  const hoy = inicioDelDia(new Date());
  const desde = inicioDelDia(minimo);
  const [mes, setMes] = useState(() => {
    const base = valor ?? desde;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const primerMesPosible = new Date(desde.getFullYear(), desde.getMonth(), 1);
  const puedeRetroceder = mes > primerMesPosible;
  const cambiarMes = (delta) => setMes(new Date(mes.getFullYear(), mes.getMonth() + delta, 1));

  // Semana empezando en lunes: huecos antes del día 1
  const huecos = (mes.getDay() + 6) % 7;
  const diasDelMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const celdas = [
    ...Array.from({ length: huecos }, () => null),
    ...Array.from(
      { length: diasDelMes },
      (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1),
    ),
  ];
  const tituloMes = mes.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <View style={styles.contenedor}>
      <View style={styles.cabecera}>
        <Pressable
          onPress={() => cambiarMes(-1)}
          disabled={!puedeRetroceder}
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
          accessibilityState={{ disabled: !puedeRetroceder }}
          style={[styles.flecha, !puedeRetroceder && styles.deshabilitado]}
        >
          <Icono name="chevron-back" size={22} color={colores.texto} />
        </Pressable>
        {/* Se anuncia al cambiar de mes */}
        <Text style={styles.mes} aria-live="polite" accessibilityLiveRegion="polite">
          {tituloMes.charAt(0).toUpperCase() + tituloMes.slice(1)}
        </Text>
        <Pressable
          onPress={() => cambiarMes(1)}
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          style={styles.flecha}
        >
          <Icono name="chevron-forward" size={22} color={colores.texto} />
        </Pressable>
      </View>

      {/* Iniciales de los días: decorativas, cada día ya dice su nombre completo */}
      <View
        style={styles.semana}
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {DIAS_SEMANA.map((dia, i) => (
          <Text key={i} style={styles.diaSemana}>
            {dia}
          </Text>
        ))}
      </View>

      <View style={styles.grilla} role="group" aria-label={`Días de ${tituloMes}`}>
        {celdas.map((dia, i) => {
          if (!dia) return <View key={`hueco-${i}`} style={styles.celda} />;
          const pasado = dia < desde;
          const elegido = mismoDia(dia, valor);
          const esHoy = mismoDia(dia, hoy);
          return (
            <View key={dia.getTime()} style={styles.celda}>
              <Pressable
                onPress={() => onElegir(dia)}
                disabled={pasado}
                accessibilityRole="button"
                accessibilityLabel={`${fechaLarga(dia)}${esHoy ? ", hoy" : ""}${pasado ? ", no disponible" : ""}`}
                accessibilityState={{ disabled: pasado }}
                aria-disabled={pasado || undefined}
                {...(pasado ? {} : estadoPresionado(elegido))}
                style={[
                  styles.dia,
                  esHoy && styles.diaHoy,
                  elegido && styles.diaElegido,
                  pasado && styles.diaPasado,
                ]}
              >
                <Text
                  style={[
                    styles.diaTexto,
                    elegido && styles.diaTextoElegido,
                    pasado && styles.diaTextoPasado,
                  ]}
                >
                  {dia.getDate()}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const crearEstilos = ({ colores, texto }) => ({
  contenedor: { gap: espacio.s },
  cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  flecha: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colores.bordeControl,
  },
  deshabilitado: { opacity: 0.3 },
  mes: { ...texto.titulo, fontSize: 18 },
  semana: { flexDirection: "row" },
  diaSemana: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontFamily: fuentes.negrita,
    fontSize: 12,
    color: colores.textoSecundario,
  },
  grilla: { flexDirection: "row", flexWrap: "wrap" },
  celda: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 2 },
  dia: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  diaHoy: { borderWidth: 1.5, borderColor: colores.acento },
  diaElegido: { backgroundColor: colores.primario, borderColor: colores.primario },
  diaPasado: { opacity: 0.35 },
  diaTexto: { fontFamily: fuentes.semi, fontSize: 16, color: colores.texto },
  diaTextoElegido: { color: colores.sobrePrimario, fontFamily: fuentes.negrita },
  // Además de atenuarse, los días pasados se tachan: no depende sólo del color (WCAG 1.4.1)
  diaTextoPasado: { textDecorationLine: "line-through" },
});
