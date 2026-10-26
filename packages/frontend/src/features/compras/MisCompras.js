import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, View } from "react-native";
import { getMisCompras } from "../../api/api.js";
import { CompraCard } from "../../components/CompraCard.js";
import { Encabezado, estilosPantalla } from "../../components/Pantalla.js";
import { Chips, ErrorVista, Vacio } from "../../components/ui.js";
import { useCarga } from "../../hooks/useCarga.js";
import { estadosCompra } from "../../theme.js";
import { BarraCargando, EsqueletoListaEntradas } from "../../components/Carga.js";

const FILTROS = [
  { valor: null, etiqueta: "Todas" },
  ...Object.entries(estadosCompra).map(([valor, info]) => ({ valor, etiqueta: info.corta })),
];

// HU-05: mis compras diferenciando el estado y los días que faltan si está confirmada
export default function MisCompras() {
  const router = useRouter();
  const [estado, setEstado] = useState(null);
  const { datos, cargandoInicial, recargando, demorado, error, recargar, refrescando, refrescar } =
    useCarga(() => getMisCompras(estado ?? undefined), [estado], { alEnfocar: true });

  return (
    <View style={{ flex: 1 }}>
      <Encabezado titulo="Mis entradas">
        <Chips
          opciones={FILTROS}
          seleccionada={estado}
          onSeleccionar={setEstado}
          etiqueta="Filtrar entradas por estado"
        />
      </Encabezado>
      {error ? (
        <ErrorVista error={error} onReintentar={recargar} />
      ) : cargandoInicial ? (
        // Fuera de la lista: una zona desplazable sin nada enfocable no es accesible con teclado
        <View style={[estilosPantalla.contenido, { flex: 1 }]}>
          <EsqueletoListaEntradas demorado={demorado} onReintentar={recargar} />
        </View>
      ) : (
        <>
          <BarraCargando activa={recargando} />
          <FlatList
            data={datos?.data ?? []}
            refreshing={refrescando}
            onRefresh={refrescar}
            keyExtractor={(compra) => String(compra.id)}
            contentContainerStyle={[estilosPantalla.contenido, { paddingTop: 10 }]}
            renderItem={({ item }) => (
              <CompraCard compra={item} onPress={() => router.push(`/compra/${item.id}`)} />
            )}
            ListEmptyComponent={
              <Vacio icono="ticket-outline" mensaje="No tenés entradas en este estado" />
            }
          />
        </>
      )}
    </View>
  );
}
