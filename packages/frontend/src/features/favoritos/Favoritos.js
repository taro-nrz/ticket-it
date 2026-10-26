import { useRouter } from "expo-router";
import { FlatList, View } from "react-native";
import { getFavoritos } from "../../api/api.js";
import { EventoCard } from "../../components/EventoCard.js";
import { Encabezado, estilosPantalla } from "../../components/Pantalla.js";
import { ErrorVista, Vacio } from "../../components/ui.js";
import { useCarga } from "../../hooks/useCarga.js";
import { BarraCargando, EsqueletoListaEventos } from "../../components/Carga.js";

export default function Favoritos() {
  const router = useRouter();
  const { datos, cargandoInicial, recargando, demorado, error, recargar, refrescando, refrescar } =
    useCarga(getFavoritos, [], {
      alEnfocar: true,
    });

  return (
    <View style={{ flex: 1 }}>
      <Encabezado saludo="Guardados para después" titulo="Favoritos" />
      {error ? (
        <ErrorVista error={error} onReintentar={recargar} />
      ) : cargandoInicial ? (
        // Fuera de la lista: una zona desplazable sin nada enfocable no es accesible con teclado
        <View style={[estilosPantalla.contenido, { flex: 1 }]}>
          <EsqueletoListaEventos cantidad={2} demorado={demorado} onReintentar={recargar} />
        </View>
      ) : (
        <>
          <BarraCargando activa={recargando} />
          <FlatList
            data={datos?.data ?? []}
            refreshing={refrescando}
            onRefresh={refrescar}
            keyExtractor={(evento) => String(evento.id)}
            contentContainerStyle={[estilosPantalla.contenido, { paddingTop: 6 }]}
            renderItem={({ item }) => (
              <EventoCard evento={item} onPress={() => router.push(`/evento/${item.id}`)} />
            )}
            ListEmptyComponent={
              <Vacio
                icono="heart-outline"
                mensaje="Todavía no guardaste eventos. Tocá el corazón en el detalle de un evento."
              />
            }
          />
        </>
      )}
    </View>
  );
}
