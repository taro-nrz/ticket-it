import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, View } from "react-native";
import { getMisCompras } from "../../api/api.js";
import { CompraCard } from "../../components/CompraCard.js";
import { Encabezado, estilosPantalla } from "../../components/Pantalla.js";
import { Cargando, Chips, ErrorVista, Vacio } from "../../components/ui.js";
import { useCarga } from "../../hooks/useCarga.js";
import { estadosCompra } from "../../theme.js";

const FILTROS = [
  { valor: null, etiqueta: "Todas" },
  ...Object.entries(estadosCompra).map(([valor, info]) => ({ valor, etiqueta: info.corta })),
];

// HU-05: mis compras diferenciando el estado y los días que faltan si está confirmada
export default function MisCompras() {
  const router = useRouter();
  const [estado, setEstado] = useState(null);
  const { datos, cargando, error, recargar } = useCarga(
    () => getMisCompras(estado ?? undefined),
    [estado],
    { alEnfocar: true },
  );

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
      ) : (
        <FlatList
          data={datos?.data ?? []}
          keyExtractor={(compra) => String(compra.id)}
          contentContainerStyle={[estilosPantalla.contenido, { paddingTop: 10 }]}
          renderItem={({ item }) => (
            <CompraCard compra={item} onPress={() => router.push(`/compra/${item.id}`)} />
          )}
          ListEmptyComponent={
            cargando ? (
              <Cargando />
            ) : (
              <Vacio icono="ticket-outline" mensaje="No tenés entradas en este estado" />
            )
          }
        />
      )}
    </View>
  );
}
