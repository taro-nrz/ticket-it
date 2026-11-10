import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, View } from "react-native";
import { getMisCompras } from "../../service/comprasService.js";
import { CompraCard } from "../../components/compraCard/CompraCard.jsx";
import { Encabezado } from "../../components/encabezado/Encabezado.jsx";
import { estilosPantalla } from "../../components/pantalla/Pantalla.jsx";
import { Chips } from "../../components/chips/Chips.jsx";
import { ErrorVista } from "../../components/estados/ErrorVista.jsx";
import { Vacio } from "../../components/estados/Vacio.jsx";
import { useCarga } from "../../hooks/useCarga.js";
import { estadosCompra } from "../../theme.js";
import { BarraCargando } from "../../components/carga/BarraCargando.jsx";
import { EsqueletoListaEntradas } from "../../components/carga/Esqueletos.jsx";

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
