import { View } from "react-native";
import { useEstilos } from "../../hooks/useEstilos.js";
import { espacio, radio } from "../../theme.js";
import { Forma, Esqueleto } from "./Esqueleto.jsx";

// ---------- Esqueletos con la forma de cada pantalla ----------

export function EsqueletoTarjetaEvento() {
  const styles = useEstilos(crearEstilos);
  return (
    <View style={styles.tarjeta}>
      <Forma alto={150} redondeo={0} />
      <View style={{ padding: espacio.l, gap: 10 }}>
        <Forma ancho="30%" alto={10} />
        <Forma ancho="75%" alto={20} />
        <Forma ancho="50%" alto={12} />
        <View style={styles.filaEntre}>
          <Forma ancho="35%" alto={18} />
          <Forma ancho={90} alto={26} redondeo={13} />
        </View>
      </View>
    </View>
  );
}

export function EsqueletoListaEventos({ cantidad = 3, ...props }) {
  return (
    <Esqueleto etiqueta="Cargando eventos" {...props}>
      {Array.from({ length: cantidad }, (_, i) => (
        <EsqueletoTarjetaEvento key={i} />
      ))}
    </Esqueleto>
  );
}

// Entradas con la forma de ticket (Mis entradas)
export function EsqueletoListaEntradas({ cantidad = 4, ...props }) {
  const styles = useEstilos(crearEstilos);
  return (
    <Esqueleto etiqueta="Cargando tus entradas" {...props}>
      {Array.from({ length: cantidad }, (_, i) => (
        <View key={i} style={[styles.tarjeta, styles.ticket]}>
          <Forma ancho={78} alto={110} redondeo={0} />
          <View style={{ flex: 1, padding: espacio.l, gap: 10 }}>
            <Forma ancho={90} alto={20} redondeo={10} />
            <Forma ancho="80%" alto={18} />
            <Forma ancho="55%" alto={12} />
          </View>
        </View>
      ))}
    </Esqueleto>
  );
}

// Filas con avatar (compras de un evento, notificaciones, reseñas)
export function EsqueletoFilas({
  cantidad = 5,
  etiqueta = "Cargando",
  conAvatar = true,
  ...props
}) {
  const styles = useEstilos(crearEstilos);
  return (
    <Esqueleto etiqueta={etiqueta} {...props}>
      {Array.from({ length: cantidad }, (_, i) => (
        <View key={i} style={[styles.tarjeta, styles.fila]}>
          {conAvatar && <Forma ancho={40} alto={40} redondeo={20} />}
          <View style={{ flex: 1, gap: 8 }}>
            <Forma ancho="60%" alto={14} />
            <Forma ancho="85%" alto={12} />
          </View>
        </View>
      ))}
    </Esqueleto>
  );
}

// Panel de "Mis eventos": métricas + tarjetas de ventas
export function EsqueletoPanelEventos(props) {
  const styles = useEstilos(crearEstilos);
  return (
    <Esqueleto etiqueta="Cargando tus eventos" {...props}>
      {[0, 1].map((i) => (
        <View key={i} style={[styles.tarjeta, { padding: espacio.l, gap: 12 }]}>
          <Forma ancho={150} alto={20} redondeo={10} />
          <Forma ancho="70%" alto={20} />
          <Forma ancho="40%" alto={12} />
          <Forma alto={10} redondeo={5} />
          <Forma ancho="55%" alto={16} />
        </View>
      ))}
    </Esqueleto>
  );
}

// Detalle de un evento: portada, título, datos y tipos de entrada
export function EsqueletoDetalleEvento(props) {
  const styles = useEstilos(crearEstilos);
  return (
    <Esqueleto etiqueta="Cargando el evento" {...props}>
      <Forma alto={300} redondeo={0} />
      <View style={{ padding: espacio.xl, gap: 14 }}>
        <Forma ancho="25%" alto={10} />
        <Forma ancho="80%" alto={32} />
        <View style={styles.filaEntre}>
          <Forma ancho="48%" alto={80} redondeo={radio.m} />
          <Forma ancho="48%" alto={80} redondeo={radio.m} />
        </View>
        <Forma alto={12} />
        <Forma ancho="90%" alto={12} />
        <Forma ancho="40%" alto={20} style={{ marginTop: espacio.m }} />
        {[0, 1, 2].map((i) => (
          <Forma key={i} alto={64} redondeo={radio.m} />
        ))}
      </View>
    </Esqueleto>
  );
}

// Detalle de una compra: el ticket y los botones
export function EsqueletoDetalleCompra(props) {
  return (
    <Esqueleto etiqueta="Cargando la compra" {...props}>
      <View style={{ padding: espacio.xl, gap: 14 }}>
        <Forma ancho="40%" alto={24} />
        <Forma alto={260} redondeo={radio.l} />
        <Forma alto={52} redondeo={radio.m} />
        <Forma alto={52} redondeo={radio.m} />
        <Forma ancho="35%" alto={20} style={{ marginTop: espacio.m }} />
        <Forma ancho="70%" alto={14} />
        <Forma ancho="60%" alto={14} />
      </View>
    </Esqueleto>
  );
}

// Chat: burbujas alternadas
export function EsqueletoChat(props) {
  const styles = useEstilos(crearEstilos);
  const burbujas = [
    ["flex-start", "65%"],
    ["flex-end", "50%"],
    ["flex-start", "40%"],
    ["flex-end", "70%"],
  ];
  return (
    <Esqueleto etiqueta="Cargando la conversación" {...props}>
      <View style={{ padding: espacio.xl, gap: 12 }}>
        {burbujas.map(([lado, ancho], i) => (
          <Forma key={i} ancho={ancho} alto={46} redondeo={18} style={{ alignSelf: lado }} />
        ))}
      </View>
      <View style={styles.filaEntre} />
    </Esqueleto>
  );
}

// Estadísticas: indicadores y un gráfico
export function EsqueletoEstadisticas(props) {
  const styles = useEstilos(crearEstilos);
  return (
    <Esqueleto etiqueta="Cargando las estadísticas" {...props}>
      <View style={{ padding: espacio.xl, gap: 12 }}>
        <View style={styles.grilla}>
          {[0, 1, 2, 3].map((i) => (
            <Forma key={i} ancho="48%" alto={96} redondeo={radio.m} />
          ))}
        </View>
        <Forma ancho="50%" alto={20} style={{ marginTop: espacio.m }} />
        <Forma alto={200} redondeo={radio.l} />
      </View>
    </Esqueleto>
  );
}

// Formulario (editar evento, checkout)
export function EsqueletoFormulario({ campos = 5, etiqueta = "Cargando", ...props }) {
  return (
    <Esqueleto etiqueta={etiqueta} {...props}>
      <View style={{ padding: espacio.xl, gap: 10 }}>
        {Array.from({ length: campos }, (_, i) => (
          <View key={i} style={{ gap: 8, marginBottom: 6 }}>
            <Forma ancho="35%" alto={12} />
            <Forma alto={48} redondeo={14} />
          </View>
        ))}
        <Forma alto={52} redondeo={radio.m} style={{ marginTop: espacio.m }} />
      </View>
    </Esqueleto>
  );
}

// Cabecera grande de reputación (reseñas del organizador / de un evento)
export function EsqueletoReputacion(props) {
  const styles = useEstilos(crearEstilos);
  return (
    <Esqueleto etiqueta="Cargando las reseñas" {...props}>
      <View style={{ padding: espacio.xl, gap: 14 }}>
        <Forma alto={210} redondeo={24} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.fila, { paddingVertical: 6 }]}>
            <Forma ancho={32} alto={32} redondeo={16} />
            <View style={{ flex: 1, gap: 8 }}>
              <Forma ancho="45%" alto={13} />
              <Forma ancho="90%" alto={12} />
            </View>
          </View>
        ))}
      </View>
    </Esqueleto>
  );
}

const crearEstilos = ({ colores }) => ({
  tarjeta: {
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.l + 2,
    overflow: "hidden",
    marginBottom: 14,
  },
  ticket: { flexDirection: "row" },
  fila: { flexDirection: "row", alignItems: "center", gap: espacio.m, padding: 14 },
  filaEntre: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  grilla: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
});
