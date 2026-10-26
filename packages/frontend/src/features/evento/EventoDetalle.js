import { Icono } from "../../components/Icono.js";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  agregarFavorito,
  comprar,
  getEvento,
  getReseniasDeEvento,
  quitarFavorito,
} from "../../api/api.js";
import { ImagenEvento } from "../../components/EventoCard.js";
import { ReseniaItem } from "../../components/ReseniaItem.js";
import { CancelarEvento } from "../organizador/CancelarEvento.js";
import { CampoCupon } from "./CampoCupon.js";
import { agregarAlCalendario, compartirEvento } from "../../utils/compartir.js";
import { AvisoPrioridad, ListaEspera } from "./ListaEspera.js";
import { TituloPagina } from "../../components/Pantalla.js";
import { Avatar, Boton, Contador, ErrorVista, Estrellas, Titulo } from "../../components/ui.js";
import { estadoPresionado, etiquetaMobile } from "../../utils/accesibilidad.js";
import { useCarga } from "../../hooks/useCarga.js";
import { useSesion } from "../../store/SesionContext.js";
import { espacio, fuentes, radio } from "../../theme.js";
import { avisarError, avisarExito } from "../../utils/confirmar.js";
import { formatearFecha, formatearPrecio, nombreCompleto, plural } from "../../utils/formato.js";
import { useTema } from "../../store/TemaContext.js";
import { useEstilos } from "../../hooks/useEstilos.js";
import { EsqueletoDetalleEvento } from "../../components/Carga.js";

const MAX_POR_COMPRA = 10;
const RESENIAS_VISIBLES = 3;

// Detalle del evento: tipos de entrada, compra (HU-04), reputación y reseñas del organizador (HU-12)
export default function EventoDetalle() {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);

  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { usuario, esComprador } = useSesion();
  const {
    datos: evento,
    cargandoInicial,
    demorado,
    error,
    recargar,
    setDatos,
  } = useCarga(() => getEvento(id), [id], { alEnfocar: true });
  const [tipoElegido, setTipoElegido] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [comprando, setComprando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [cupon, setCupon] = useState(null);

  if (cargandoInicial) {
    return (
      <View style={{ flex: 1, backgroundColor: colores.fondo }}>
        <EsqueletoDetalleEvento demorado={demorado} onReintentar={recargar} />
        <View style={[styles.botonesFlotantes, { top: top + 12 }]}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            style={styles.botonRedondo}
          >
            <Icono name="chevron-back" size={22} color={colores.texto} />
          </Pressable>
        </View>
      </View>
    );
  }
  if (error) return <ErrorVista error={error} onReintentar={recargar} />;

  const esMiEvento = usuario?.id === evento.organizador.id;
  const tipo = evento.tiposEntrada.find((t) => t.id === tipoElegido);
  // D-40: inscripciones de quien mira en la lista de espera (por tipo de entrada)
  const esperaDe = (tipoId) => evento.listaEspera?.mias.find((i) => i.tipoEntradaId === tipoId);
  const prioridadDe = (tipoId) => {
    const inscripcion = esperaDe(tipoId);
    return inscripcion?.estado === "AVISADA" ? inscripcion : null;
  };
  const maximo = tipo
    ? Math.min(tipo.disponibles + (prioridadDe(tipo.id)?.cantidad ?? 0), MAX_POR_COMPRA)
    : 1;
  const puedeComprar = esComprador && !evento.yaSeRealizo && !evento.cancelado;
  // Si el evento ya pasó, sus reseñas tienen su propia sección: acá van las de los otros eventos
  const otrasResenias = evento.ultimasResenias.filter((r) => r.evento.id !== evento.id);

  const total = tipo ? (cupon?.total ?? tipo.precio * cantidad) : 0;

  const volver = () => (router.canGoBack() ? router.back() : router.replace("/"));

  const alternarFavorito = async () => {
    try {
      if (evento.esFavorito) {
        await quitarFavorito(evento.id);
      } else {
        await agregarFavorito(evento.id);
      }
      setDatos({ ...evento, esFavorito: !evento.esFavorito });
    } catch (e) {
      avisarError("No se pudo actualizar favoritos", e.message);
    }
  };

  const compartir = async () => {
    try {
      const resultado = await compartirEvento(evento);
      if (resultado === "copiado")
        avisarExito("Copiamos el enlace del evento para que lo compartas");
    } catch (e) {
      avisarError("No se pudo compartir el evento", e.message);
    }
  };

  const confirmarCompra = async () => {
    setComprando(true);
    try {
      const compra = await comprar(evento.id, tipo.id, cantidad, cupon?.cupon.codigo);
      setTipoElegido(null);
      setCantidad(1);
      setCupon(null);
      router.push(`/compra/${compra.id}`);
    } catch (e) {
      avisarError("No se pudo realizar la compra", e.message);
      recargar();
    } finally {
      setComprando(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <TituloPagina titulo={evento.nombre} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <ImagenEvento evento={evento} alto={260 + top} margenInferior={44} galeria>
          <View style={[styles.botonesFlotantes, { top: top + 12 }]}>
            <Pressable
              onPress={volver}
              accessibilityRole="button"
              accessibilityLabel="Volver"
              style={styles.botonRedondo}
            >
              <Icono name="chevron-back" size={22} color={colores.texto} />
            </Pressable>
            <View style={styles.flotantesDerecha}>
              {/* D-43: compartir el evento */}
              <Pressable
                onPress={compartir}
                accessibilityRole="button"
                accessibilityLabel="Compartir el evento"
                style={styles.botonRedondo}
              >
                <Icono name="share-social-outline" size={21} color={colores.texto} />
              </Pressable>
              {esComprador && (
                <Pressable
                  onPress={alternarFavorito}
                  accessibilityRole="button"
                  accessibilityLabel="Guardar en favoritos"
                  {...estadoPresionado(!!evento.esFavorito)}
                  style={styles.botonRedondo}
                >
                  <Icono
                    name={evento.esFavorito ? "heart" : "heart-outline"}
                    size={21}
                    color={colores.acento}
                  />
                </Pressable>
              )}
            </View>
          </View>
        </ImagenEvento>

        <View style={styles.hoja}>
          <View style={styles.contenido}>
            <Text style={texto.categoria}>{evento.categoria.nombre.toUpperCase()}</Text>
            <Titulo nivel={1} style={styles.nombre}>
              {evento.nombre}
            </Titulo>

            <View style={styles.datos}>
              <Dato etiqueta="Cuándo" valor={formatearFecha(evento.fecha)} />
              <Dato etiqueta="Dónde" valor={evento.lugar} detalle={evento.direccion} />
            </View>
            {!evento.yaSeRealizo && !evento.cancelado && (
              <Boton
                titulo="Agregar al calendario"
                icono="calendar-outline"
                variante="secundario"
                accessibilityHint="Descarga el evento para agregarlo a tu calendario"
                onPress={() => agregarAlCalendario(evento)}
                style={{ marginBottom: espacio.l }}
              />
            )}

            <Text style={styles.descripcion}>{evento.descripcion}</Text>

            {/* D-31: aviso de evento cancelado (con el motivo que dio el organizador) */}
            {evento.cancelado && (
              <View style={styles.cancelado} role="note">
                <Icono name="close-circle" size={22} color={colores.error} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.canceladoTitulo}>Este evento fue cancelado</Text>
                  <Text style={texto.secundario}>Motivo: {evento.motivoCancelacion}</Text>
                </View>
              </View>
            )}

            {esMiEvento && (
              <View style={styles.accionesOrganizador}>
                <Boton
                  titulo="Ver compras de este evento"
                  icono="receipt-outline"
                  onPress={() => router.push(`/evento/${evento.id}/compras`)}
                />
                <Boton
                  titulo="Estadísticas"
                  icono="stats-chart-outline"
                  variante="secundario"
                  onPress={() => router.push(`/evento/${evento.id}/estadisticas`)}
                />
                <Boton
                  titulo="Cupones de descuento"
                  icono="pricetags-outline"
                  variante="secundario"
                  onPress={() => router.push(`/evento/${evento.id}/cupones`)}
                />
                {evento.puedeEditarse && (
                  <View style={styles.filaAcciones}>
                    <Boton
                      titulo="Editar evento"
                      icono="create-outline"
                      variante="secundario"
                      onPress={() => router.push(`/evento/${evento.id}/editar`)}
                      style={{ flexGrow: 1, flexBasis: 150 }}
                    />
                    <Boton
                      titulo="Cancelar evento"
                      icono="close-circle-outline"
                      variante="peligro"
                      accessibilityHint="Pide el motivo y confirmación antes de cancelar"
                      onPress={() => setCancelando(true)}
                      style={{ flexGrow: 1, flexBasis: 150 }}
                    />
                  </View>
                )}
              </View>
            )}
            {esMiEvento && (
              <CancelarEvento
                evento={evento}
                visible={cancelando}
                onCerrar={() => setCancelando(false)}
                onCancelado={(actualizado) => {
                  setCancelando(false);
                  setDatos({ ...evento, ...actualizado });
                }}
              />
            )}

            <Titulo nivel={2} style={[texto.seccion, { marginBottom: espacio.m }]}>
              {puedeComprar ? "Elegí tu entrada" : "Entradas"}
            </Titulo>
            {evento.tiposEntrada.map((t) => {
              const seleccionado = t.id === tipoElegido;
              const prioridad = prioridadDe(t.id);
              const seleccionable = puedeComprar && (!t.agotado || prioridad);
              const enEspera = evento.listaEspera?.enEspera?.[t.id] ?? 0;
              if (t.agotado && !prioridad) {
                return (
                  <View key={t.id} style={[styles.tipo, styles.tipoAgotado]}>
                    <View
                      style={styles.tipoFilaAgotado}
                      accessible
                      accessibilityLabel={`${t.nombre}, ${formatearPrecio(t.precio)}, agotado${
                        enEspera > 0 ? `, ${enEspera} en lista de espera` : ""
                      }`}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.tipoNombre, { color: colores.textoSecundario }]}>
                          {t.nombre}
                        </Text>
                        <Text style={texto.chico}>
                          Agotado
                          {enEspera > 0 ? ` · ${enEspera} en lista de espera` : ""}
                        </Text>
                      </View>
                      <Text style={[styles.tipoPrecio, styles.tachado]}>
                        {formatearPrecio(t.precio)}
                      </Text>
                    </View>
                    {puedeComprar && (
                      <ListaEspera
                        evento={evento}
                        tipo={t}
                        inscripcion={esperaDe(t.id)}
                        onCambio={recargar}
                      />
                    )}
                  </View>
                );
              }
              return (
                <View key={t.id} style={[styles.tipo, seleccionado && styles.tipoSeleccionado]}>
                  {prioridad && <AvisoPrioridad inscripcion={prioridad} />}
                  <Pressable
                    disabled={!seleccionable}
                    accessibilityRole="button"
                    {...etiquetaMobile(
                      `${t.nombre}, ${formatearPrecio(t.precio)}, ${t.disponibles} disponibles${t.descripcion ? `, ${t.descripcion}` : ""}`,
                    )}
                    accessibilityHint={seleccionable ? "Elige este tipo de entrada" : undefined}
                    {...estadoPresionado(seleccionado)}
                    onPress={() => {
                      setTipoElegido(t.id);
                      setCantidad(1);
                    }}
                    style={styles.tipoFila}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tipoNombre}>{t.nombre}</Text>
                      <Text style={styles.disponibles}>
                        {t.disponibles} disponibles{t.descripcion ? ` · ${t.descripcion}` : ""}
                      </Text>
                    </View>
                    <Text style={styles.tipoPrecio}>{formatearPrecio(t.precio)}</Text>
                  </Pressable>
                  {seleccionado && (
                    <View style={styles.cantidad}>
                      <Text style={texto.secundario}>Cantidad</Text>
                      <Contador
                        valor={cantidad}
                        maximo={maximo}
                        onCambiar={setCantidad}
                        etiqueta={`Cantidad de ${t.nombre}`}
                      />
                    </View>
                  )}
                </View>
              );
            })}

            {tipo && puedeComprar && (
              <CampoCupon
                eventoId={evento.id}
                tipo={tipo}
                cantidad={cantidad}
                aplicado={cupon}
                onCambiar={setCupon}
              />
            )}

            {evento.yaSeRealizo && <Text style={styles.aviso}>Este evento ya se realizó.</Text>}
            {evento.yaSeRealizo && (
              <ReseniasDeEsteEvento
                eventoId={evento.id}
                onVerTodas={() => router.push(`/evento/${evento.id}/resenias`)}
              />
            )}
            {!usuario && <Text style={styles.aviso}>Ingresá como comprador para comprar.</Text>}

            <Pressable
              onPress={() => router.push(`/organizador/${evento.organizador.id}`)}
              style={styles.organizador}
              accessibilityRole="button"
              {...etiquetaMobile(
                `Organiza ${nombreCompleto(evento.organizador)}. ${
                  evento.organizador.puntajePromedio
                    ? `Puntaje ${String(evento.organizador.puntajePromedio).replace(".", ",")} de 5, ${evento.organizador.cantidadResenias} reseñas`
                    : "Sin reseñas todavía"
                }`,
              )}
              accessibilityHint="Abre todas las reseñas del organizador"
            >
              <Avatar usuario={evento.organizador} oscuro />
              <View style={{ flex: 1 }}>
                <Text style={texto.cuerpoFuerte}>{nombreCompleto(evento.organizador)}</Text>
                <View style={[styles.fila, { marginTop: 2 }]}>
                  <Estrellas valor={evento.organizador.puntajePromedio ?? 0} tamanio={13} />
                  <Text style={texto.chico}>
                    {evento.organizador.puntajePromedio
                      ? `${evento.organizador.puntajePromedio} · ${evento.organizador.cantidadResenias} reseñas`
                      : "Sin reseñas todavía"}
                  </Text>
                </View>
              </View>
              <Text style={styles.ver}>Ver</Text>
            </Pressable>

            {otrasResenias.length > 0 && (
              <View style={styles.resenias}>
                <Titulo nivel={2} style={[texto.etiqueta, { marginBottom: 4 }]}>
                  Reseñas de eventos anteriores
                </Titulo>
                {otrasResenias.slice(0, RESENIAS_VISIBLES).map((resenia, i, lista) => (
                  <ReseniaItem key={resenia.id} resenia={resenia} ultima={i === lista.length - 1} />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {tipo && (
        <View style={[styles.barraCompra, { paddingBottom: bottom + 18 }]}>
          <View style={styles.barraCompraContenido}>
            <View aria-live="polite" accessibilityLiveRegion="polite">
              <Text style={styles.barraDetalle}>
                {cantidad} × {tipo.nombre}
                {cupon ? ` · ${cupon.cupon.codigo}` : ""}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                <Text style={styles.barraTotal}>{formatearPrecio(total)}</Text>
                {cupon && (
                  <Text
                    style={styles.barraSubtotal}
                    accessibilityLabel={`antes ${formatearPrecio(cupon.subtotal)}`}
                  >
                    {formatearPrecio(cupon.subtotal)}
                  </Text>
                )}
              </View>
            </View>
            <Boton
              titulo="Comprar"
              accessibilityHint={`Compra ${cantidad} ${tipo.nombre} por ${formatearPrecio(total)}`}
              variante="acento"
              onPress={confirmarCompra}
              cargando={comprando}
              style={{ paddingHorizontal: 28 }}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function Dato({ etiqueta, valor, detalle }) {
  const { texto } = useTema();
  const styles = useEstilos(crearEstilos);

  return (
    <View style={styles.dato}>
      <Text style={texto.chico}>{etiqueta}</Text>
      <Text style={styles.datoValor}>{valor}</Text>
      {detalle && <Text style={texto.chico}>{detalle}</Text>}
    </View>
  );
}

// D-28: reseñas de este evento (sólo si ya se realizó)
function ReseniasDeEsteEvento({ eventoId, onVerTodas }) {
  const { texto } = useTema();
  const styles = useEstilos(crearEstilos);
  const { datos } = useCarga(() => getReseniasDeEvento(eventoId), [eventoId]);

  if (!datos) return null;
  return (
    <View style={[styles.resenias, { marginBottom: espacio.l }]}>
      <View style={styles.filaEntre}>
        <Titulo nivel={2} style={texto.etiqueta}>
          Reseñas de este evento
        </Titulo>
        {datos.puntajePromedio !== null && (
          <View style={styles.fila}>
            <Estrellas valor={datos.puntajePromedio} tamanio={13} />
            <Text style={texto.chico}>{datos.puntajePromedio}</Text>
          </View>
        )}
      </View>
      {datos.data.length === 0 ? (
        <Text style={[texto.chico, { paddingVertical: espacio.m }]}>
          Todavía nadie calificó este evento.
        </Text>
      ) : (
        datos.data
          .slice(0, RESENIAS_VISIBLES)
          .map((resenia, i, lista) => (
            <ReseniaItem key={resenia.id} resenia={resenia} ultima={i === lista.length - 1} />
          ))
      )}
      {datos.cantidadResenias > RESENIAS_VISIBLES && (
        <Boton
          titulo={`Ver las ${plural(datos.cantidadResenias, "reseña")}`}
          variante="secundario"
          onPress={onVerTodas}
          style={{ marginBottom: 14 }}
        />
      )}
    </View>
  );
}

const crearEstilos = ({ colores, texto }) => ({
  fila: { flexDirection: "row", alignItems: "center", gap: 6 },
  filaEntre: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  botonesFlotantes: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  flotantesDerecha: { flexDirection: "row", gap: espacio.s },
  botonRedondo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colores.fondo,
    alignItems: "center",
    justifyContent: "center",
  },
  hoja: {
    marginTop: -26,
    backgroundColor: colores.fondo,
    borderTopLeftRadius: radio.xl,
    borderTopRightRadius: radio.xl,
  },
  contenido: {
    padding: espacio.xl,
    paddingTop: 24,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  nombre: {
    fontFamily: fuentes.titulo,
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: -0.8,
    color: colores.texto,
    marginTop: 6,
    marginBottom: espacio.l,
  },
  datos: { flexDirection: "row", gap: 10, marginBottom: espacio.l },
  dato: {
    flex: 1,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.m,
    padding: 12,
    gap: 2,
  },
  datoValor: { fontFamily: fuentes.negrita, fontSize: 15, color: colores.texto },
  descripcion: { ...texto.cuerpo, lineHeight: 22, marginBottom: espacio.xl },
  tipo: {
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.m,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  tipoFila: { flexDirection: "row", alignItems: "center", gap: espacio.m, minHeight: 44 },
  tipoSeleccionado: { borderWidth: 2, borderColor: colores.texto },
  tipoAgotado: {
    backgroundColor: colores.apagado,
    borderColor: colores.apagado,
  },
  tipoFilaAgotado: { flexDirection: "row", alignItems: "center", gap: 10 },
  tipoNombre: { fontFamily: fuentes.negrita, fontSize: 16, color: colores.texto },
  disponibles: { fontFamily: fuentes.texto, fontSize: 13, color: colores.exito },
  tipoPrecio: { fontFamily: fuentes.negrita, fontSize: 16, color: colores.texto },
  tachado: { color: colores.textoSecundario, textDecorationLine: "line-through" },
  cantidad: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderTopColor: colores.troquel,
    marginTop: 12,
    paddingTop: 10,
  },
  aviso: { ...texto.secundario, fontStyle: "italic", marginVertical: espacio.s },
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
  canceladoTitulo: { fontFamily: fuentes.negrita, fontSize: 15, color: colores.error },
  accionesOrganizador: { gap: espacio.s, marginBottom: espacio.xl },
  filaAcciones: { flexDirection: "row", flexWrap: "wrap", gap: espacio.s },
  organizador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.m,
    padding: 14,
    marginTop: espacio.l,
  },
  ver: { fontFamily: fuentes.negrita, fontSize: 14, color: colores.texto },
  resenias: {
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.m,
    paddingHorizontal: 14,
    paddingTop: 14,
    marginTop: 10,
  },
  barraCompra: { backgroundColor: colores.panel, paddingTop: 16, paddingHorizontal: espacio.xl },
  barraCompraContenido: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  barraDetalle: { fontFamily: fuentes.texto, fontSize: 13, color: colores.sobrePanelSuave },
  barraTotal: { fontFamily: fuentes.titulo, fontSize: 26, color: colores.sobrePanel },
  barraSubtotal: {
    fontFamily: fuentes.texto,
    fontSize: 15,
    color: colores.sobrePanelSuave,
    textDecorationLine: "line-through",
  },
});
