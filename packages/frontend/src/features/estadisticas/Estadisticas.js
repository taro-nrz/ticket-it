import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { getEstadisticasEvento } from "../../api/api.js";
import { BarraVolver, Pantalla } from "../../components/Pantalla.js";
import { Boton, ErrorVista, EstadoBadge, Seccion, Tarjeta } from "../../components/ui.js";
import { useCarga } from "../../hooks/useCarga.js";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useTema } from "../../store/TemaContext.js";
import { espacio, fuentes, radio } from "../../theme.js";
import { formatearMonto, formatearMontoCompacto, plural } from "../../utils/formato.js";
import { EsqueletoEstadisticas } from "../../components/Carga.js";

const formatearDia = (texto) => {
  const [, mes, dia] = texto.split("-").map(Number);
  return `${dia}/${mes}`;
};
const porcentaje = (valor) => `${String(valor).replace(".", ",")} %`;

// D-34: panel con los números del evento. Cada gráfico tiene su versión en texto o tabla
// (los valores nunca dependen sólo de la altura o el color de una barra).
export default function Estadisticas() {
  const { texto } = useTema();
  const { id } = useLocalSearchParams();
  const { datos, cargandoInicial, demorado, error, recargar } = useCarga(
    () => getEstadisticasEvento(id),
    [id],
  );

  if (cargandoInicial) {
    return (
      <View style={{ flex: 1 }}>
        <BarraVolver subtitulo="Tu evento" titulo="Estadísticas" />
        <EsqueletoEstadisticas demorado={demorado} onReintentar={recargar} />
      </View>
    );
  }
  if (error) return <ErrorVista error={error} onReintentar={recargar} />;
  const { totales } = datos;

  return (
    <View style={{ flex: 1 }}>
      <BarraVolver subtitulo={datos.evento.nombre} titulo="Estadísticas" />
      <Pantalla>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: espacio.xl }}>
          <Indicador
            valor={formatearMontoCompacto(totales.recaudacion)}
            etiqueta="recaudado"
            detalle={formatearMonto(totales.recaudacion)}
          />
          <Indicador
            valor={porcentaje(totales.ocupacion)}
            etiqueta="de ocupación"
            detalle={`${totales.entradasPagadas} de ${totales.cupoTotal} entradas pagadas`}
          />
          <Indicador
            valor={formatearMontoCompacto(totales.ticketPromedio)}
            etiqueta="por compra"
            detalle={`${plural(totales.compras, "compra")} en total`}
          />
          <Indicador
            valor={porcentaje(totales.tasaCancelacion)}
            etiqueta="canceladas"
            detalle="Compras canceladas o reembolsadas"
          />
          {totales.entradasUtilizadas > 0 && (
            <Indicador
              valor={String(totales.entradasUtilizadas)}
              etiqueta="asistieron"
              detalle="Entradas validadas en la puerta"
            />
          )}
          {totales.puntajePromedio !== null && (
            <Indicador
              valor={`★ ${String(totales.puntajePromedio).replace(".", ",")}`}
              etiqueta="puntaje"
              detalle={plural(totales.cantidadResenias, "reseña")}
            />
          )}
        </View>

        <Seccion titulo="Entradas pagadas por día">
          <VentasPorDia dias={datos.ventasPorDia} />
        </Seccion>

        <Seccion titulo="Por tipo de entrada">
          <Tarjeta style={{ gap: espacio.l }}>
            {datos.porTipo.map((tipo) => (
              <BarraTipo key={tipo.id} tipo={tipo} />
            ))}
          </Tarjeta>
        </Seccion>

        <Seccion titulo="Compras por estado">
          <Tarjeta style={{ gap: 10 }}>
            {Object.entries(datos.porEstado)
              .filter(([, cantidad]) => cantidad > 0)
              .map(([estado, cantidad]) => (
                <View
                  key={estado}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <EstadoBadge estado={estado} />
                  <Text style={texto.cuerpoFuerte}>{cantidad}</Text>
                </View>
              ))}
          </Tarjeta>
        </Seccion>
      </Pantalla>
    </View>
  );
}

// Número destacado (stat tile): el valor grande y debajo qué es
function Indicador({ valor, etiqueta, detalle }) {
  const styles = useEstilos(crearEstilos);
  return (
    <View
      style={styles.indicador}
      accessible
      accessibilityLabel={`${valor} ${etiqueta}. ${detalle}`}
    >
      <Text style={styles.indicadorValor} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
      <Text style={styles.indicadorEtiqueta}>{etiqueta}</Text>
      <Text style={styles.indicadorDetalle}>{detalle}</Text>
    </View>
  );
}

// Columnas por día: un solo dato (sin leyenda, el título lo nombra), etiqueta sólo en el máximo,
// eje X con algunas fechas y una tabla equivalente a un toque
function VentasPorDia({ dias }) {
  const { texto } = useTema();
  const styles = useEstilos(crearEstilos);
  const [verTabla, setVerTabla] = useState(false);
  const maximo = Math.max(...dias.map((dia) => dia.entradas));
  const total = dias.reduce((suma, dia) => suma + dia.entradas, 0);
  const mejor = dias.find((dia) => dia.entradas === maximo);
  const periodo = `del ${formatearDia(dias[0].fecha)} al ${formatearDia(dias.at(-1).fecha)}`;
  const resumen =
    total === 0
      ? `No hubo entradas pagadas ${periodo}.`
      : `${plural(total, "entrada")} pagadas ${periodo}. El mejor día fue el ${formatearDia(mejor.fecha)}, con ${maximo}.`;

  return (
    <Tarjeta>
      <Text style={[texto.secundario, { marginBottom: espacio.m }]}>{resumen}</Text>
      <View
        style={styles.grafico}
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {dias.map((dia) => (
          <View key={dia.fecha} style={styles.columna}>
            {dia.entradas === maximo && maximo > 0 && (
              <Text style={styles.etiquetaMaximo}>{dia.entradas}</Text>
            )}
            <View
              style={[
                styles.barra,
                { height: maximo ? `${(dia.entradas / maximo) * 100}%` : 0 },
                dia.entradas > 0 && { minHeight: 4 },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.ejeX} aria-hidden>
        {[0, Math.floor(dias.length / 2), dias.length - 1].map((i) => (
          <Text key={i} style={texto.chico}>
            {formatearDia(dias[i].fecha)}
          </Text>
        ))}
      </View>
      <Boton
        titulo={verTabla ? "Ocultar tabla" : "Ver como tabla"}
        variante="secundario"
        icono="list-outline"
        onPress={() => setVerTabla(!verTabla)}
        style={{ marginTop: espacio.l }}
      />
      {verTabla && (
        <View
          role="table"
          accessibilityLabel="Entradas pagadas por día"
          style={{ marginTop: espacio.m }}
        >
          <View role="row" style={[styles.fila, styles.filaEncabezado]}>
            <Text role="columnheader" style={[styles.celda, styles.celdaEncabezado]}>
              Día
            </Text>
            <Text role="columnheader" style={[styles.celda, styles.celdaEncabezado, styles.numero]}>
              Entradas
            </Text>
            <Text role="columnheader" style={[styles.celda, styles.celdaEncabezado, styles.numero]}>
              Recaudado
            </Text>
          </View>
          {dias.map((dia) => (
            <View key={dia.fecha} role="row" style={styles.fila}>
              <Text role="cell" style={styles.celda}>
                {formatearDia(dia.fecha)}
              </Text>
              <Text role="cell" style={[styles.celda, styles.numero]}>
                {dia.entradas}
              </Text>
              <Text role="cell" style={[styles.celda, styles.numero]}>
                {formatearMonto(dia.recaudacion)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Tarjeta>
  );
}

function BarraTipo({ tipo }) {
  const { texto } = useTema();
  const styles = useEstilos(crearEstilos);
  const proporcion = tipo.cupo ? tipo.pagadas / tipo.cupo : 0;
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
        <Text style={texto.cuerpoFuerte}>{tipo.nombre}</Text>
        <Text style={texto.secundario}>{formatearMonto(tipo.recaudacion)}</Text>
      </View>
      <View
        style={styles.pista}
        role="progressbar"
        accessibilityLabel={`${tipo.nombre}: ${tipo.pagadas} de ${tipo.cupo} entradas pagadas`}
        aria-valuemin={0}
        aria-valuemax={tipo.cupo}
        aria-valuenow={tipo.pagadas}
      >
        <View
          style={[
            styles.relleno,
            { width: `${proporcion * 100}%` },
            tipo.pagadas > 0 && { minWidth: 4 },
          ]}
        />
      </View>
      <Text style={texto.chico}>
        {tipo.pagadas} de {tipo.cupo} pagadas
        {tipo.vendidas > tipo.pagadas
          ? ` · ${tipo.vendidas - tipo.pagadas} pendientes de pago`
          : ""}
      </Text>
    </View>
  );
}

const crearEstilos = ({ colores }) => ({
  indicador: {
    flexGrow: 1,
    flexBasis: 150,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.m,
    padding: 14,
  },
  indicadorValor: { fontFamily: fuentes.titulo, fontSize: 26, color: colores.texto },
  indicadorEtiqueta: { fontFamily: fuentes.semi, fontSize: 14, color: colores.texto },
  indicadorDetalle: { fontFamily: fuentes.texto, fontSize: 12, color: colores.textoSecundario },
  grafico: {
    height: 140,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  columna: { flex: 1, height: "100%", justifyContent: "flex-end", alignItems: "center" },
  barra: {
    width: "100%",
    maxWidth: 18,
    backgroundColor: colores.dato,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  etiquetaMaximo: {
    fontFamily: fuentes.negrita,
    fontSize: 12,
    color: colores.texto,
    marginBottom: 2,
  },
  ejeX: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  pista: { height: 10, borderRadius: 5, backgroundColor: colores.apagado, overflow: "hidden" },
  relleno: { height: "100%", borderRadius: 5, backgroundColor: colores.dato },
  fila: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
    paddingVertical: 8,
  },
  filaEncabezado: { borderBottomColor: colores.bordeControl },
  celda: { flex: 1, fontFamily: fuentes.texto, fontSize: 14, color: colores.texto },
  celdaEncabezado: { fontFamily: fuentes.negrita },
  numero: { textAlign: "right" },
});
