import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { getReseniasDeOrganizador } from "../../api/api.js";
import { BarraVolver, Pantalla } from "../../components/Pantalla.js";
import { ReseniaItem } from "../../components/ReseniaItem.js";
import {
  Avatar,
  Cargando,
  ErrorVista,
  Estrellas,
  Tarjeta,
  Titulo,
  Vacio,
} from "../../components/ui.js";
import { useCarga } from "../../hooks/useCarga.js";
import { useSesion } from "../../store/SesionContext.js";
import { espacio, fuentes } from "../../theme.js";
import { nombreCompleto, plural } from "../../utils/formato.js";
import { useTema } from "../../store/TemaContext.js";
import { useEstilos } from "../../hooks/useEstilos.js";

// HU-12: reseñas de los eventos anteriores del organizador
export default function ReseniasOrganizador() {
  const { texto } = useTema();
  const styles = useEstilos(crearEstilos);

  const { id } = useLocalSearchParams();
  const { usuario } = useSesion();
  // El organizador también entra acá desde "Mis eventos" para leer sus propias reseñas
  const propias = String(usuario?.id) === String(id);
  const { datos, cargando, error, recargar } = useCarga(() => getReseniasDeOrganizador(id), [id]);

  return (
    <View style={{ flex: 1 }}>
      <BarraVolver
        subtitulo="Reputación"
        titulo={propias ? "Mis reseñas" : "Reseñas del organizador"}
      />
      {cargando ? (
        <Cargando />
      ) : error ? (
        <ErrorVista error={error} onReintentar={recargar} />
      ) : (
        <Pantalla>
          <View
            style={styles.encabezado}
            accessible
            accessibilityLabel={`${nombreCompleto(datos.organizador)}. ${
              datos.organizador.puntajePromedio
                ? `Puntaje promedio ${String(datos.organizador.puntajePromedio).replace(".", ",")} de 5`
                : "Sin puntaje"
            }, ${plural(datos.organizador.cantidadResenias, "reseña")} de eventos anteriores`}
          >
            <Avatar usuario={datos.organizador} claro tamanio={56} />
            <Text style={styles.nombre}>{nombreCompleto(datos.organizador)}</Text>
            <Text style={styles.promedio}>{datos.organizador.puntajePromedio ?? "–"}</Text>
            <Estrellas valor={datos.organizador.puntajePromedio ?? 0} tamanio={22} />
            <Text style={styles.cantidad}>
              {plural(datos.organizador.cantidadResenias, "reseña")} de eventos anteriores
            </Text>
          </View>
          {datos.data.length === 0 ? (
            <Vacio
              icono="chatbubbles-outline"
              mensaje={
                propias
                  ? "Todavía no tenés reseñas: aparecen cuando los compradores califican tus eventos"
                  : "Este organizador todavía no tiene reseñas"
              }
            />
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

const crearEstilos = ({ colores, texto, estados }) => ({
  encabezado: {
    alignItems: "center",
    gap: 6,
    backgroundColor: colores.panel,
    borderRadius: 24,
    paddingVertical: espacio.xxl,
    marginBottom: espacio.xl,
  },
  nombre: { fontFamily: fuentes.subtitulo, fontSize: 20, color: colores.sobrePanel, marginTop: 4 },
  promedio: { fontFamily: fuentes.titulo, fontSize: 48, lineHeight: 52, color: colores.sobrePanel },
  cantidad: { ...texto.chico, color: colores.sobrePanelSuave },
});
