import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { getComprasDeEvento } from "../../api/api.js";
import { CompraFila } from "../../components/CompraCard.js";
import { BarraVolver, estilosPantalla } from "../../components/Pantalla.js";
import { Cargando, Chips, ErrorVista, Progreso, Titulo, Vacio } from "../../components/ui.js";
import { useCarga } from "../../hooks/useCarga.js";
import { espacio, estadosCompra, fuentes, radio } from "../../theme.js";
import { useTema } from "../../store/TemaContext.js";
import { useEstilos } from "../../hooks/useEstilos.js";

// HU-06: compras de un evento con su estado y las entradas disponibles de cada tipo
export default function ComprasDeEvento() {
  const { colores, texto, estados } = useTema();
  const styles = useEstilos(crearEstilos);

  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [estado, setEstado] = useState(null);
  const { datos, cargando, error, recargar } = useCarga(
    () => getComprasDeEvento(id, estado ?? undefined),
    [id, estado],
    { alEnfocar: true },
  );

  if (cargando && !datos) return <Cargando />;
  if (error) return <ErrorVista error={error} onReintentar={recargar} />;

  const totalCompras = Object.values(datos.resumenPorEstado).reduce((a, b) => a + b, 0);
  // Sólo se muestran los estados que tienen compras, cada uno con su color
  const filtros = [
    { valor: null, etiqueta: `Todas · ${totalCompras}` },
    ...Object.entries(estadosCompra)
      .filter(([valor]) => datos.resumenPorEstado[valor] > 0)
      .map(([valor, info]) => ({
        ...estados[valor],
        valor,
        etiqueta: `${info.corta} · ${datos.resumenPorEstado[valor]}`,
        color: info.color,
        fondo: info.fondo,
      })),
  ];

  const encabezado = (
    <View>
      <View style={styles.disponibilidad}>
        <Titulo nivel={2} style={texto.seccion}>
          Disponibilidad por tipo
        </Titulo>
        {datos.disponibilidad.map((tipo) => {
          const quedanPocas = !tipo.agotado && tipo.disponibles / tipo.cupo <= 0.1;
          return (
            <View key={tipo.id} style={{ gap: 6 }}>
              <View style={styles.filaEntre}>
                <Text style={texto.cuerpoFuerte}>{tipo.nombre}</Text>
                <Text style={texto.cuerpo}>
                  <Text
                    style={[
                      styles.libres,
                      (tipo.agotado || quedanPocas) && { color: colores.error },
                    ]}
                  >
                    {tipo.agotado ? "Agotado" : tipo.disponibles}
                  </Text>
                  {!tipo.agotado && (
                    <Text style={{ color: colores.textoSecundario }}> de {tipo.cupo} libres</Text>
                  )}
                </Text>
              </View>
              <Progreso
                valor={tipo.vendidas}
                total={tipo.cupo}
                etiqueta={`Vendidas de ${tipo.nombre}`}
                color={tipo.agotado || quedanPocas ? colores.acento : colores.primario}
              />
            </View>
          );
        })}
      </View>
      <Chips
        opciones={filtros}
        seleccionada={estado}
        onSeleccionar={setEstado}
        etiqueta="Filtrar compras por estado"
      />
      <View style={{ height: espacio.l }} />
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <BarraVolver subtitulo="Compras del evento" titulo={datos.evento.nombre} />
      <FlatList
        data={datos.data}
        keyExtractor={(compra) => String(compra.id)}
        contentContainerStyle={estilosPantalla.contenido}
        ListHeaderComponent={encabezado}
        renderItem={({ item }) => (
          <CompraFila compra={item} onPress={() => router.push(`/compra/${item.id}`)} />
        )}
        ListEmptyComponent={
          <Vacio icono="receipt-outline" mensaje="No hay compras en este estado" />
        }
      />
    </View>
  );
}

const crearEstilos = ({ colores, texto, estados }) => ({
  disponibilidad: {
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.l,
    padding: espacio.l,
    gap: 14,
    marginBottom: espacio.l,
  },
  filaEntre: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  libres: { fontFamily: fuentes.negrita, color: colores.texto },
});
