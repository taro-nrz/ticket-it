import { Icono } from "../../components/Icono.js";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
import { TituloPagina } from "../../components/Pantalla.js";
import {
  Avatar,
  Boton,
  Cargando,
  Contador,
  ErrorVista,
  Estrellas,
  Titulo,
} from "../../components/ui.js";
import { estadoPresionado, etiquetaMobile } from "../../utils/accesibilidad.js";
import { useCarga } from "../../hooks/useCarga.js";
import { useSesion } from "../../store/SesionContext.js";
import { espacio, fuentes, radio } from "../../theme.js";
import { avisarError } from "../../utils/confirmar.js";
import { formatearFecha, formatearPrecio, nombreCompleto, plural } from "../../utils/formato.js";
import { useTema } from "../../store/TemaContext.js";
import { useEstilos } from "../../hooks/useEstilos.js";

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
    cargando,
    error,
    recargar,
    setDatos,
  } = useCarga(() => getEvento(id), [id], { alEnfocar: true });
  const [tipoElegido, setTipoElegido] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [comprando, setComprando] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  if (cargando && !evento) return <Cargando />;
  if (error) return <ErrorVista error={error} onReintentar={recargar} />;

  const esMiEvento = usuario?.id === evento.organizador.id;
  const tipo = evento.tiposEntrada.find((t) => t.id === tipoElegido);
  const maximo = tipo ? Math.min(tipo.disponibles, MAX_POR_COMPRA) : 1;
  const puedeComprar = esComprador && !evento.yaSeRealizo && !evento.cancelado;
  // Si el evento ya pasó, sus reseñas tienen su propia sección: acá van las de los otros eventos
  const otrasResenias = evento.ultimasResenias.filter((r) => r.evento.id !== evento.id);

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

  const confirmarCompra = async () => {
    setComprando(true);
    try {
      const compra = await comprar(evento.id, tipo.id, cantidad);
      setTipoElegido(null);
      setCantidad(1);
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
              const seleccionable = puedeComprar && !t.agotado;
              if (t.agotado) {
                return (
                  <View
                    key={t.id}
                    style={[styles.tipo, styles.tipoAgotado]}
                    accessible
                    accessibilityLabel={`${t.nombre}, ${formatearPrecio(t.precio)}, agotado`}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tipoNombre, { color: colores.textoSecundario }]}>
                        {t.nombre}
                      </Text>
                      <Text style={texto.chico}>Agotado</Text>
                    </View>
                    <Text style={[styles.tipoPrecio, styles.tachado]}>
                      {formatearPrecio(t.precio)}
                    </Text>
                  </View>
                );
              }
              return (
                <View key={t.id} style={[styles.tipo, seleccionado && styles.tipoSeleccionado]}>
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
              </Text>
              <Text style={styles.barraTotal}>{formatearPrecio(tipo.precio * cantidad)}</Text>
            </View>
            <Boton
              titulo="Comprar"
              accessibilityHint={`Compra ${cantidad} ${tipo.nombre} por ${formatearPrecio(tipo.precio * cantidad)}`}
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

const crearEstilos = ({ colores, texto, estados }) => ({
  fila: { flexDirection: "row", alignItems: "center", gap: 6 },
  filaEntre: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  botonesFlotantes: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colores.apagado,
    borderColor: colores.apagado,
  },
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
});
