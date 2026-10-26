import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cancelarCompra, getCompra, utilizarCompra } from "../../api/api.js";
import { BarraVolver } from "../../components/Pantalla.js";
import { Icono } from "../../components/Icono.js";
import { EntradaQR } from "../../components/EntradaQR.js";
import { TransferirEntrada } from "./TransferirEntrada.js";
import { Boton, ErrorVista, EstadoBadge, Titulo } from "../../components/ui.js";
import { useCarga } from "../../hooks/useCarga.js";
import { useSesion } from "../../store/SesionContext.js";
import { espacio, estadosCompra, fuentes, radio } from "../../theme.js";
import { avisarError, avisarExito, confirmar } from "../../utils/confirmar.js";
import {
  formatearDiasRestantes,
  formatearFecha,
  formatearHora,
  formatearPrecio,
  nombreCompleto,
  plural,
  textoSinLeer,
} from "../../utils/formato.js";
import { useTema } from "../../store/TemaContext.js";
import { useEstilos } from "../../hooks/useEstilos.js";
import { EsqueletoDetalleCompra } from "../../components/Carga.js";

// Detalle y ciclo de vida de una compra con forma de entrada.
// Los botones salen de accionesDisponibles: las reglas las decide el backend.
export default function CompraDetalle() {
  const { colores, texto, estados } = useTema();
  const styles = useEstilos(crearEstilos);

  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const { esComprador } = useSesion();
  const {
    datos: compra,
    cargandoInicial,
    demorado,
    error,
    recargar,
    setDatos,
  } = useCarga(() => getCompra(id), [id], { alEnfocar: true });
  const [accionEnCurso, setAccionEnCurso] = useState(null);
  const [transfiriendo, setTransfiriendo] = useState(false);

  if (cargandoInicial) {
    return (
      <View style={{ flex: 1 }}>
        <BarraVolver titulo="Tu compra" oscuro />
        <EsqueletoDetalleCompra demorado={demorado} onReintentar={recargar} />
      </View>
    );
  }
  if (error) return <ErrorVista error={error} onReintentar={recargar} />;

  const puede = (accion) => compra.accionesDisponibles.includes(accion);

  const ejecutar = async (accion, llamada, mensajeExito) => {
    setAccionEnCurso(accion);
    try {
      setDatos(await llamada(compra.id));
      avisarExito(mensajeExito);
    } catch (e) {
      avisarError("No se pudo completar la acción", e.message);
      recargar();
    } finally {
      setAccionEnCurso(null);
    }
  };

  // HU-09 / HU-10
  const cancelar = async () => {
    const mensaje =
      compra.estado === "CONFIRMADA"
        ? `Se te reembolsarán ${formatearPrecio(compra.total)}.`
        : "La compra todavía no fue pagada, no hay nada que reembolsar.";
    if (
      await confirmar({
        titulo: "¿Cancelar la compra?",
        mensaje,
        textoConfirmar: "Sí, cancelar la compra",
        textoCancelar: "No, conservarla",
        peligro: true,
      })
    ) {
      ejecutar("CANCELAR", cancelarCompra, "Compra cancelada");
    }
  };

  const contraparte = esComprador ? compra.organizador.nombre : compra.comprador.nombre;
  const confirmada = compra.estado === "CONFIRMADA";
  const pasosPendientes = pasosQueFaltan(compra.estado);

  return (
    <View style={{ flex: 1, backgroundColor: colores.panel }}>
      <BarraVolver titulo={`Compra #${compra.id}`} oscuro />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.ancho}>
          <View style={styles.ticket}>
            <View style={styles.ticketArriba}>
              <View style={styles.filaEntre}>
                <EstadoBadge estado={compra.estado} />
                {confirmada && compra.diasRestantes !== null && (
                  <Text style={styles.dias}>{formatearDiasRestantes(compra.diasRestantes)}</Text>
                )}
              </View>
              <Text
                style={styles.evento}
                role="link"
                accessibilityRole="link"
                accessibilityHint="Abre el detalle del evento"
                onPress={() => router.push(`/evento/${compra.evento.id}`)}
              >
                {compra.evento.nombre}
              </Text>
              <Text style={texto.secundario}>
                {formatearFecha(compra.evento.fecha)} · {compra.evento.lugar}
              </Text>
            </View>
            <View style={styles.troquel}>
              <View style={[styles.muesca, { left: -32 }]} />
              <View style={[styles.muesca, { right: -32 }]} />
            </View>
            <View style={styles.datos}>
              <Dato
                etiqueta="Entrada"
                valor={`${compra.cantidad} × ${compra.tipoEntrada.nombre}`}
              />
              <Dato etiqueta="Total" valor={formatearPrecio(compra.total)} grande />
              {compra.cupon && (
                <Dato
                  etiqueta={`Cupón ${compra.cupon.codigo}`}
                  valor={`− ${formatearPrecio(compra.descuento)} (antes ${formatearPrecio(compra.subtotal)})`}
                />
              )}
              <Dato etiqueta="Titular" valor={nombreCompleto(compra.comprador)} />
              <Dato etiqueta="Organiza" valor={nombreCompleto(compra.organizador)} />
            </View>
          </View>
        </View>

        <View style={[styles.hoja, { paddingBottom: bottom + 28 }]}>
          <View style={styles.ancho}>
            {/* D-31: si el organizador canceló el evento, se explica qué pasó con la compra */}
            {compra.evento.cancelado && (
              <View style={styles.cancelado} role="note">
                <Icono name="information-circle" size={22} color={colores.error} />
                <Text style={[texto.cuerpo, { flex: 1 }]}>
                  El organizador canceló este evento.{" "}
                  {compra.estado === "REEMBOLSADA"
                    ? "Te devolvimos el dinero de la compra."
                    : "La compra quedó cancelada y no se cobró nada."}
                </Text>
              </View>
            )}
            {/* D-41: si la entrada la recibió de otra persona, se dice de quién */}
            {compra.transferencias?.length > 0 && esComprador && (
              <View style={styles.recibida} role="note">
                <Icono name="gift-outline" size={20} color={colores.texto} />
                <Text style={[texto.cuerpo, { flex: 1 }]}>
                  Recibiste esta entrada de {nombreCompleto(compra.transferencias.at(-1).de)}.
                </Text>
              </View>
            )}
            {compra.codigo && ["CONFIRMADA", "UTILIZADA"].includes(compra.estado) && (
              <EntradaQR compra={compra} />
            )}
            {/* D-36: plazo para pagar antes de que la reserva venza */}
            {compra.estado === "PENDIENTE" && compra.venceEn && (
              <PlazoReserva venceEn={compra.venceEn} onVencer={recargar} />
            )}
            {compra.estado === "VENCIDA" && (
              <View style={styles.cancelado} role="note">
                <Icono name="time-outline" size={22} color={colores.error} />
                <Text style={[texto.cuerpo, { flex: 1 }]}>
                  La reserva venció porque no se pagó a tiempo y las entradas se liberaron. Si
                  todavía querés ir, volvé a comprarlas desde el evento.
                </Text>
              </View>
            )}
            <View style={styles.acciones}>
              {puede("PAGAR") && (
                <Boton
                  titulo={`Pagar ${formatearPrecio(compra.total)}`}
                  icono="card-outline"
                  variante="acento"
                  onPress={() => router.push(`/compra/${compra.id}/pagar`)}
                />
              )}
              {puede("UTILIZAR") && (
                <Boton
                  titulo="Validar entrada en el acceso"
                  icono="checkmark-done-outline"
                  variante="exito"
                  cargando={accionEnCurso === "UTILIZAR"}
                  onPress={() =>
                    ejecutar("UTILIZAR", utilizarCompra, "Entrada marcada como utilizada")
                  }
                />
              )}
              {puede("RESENIAR") && (
                <Boton
                  titulo="Calificar el evento"
                  icono="star-outline"
                  variante="acento"
                  onPress={() => router.push(`/evento/${compra.evento.id}/reseniar`)}
                />
              )}
              {puede("CHATEAR") && (
                <Boton
                  titulo={`Chatear con ${contraparte}${
                    compra.mensajesSinLeer
                      ? ` · ${compra.mensajesSinLeer} ${compra.mensajesSinLeer === 1 ? "nuevo" : "nuevos"}`
                      : compra.cantidadMensajes
                        ? ` · ${compra.cantidadMensajes}`
                        : ""
                  }`}
                  accessibilityHint={
                    compra.mensajesSinLeer
                      ? `Tenés ${textoSinLeer(compra.mensajesSinLeer)}`
                      : compra.cantidadMensajes
                        ? `La conversación tiene ${plural(compra.cantidadMensajes, "mensaje")}`
                        : "Todavía no hay mensajes"
                  }
                  icono="chatbubble-outline"
                  onPress={() => router.push(`/compra/${compra.id}/chat`)}
                />
              )}
              {puede("TRANSFERIR") && (
                <Boton
                  titulo="Transferir a otra persona"
                  icono="paper-plane-outline"
                  variante="secundario"
                  accessibilityHint="Le pasa la entrada a otra cuenta de comprador"
                  onPress={() => setTransfiriendo(true)}
                />
              )}
              {puede("CANCELAR") && (
                <Boton
                  titulo={confirmada ? "Cancelar y pedir reembolso" : "Cancelar compra"}
                  accessibilityHint="Pide confirmación antes de cancelar"
                  variante="peligro"
                  cargando={accionEnCurso === "CANCELAR"}
                  onPress={cancelar}
                />
              )}
            </View>

            <Titulo nivel={2} style={[texto.seccion, { marginBottom: espacio.m }]}>
              Seguimiento
            </Titulo>
            <View role="list">
              {compra.historial.map((cambio, indice) => (
                <Paso
                  key={indice}
                  color={estados[cambio.estado].color}
                  titulo={estadosCompra[cambio.estado].etiqueta}
                  detalle={`${formatearFecha(cambio.fechaHora)} · ${cambio.quien?.nombre ?? "Automático"}`}
                  conLinea={indice < compra.historial.length - 1 || pasosPendientes.length > 0}
                />
              ))}
              {pasosPendientes.map((paso, indice) => (
                <Paso
                  key={paso.titulo}
                  pendiente
                  titulo={paso.titulo}
                  detalle={paso.detalle}
                  conLinea={indice < pasosPendientes.length - 1}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      <TransferirEntrada
        compra={compra}
        visible={transfiriendo}
        onCerrar={() => setTransfiriendo(false)}
      />
    </View>
  );
}

// D-36: cuenta regresiva para pagar. El reloj es decorativo (no se anuncia cada segundo):
// el lector de pantalla lee la hora límite, que no cambia.
function PlazoReserva({ venceEn, onVencer }) {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);
  const [ahora, setAhora] = useState(() => Date.now());
  const restanteMs = new Date(venceEn).getTime() - ahora;

  useEffect(() => {
    if (restanteMs <= 0) {
      onVencer();
      return;
    }
    const temporizador = setTimeout(() => setAhora(Date.now()), 1000);
    return () => clearTimeout(temporizador);
  }, [restanteMs, onVencer]);

  const segundos = Math.max(0, Math.ceil(restanteMs / 1000));
  const reloj = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;
  const urgente = segundos <= 120;
  return (
    <View style={[styles.plazo, urgente && { borderColor: colores.error }]}>
      <Icono name="time-outline" size={22} color={urgente ? colores.error : colores.texto} />
      <View style={{ flex: 1 }}>
        <Text style={texto.cuerpoFuerte}>Tenés hasta las {formatearHora(venceEn)} para pagar</Text>
        <Text style={texto.chico}>Si no, la reserva vence y las entradas se liberan.</Text>
      </View>
      <Text
        style={[styles.plazoReloj, urgente && { color: colores.error }]}
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {reloj}
      </Text>
    </View>
  );
}

// Próximos pasos del ciclo de vida que todavía no ocurrieron
function pasosQueFaltan(estado) {
  if (estado === "PENDIENTE") {
    return [
      { titulo: "Confirmada", detalle: "Al pagar la compra" },
      { titulo: "Utilizada", detalle: "El día del evento, al ingresar" },
    ];
  }
  if (estado === "CONFIRMADA") {
    return [{ titulo: "Utilizada", detalle: "El día del evento, al ingresar" }];
  }
  return [];
}

function Dato({ etiqueta, valor, grande }) {
  const { texto } = useTema();
  const styles = useEstilos(crearEstilos);

  return (
    <View
      style={styles.dato}
      accessible
      accessibilityLabel={`${etiqueta}: ${valor.replace("×", "")}`}
    >
      <Text style={texto.chico}>{etiqueta}</Text>
      <Text style={[styles.datoValor, grande && { fontSize: 18, fontFamily: fuentes.titulo }]}>
        {valor}
      </Text>
    </View>
  );
}

function Paso({ color, titulo, detalle, conLinea, pendiente }) {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);

  return (
    <View
      style={styles.paso}
      role="listitem"
      accessible
      accessibilityLabel={
        pendiente ? `Próximo paso: ${titulo}. ${detalle}` : `${titulo}. ${detalle}`
      }
    >
      <View style={styles.pasoMarca}>
        <View
          style={[styles.punto, pendiente ? styles.puntoPendiente : { backgroundColor: color }]}
        />
        {conLinea && <View style={styles.linea} />}
      </View>
      <View style={{ paddingBottom: 14, flex: 1 }}>
        <Text style={[texto.cuerpoFuerte, pendiente && { color: colores.textoSecundario }]}>
          {titulo}
        </Text>
        <Text style={texto.chico}>{detalle}</Text>
      </View>
    </View>
  );
}

const crearEstilos = ({ colores, estados }) => ({
  recibida: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.m,
    padding: 12,
    marginBottom: espacio.l,
  },
  plazo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colores.superficie,
    borderWidth: 1.5,
    borderColor: colores.bordeControl,
    borderRadius: radio.m,
    padding: 14,
    marginBottom: espacio.l,
  },
  plazoReloj: { fontFamily: fuentes.titulo, fontSize: 26, color: colores.texto },
  cancelado: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: colores.errorFondo,
    borderWidth: 1,
    borderColor: colores.error,
    borderRadius: radio.m,
    padding: 14,
    marginBottom: espacio.l,
  },
  ancho: { width: "100%", maxWidth: 720, alignSelf: "center" },
  ticket: {
    marginHorizontal: espacio.xl,
    marginTop: 4,
    backgroundColor: colores.ticket,
    borderRadius: 24,
  },
  ticketArriba: { padding: espacio.xl, gap: 10 },
  filaEntre: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dias: { fontFamily: fuentes.titulo, fontSize: 20, color: estados.CONFIRMADA.color },
  evento: {
    fontFamily: fuentes.titulo,
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: -0.6,
    color: colores.texto,
  },
  troquel: {
    borderTopWidth: 2,
    borderStyle: "dashed",
    borderTopColor: colores.troquel,
    marginHorizontal: 18,
  },
  muesca: {
    position: "absolute",
    top: -13,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colores.panel,
  },
  datos: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: espacio.xl,
    paddingTop: espacio.l,
    paddingBottom: espacio.xl,
    rowGap: 12,
  },
  dato: { width: "50%", gap: 2 },
  datoValor: { fontFamily: fuentes.negrita, fontSize: 15, color: colores.texto },
  hoja: {
    flexGrow: 1,
    marginTop: 18,
    backgroundColor: colores.fondo,
    borderTopLeftRadius: radio.xl,
    borderTopRightRadius: radio.xl,
    paddingHorizontal: espacio.xl,
    paddingTop: 22,
  },
  acciones: { gap: 10, marginBottom: espacio.xxl },
  paso: { flexDirection: "row", gap: 12 },
  pasoMarca: { alignItems: "center", width: 14 },
  punto: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  puntoPendiente: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#A49FAE",
  },
  linea: { flex: 1, width: 2, backgroundColor: colores.troquel, marginTop: 2 },
});
