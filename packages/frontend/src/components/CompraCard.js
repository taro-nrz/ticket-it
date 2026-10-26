import { etiquetaMobile } from "../utils/accesibilidad.js";
import { Icono } from "./Icono.js";
import { Pressable, Text, View } from "react-native";
import { espacio, estadosCompra, fuentes, radio } from "../theme.js";
import {
  fechaParaLector,
  formatearDiasRestantes,
  formatearPrecio,
  nombreCompleto,
  plural,
  textoSinLeer,
} from "../utils/formato.js";
import { Avatar, EstadoBadge, InsigniaSinLeer } from "./ui.js";
import { useTema } from "../store/TemaContext.js";
import { useEstilos } from "../hooks/useEstilos.js";

const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

const ACCION_DESTACADA = { PAGAR: "Pagar", RESENIAR: "Calificar", UTILIZAR: "Validar" };

// Compra con forma de entrada: talón con la fecha, línea troquelada y muescas (HU-05)
export function CompraCard({ compra, onPress }) {
  const { colores, texto, estados } = useTema();
  const styles = useEstilos(crearEstilos);

  const fecha = new Date(compra.evento.fecha);
  const estado = estados[compra.estado];
  const confirmada = compra.estado === "CONFIRMADA";
  const accion = compra.accionesDisponibles.find((a) => ACCION_DESTACADA[a]);
  const apagada = ["CANCELADA", "REEMBOLSADA"].includes(compra.estado);

  const resumen = [
    compra.evento.nombre,
    `Estado: ${estado.etiqueta}`,
    confirmada && compra.diasRestantes !== null && formatearDiasRestantes(compra.diasRestantes),
    fechaParaLector(compra.evento.fecha),
    `${compra.cantidad} ${compra.tipoEntrada.nombre}, total ${formatearPrecio(compra.total)}`,
    compra.cantidadMensajes > 0 && plural(compra.cantidadMensajes, "mensaje"),
    compra.mensajesSinLeer > 0 && textoSinLeer(compra.mensajesSinLeer),
    accion && `Acción pendiente: ${ACCION_DESTACADA[accion]}`,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      {...etiquetaMobile(resumen)}
      accessibilityHint="Abre el detalle de la compra"
      style={({ pressed }) => [styles.ticket, pressed && { opacity: 0.88 }]}
    >
      <View
        style={[styles.talon, { backgroundColor: confirmada ? colores.primario : estado.fondo }]}
      >
        <Text style={[styles.dia, { color: confirmada ? colores.sobrePrimario : estado.color }]}>
          {String(fecha.getDate()).padStart(2, "0")}
        </Text>
        <Text style={[styles.mes, { color: confirmada ? colores.sobrePrimario : estado.color }]}>
          {MESES[fecha.getMonth()]}
        </Text>
      </View>
      <View style={styles.troquel} />
      <View style={[styles.muesca, { top: -9 }]} />
      <View style={[styles.muesca, { bottom: -9 }]} />
      <View style={styles.cuerpo}>
        <View style={styles.encabezado}>
          <EstadoBadge estado={compra.estado} />
          {confirmada && compra.diasRestantes !== null ? (
            <Text style={styles.dias}>{formatearDiasRestantes(compra.diasRestantes)}</Text>
          ) : (
            accion && <Text style={styles.accion}>{ACCION_DESTACADA[accion]}</Text>
          )}
        </View>
        <Text style={[texto.titulo, { fontSize: 18 }]} numberOfLines={2}>
          {compra.evento.nombre}
        </Text>
        <Text style={texto.chico}>
          {compra.cantidad} × {compra.tipoEntrada.nombre} · {formatearPrecio(compra.total)}
          {apagada && compra.estado === "REEMBOLSADA" ? " devueltos" : ""}
        </Text>
        {compra.cantidadMensajes > 0 && (
          <View style={styles.mensajes}>
            <Text style={texto.chico}>
              <Icono name="chatbubble-ellipses-outline" size={13} />{" "}
              {plural(compra.cantidadMensajes, "mensaje")}
            </Text>
            <InsigniaSinLeer cantidad={compra.mensajesSinLeer} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

// Fila de una compra vista por el organizador (HU-06)
export function CompraFila({ compra, onPress }) {
  const { texto } = useTema();
  const styles = useEstilos(crearEstilos);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      {...etiquetaMobile(
        [
          nombreCompleto(compra.comprador),
          `Estado: ${estadosCompra[compra.estado].etiqueta}`,
          `${compra.cantidad} ${compra.tipoEntrada.nombre}, total ${formatearPrecio(compra.total)}`,
          compra.cantidadMensajes > 0 && plural(compra.cantidadMensajes, "mensaje"),
          compra.mensajesSinLeer > 0 && textoSinLeer(compra.mensajesSinLeer),
        ]
          .filter(Boolean)
          .join(". "),
      )}
      accessibilityHint="Abre el detalle de la compra"
      style={({ pressed }) => [styles.fila, pressed && { opacity: 0.88 }]}
    >
      <Avatar usuario={compra.comprador} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={texto.cuerpoFuerte}>{nombreCompleto(compra.comprador)}</Text>
        <Text style={texto.chico}>
          {compra.cantidad} × {compra.tipoEntrada.nombre} · {formatearPrecio(compra.total)}
          {compra.cantidadMensajes > 0 ? ` · ${plural(compra.cantidadMensajes, "mensaje")}` : ""}
        </Text>
        <InsigniaSinLeer cantidad={compra.mensajesSinLeer} />
      </View>
      <EstadoBadge estado={compra.estado} corta />
    </Pressable>
  );
}

const crearEstilos = ({ colores, estados }) => ({
  ticket: {
    flexDirection: "row",
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.l,
    marginBottom: 14,
  },
  talon: {
    width: 78,
    borderTopLeftRadius: radio.l - 1,
    borderBottomLeftRadius: radio.l - 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dia: { fontFamily: fuentes.titulo, fontSize: 28, lineHeight: 30 },
  mes: { fontFamily: fuentes.negrita, fontSize: 12, letterSpacing: 1 },
  troquel: { borderLeftWidth: 2, borderStyle: "dashed", borderColor: colores.troquel },
  muesca: {
    position: "absolute",
    left: 70,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colores.fondo,
  },
  cuerpo: { flex: 1, paddingVertical: 14, paddingHorizontal: espacio.l, gap: 6 },
  mensajes: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  encabezado: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dias: { fontFamily: fuentes.negrita, fontSize: 13, color: estados.CONFIRMADA.color },
  accion: { fontFamily: fuentes.negrita, fontSize: 13, color: colores.acentoOscuro },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: espacio.m,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.m,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
});
