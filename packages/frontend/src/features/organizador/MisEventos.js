import { etiquetaMobile } from "../../utils/accesibilidad.js";
import { Icono } from "../../components/Icono.js";
import { useRouter } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { getMisEventos, getReseniasDeOrganizador } from "../../api/api.js";
import { Encabezado, estilosPantalla } from "../../components/Pantalla.js";
import {
  ErrorVista,
  Estrellas,
  InsigniaSinLeer,
  Progreso,
  Titulo,
  Vacio,
} from "../../components/ui.js";
import { useCarga } from "../../hooks/useCarga.js";
import { useSesion } from "../../store/SesionContext.js";
import { espacio, fuentes, radio } from "../../theme.js";
import {
  fechaParaLector,
  formatearFecha,
  formatearMonto,
  formatearMontoCompacto,
  plural,
  textoSinLeer,
} from "../../utils/formato.js";
import { useTema } from "../../store/TemaContext.js";
import { useEstilos } from "../../hooks/useEstilos.js";
import { BarraCargando, EsqueletoPanelEventos } from "../../components/Carga.js";

// Panel del organizador: sus eventos con el resumen de ventas
export default function MisEventos() {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);

  const router = useRouter();
  const { usuario } = useSesion();
  const { datos, cargandoInicial, recargando, demorado, error, recargar, refrescando, refrescar } =
    useCarga(
      async () => {
        const [eventos, reputacion] = await Promise.all([
          getMisEventos(),
          getReseniasDeOrganizador(usuario.id),
        ]);
        return { eventos, reputacion: reputacion.organizador };
      },
      [usuario.id],
      { alEnfocar: true },
    );

  const eventos = datos?.eventos.data ?? [];
  const recaudado = eventos.reduce((total, evento) => total + evento.ventas.recaudacion, 0);
  const proximos = eventos.filter((evento) => !evento.yaSeRealizo && !evento.cancelado);
  const pasados = eventos.filter((evento) => evento.yaSeRealizo && !evento.cancelado);
  const cancelados = eventos.filter((evento) => evento.cancelado);
  const secciones = [
    ...(proximos.length ? [{ tipo: "titulo", texto: "Próximos" }, ...proximos] : []),
    ...(pasados.length ? [{ tipo: "titulo", texto: "Realizados" }, ...pasados] : []),
    ...(cancelados.length ? [{ tipo: "titulo", texto: "Cancelados" }, ...cancelados] : []),
  ];

  const publicar = (
    <Pressable
      onPress={() => router.push("/crear-evento")}
      accessibilityLabel="Publicar un evento nuevo"
      style={styles.publicar}
      accessibilityRole="button"
    >
      <Icono name="add" size={18} color={colores.sobreAcento} />
      <Text style={styles.publicarTexto}>Publicar</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1 }}>
      <Encabezado
        oscuro
        saludo={`Panel de ${usuario.nombre}`}
        titulo="Mis eventos"
        derecha={publicar}
      >
        <View style={styles.metricas}>
          <Metrica valor={datos?.eventos.total ?? "–"} etiqueta="eventos" />
          <Metrica valor={datos ? formatearMontoCompacto(recaudado) : "–"} etiqueta="recaudado" />
          {/* La reputación lleva a las reseñas que dejaron los compradores (HU-12) */}
          <Metrica
            valor={
              datos?.reputacion.puntajePromedio ? `★ ${datos.reputacion.puntajePromedio}` : "–"
            }
            etiqueta="mis reseñas"
            onPress={() => router.push(`/organizador/${usuario.id}`)}
          />
        </View>
      </Encabezado>
      {error ? (
        <ErrorVista error={error} onReintentar={recargar} />
      ) : cargandoInicial ? (
        // Fuera de la lista: una zona desplazable sin nada enfocable no es accesible con teclado
        <View style={[estilosPantalla.contenido, { flex: 1 }]}>
          <EsqueletoPanelEventos demorado={demorado} onReintentar={recargar} />
        </View>
      ) : (
        <>
          <BarraCargando activa={recargando} />
          <FlatList
            data={secciones}
            refreshing={refrescando}
            onRefresh={refrescar}
            keyExtractor={(item) => (item.tipo === "titulo" ? item.texto : String(item.id))}
            contentContainerStyle={estilosPantalla.contenido}
            renderItem={({ item }) =>
              item.tipo === "titulo" ? (
                <Titulo nivel={2} style={[texto.etiqueta, { marginBottom: 10 }]}>
                  {item.texto}
                </Titulo>
              ) : (
                <EventoVentas
                  evento={item}
                  onVer={() => router.push(`/evento/${item.id}`)}
                  onCompras={() => router.push(`/evento/${item.id}/compras`)}
                  onResenias={() => router.push(`/evento/${item.id}/resenias`)}
                />
              )
            }
            ListEmptyComponent={
              <Vacio icono="calendar-outline" mensaje="Todavía no publicaste eventos" />
            }
          />
        </>
      )}
    </View>
  );
}

function EventoVentas({ evento, onVer, onCompras, onResenias }) {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);

  const { ventas, resenias } = evento;
  return (
    <View style={[styles.evento, (evento.yaSeRealizo || evento.cancelado) && { opacity: 0.8 }]}>
      <Pressable
        onPress={onVer}
        style={styles.eventoArriba}
        accessibilityRole="button"
        {...etiquetaMobile(
          `${evento.nombre}${evento.cancelado ? ", cancelado" : ""}. ${fechaParaLector(evento.fecha)}. ${evento.lugar}. Recaudado ${formatearMonto(ventas.recaudacion)}${ventas.comprasPendientes > 0 ? `. ${ventas.comprasPendientes} compras pendientes de pago` : ""}`,
        )}
        accessibilityHint="Abre el detalle del evento"
      >
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.filaEtiquetas}>
            <View style={styles.fecha}>
              <Text style={styles.fechaTexto}>{formatearFecha(evento.fecha)}</Text>
            </View>
            {evento.cancelado && (
              <View style={styles.etiquetaCancelado}>
                <Text style={styles.etiquetaCanceladoTexto}>Cancelado</Text>
              </View>
            )}
          </View>
          <Text style={texto.titulo}>{evento.nombre}</Text>
          <Text style={texto.chico}>
            {evento.lugar}
            {ventas.comprasPendientes > 0 ? ` · ${ventas.comprasPendientes} pendiente de pago` : ""}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.recaudado}>{formatearMonto(ventas.recaudacion)}</Text>
          <Text style={texto.chico}>recaudado</Text>
        </View>
      </Pressable>
      <View style={{ gap: 6 }}>
        <View style={styles.filaEntre}>
          <Text style={texto.chico}>Vendidas</Text>
          <Text style={texto.cuerpoFuerte}>
            {ventas.entradasVendidas} / {ventas.cupoTotal}
          </Text>
        </View>
        <Progreso
          valor={ventas.entradasVendidas}
          total={ventas.cupoTotal}
          etiqueta={`Entradas vendidas de ${evento.nombre}`}
        />
      </View>
      <Pressable
        onPress={onCompras}
        style={styles.verCompras}
        accessibilityRole="button"
        {...etiquetaMobile(
          `Ver ${ventas.cantidadCompras} compras de ${evento.nombre}${
            ventas.mensajesSinLeer ? `. ${textoSinLeer(ventas.mensajesSinLeer)}` : ""
          }`,
        )}
      >
        <View style={styles.filaAccion}>
          <Text style={texto.cuerpoFuerte}>
            Ver compras ({ventas.cantidadCompras})
            {evento.yaSeRealizo || evento.cancelado ? "" : " y controlar acceso"}
          </Text>
          <InsigniaSinLeer cantidad={ventas.mensajesSinLeer} />
        </View>
        <Icono name="chevron-forward" size={18} color={colores.texto} />
      </Pressable>
      {/* D-28: en los eventos realizados, las reseñas que dejaron los compradores */}
      {evento.yaSeRealizo && (
        <Pressable
          onPress={onResenias}
          style={styles.verCompras}
          accessibilityRole="button"
          {...etiquetaMobile(
            `Ver ${plural(resenias.cantidadResenias, "reseña")} de ${evento.nombre}${
              resenias.puntajePromedio
                ? `, promedio ${String(resenias.puntajePromedio).replace(".", ",")} de 5`
                : ""
            }`,
          )}
        >
          <View style={styles.filaAccion}>
            <Text style={texto.cuerpoFuerte}>Ver reseñas ({resenias.cantidadResenias})</Text>
            {resenias.puntajePromedio !== null && (
              <Estrellas valor={resenias.puntajePromedio} tamanio={13} />
            )}
          </View>
          <Icono name="chevron-forward" size={18} color={colores.texto} />
        </Pressable>
      )}
    </View>
  );
}

function Metrica({ valor, etiqueta, onPress }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);

  const contenido = (
    <>
      <Text style={styles.metricaValor} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
      <View style={styles.metricaPie}>
        <Text style={styles.metricaEtiqueta}>{etiqueta}</Text>
        {onPress && <Icono name="chevron-forward" size={14} color={colores.sobrePanelSuave} />}
      </View>
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.metrica} accessible accessibilityLabel={`${etiqueta}: ${valor}`}>
        {contenido}
      </View>
    );
  }
  // Con acción es un botón: borde visible para que se note que se puede tocar
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      {...etiquetaMobile(`${etiqueta}: ${valor}`)}
      accessibilityHint="Abre las reseñas de tus eventos"
      style={[styles.metrica, styles.metricaBoton]}
    >
      {contenido}
    </Pressable>
  );
}

const crearEstilos = ({ colores }) => ({
  publicar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colores.acento,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  publicarTexto: { fontFamily: fuentes.negrita, fontSize: 14, color: colores.sobreAcento },
  metricas: { flexDirection: "row", gap: 10, marginBottom: 8 },
  metrica: { flex: 1, backgroundColor: colores.panelSuave, borderRadius: 14, padding: 12 },
  metricaValor: { fontFamily: fuentes.titulo, fontSize: 20, color: colores.sobrePanel },
  metricaBoton: { borderWidth: 1, borderColor: colores.sobrePanelSuave, minHeight: 44 },
  metricaPie: { flexDirection: "row", alignItems: "center", gap: 2 },
  metricaEtiqueta: { fontFamily: fuentes.texto, fontSize: 12, color: colores.sobrePanelSuave },
  evento: {
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.l,
    padding: espacio.l,
    gap: 12,
    marginBottom: 14,
  },
  eventoArriba: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  filaEtiquetas: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  etiquetaCancelado: {
    backgroundColor: colores.errorFondo,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  etiquetaCanceladoTexto: { fontFamily: fuentes.negrita, fontSize: 12, color: colores.error },
  fecha: {
    alignSelf: "flex-start",
    backgroundColor: colores.acentoSuave,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  fechaTexto: { fontFamily: fuentes.negrita, fontSize: 12, color: colores.acentoTexto },
  recaudado: { fontFamily: fuentes.negrita, fontSize: 17, color: colores.texto },
  filaEntre: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  filaAccion: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  verCompras: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    paddingTop: 12,
    minHeight: 44,
  },
});
