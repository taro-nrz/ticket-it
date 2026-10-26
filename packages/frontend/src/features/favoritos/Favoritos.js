import { useRouter } from "expo-router";
import { FlatList, View } from "react-native";
import { getFavoritos } from "../../api/api.js";
import { EventoCard } from "../../components/EventoCard.js";
import { Encabezado, estilosPantalla } from "../../components/Pantalla.js";
import { Cargando, ErrorVista, Vacio } from "../../components/ui.js";
import { useCarga } from "../../hooks/useCarga.js";

export default function Favoritos() {
  const router = useRouter();
  const { datos, cargando, error, recargar, refrescando, refrescar } = useCarga(getFavoritos, [], {
    alEnfocar: true,
  });

  return (
    <View style={{ flex: 1 }}>
      <Encabezado saludo="Guardados para después" titulo="Favoritos" />
      {error ? (
        <ErrorVista error={error} onReintentar={recargar} />
      ) : (
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
            cargando ? (
              <Cargando />
            ) : (
              <Vacio
                icono="heart-outline"
                mensaje="Todavía no guardaste eventos. Tocá el corazón en el detalle de un evento."
              />
            )
          }
        />
      )}
    </View>
  );
}
