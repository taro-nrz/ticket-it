import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { getReseniasDeEvento } from "../../api/api.js";
import { BarraVolver, Pantalla } from "../../components/Pantalla.js";
import { ReseniaItem } from "../../components/ReseniaItem.js";
import { Cargando, ErrorVista, Estrellas, Tarjeta, Titulo, Vacio } from "../../components/ui.js";
import { useCarga } from "../../hooks/useCarga.js";
import { espacio, fuentes } from "../../theme.js";
import { formatearFecha, plural } from "../../utils/formato.js";
import { useTema } from "../../store/TemaContext.js";
import { useEstilos } from "../../hooks/useEstilos.js";

// D-28: reseñas de un evento en particular (se abre desde "Mis eventos" > Realizados y desde el detalle)
export default function ReseniasEvento() {
  const { texto } = useTema();
  const styles = useEstilos(crearEstilos);

  const { id } = useLocalSearchParams();
  const { datos, cargando, error, recargar } = useCarga(() => getReseniasDeEvento(id), [id]);

  return (
    <View style={{ flex: 1 }}>
      <BarraVolver subtitulo={datos?.evento.nombre ?? "Evento"} titulo="Reseñas del evento" />
      {cargando ? (
        <Cargando />
      ) : error ? (
        <ErrorVista error={error} onReintentar={recargar} />
      ) : (
        <Pantalla>
          <View
            style={styles.encabezado}
            accessible
            accessibilityLabel={`${datos.evento.nombre}, ${formatearFecha(datos.evento.fecha)}. ${
              datos.puntajePromedio
                ? `Puntaje promedio ${String(datos.puntajePromedio).replace(".", ",")} de 5`
                : "Sin puntaje"
            }, ${plural(datos.cantidadResenias, "reseña")}`}
          >
            <Text style={styles.nombre}>{datos.evento.nombre}</Text>
            <Text style={styles.cantidad}>{formatearFecha(datos.evento.fecha)}</Text>
            <Text style={styles.promedio}>{datos.puntajePromedio ?? "–"}</Text>
            <Estrellas valor={datos.puntajePromedio ?? 0} tamanio={22} />
            <Text style={styles.cantidad}>{plural(datos.cantidadResenias, "reseña")}</Text>
          </View>
          {datos.data.length === 0 ? (
            <Vacio icono="chatbubbles-outline" mensaje="Este evento todavía no tiene reseñas" />
          ) : (
            <Tarjeta style={{ paddingVertical: 4 }}>
              <Titulo nivel={2} style={[texto.etiqueta, { marginTop: 12 }]}>
                Reseñas
              </Titulo>
              {datos.data.map((resenia, i) => (
                <ReseniaItem
                  key={resenia.id}
                  resenia={resenia}
                  ultima={i === datos.data.length - 1}
                />
              ))}
            </Tarjeta>
          )}
        </Pantalla>
      )}
    </View>
  );
}

const crearEstilos = ({ colores, texto }) => ({
  encabezado: {
    alignItems: "center",
    gap: 6,
    backgroundColor: colores.panel,
    borderRadius: 24,
    paddingVertical: espacio.xxl,
    paddingHorizontal: espacio.l,
    marginBottom: espacio.xl,
  },
  nombre: {
    fontFamily: fuentes.subtitulo,
    fontSize: 20,
    color: colores.sobrePanel,
    textAlign: "center",
  },
  promedio: { fontFamily: fuentes.titulo, fontSize: 48, lineHeight: 52, color: colores.sobrePanel },
  cantidad: { ...texto.chico, color: colores.sobrePanelSuave },
});
