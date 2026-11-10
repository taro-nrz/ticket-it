import { useRouter } from "expo-router";
import { FlatList, View } from "react-native";
import { getFavoritos } from "../../service/usuariosService.js";
import { EventoCard } from "../../components/eventoCard/EventoCard.jsx";
import { Encabezado } from "../../components/encabezado/Encabezado.jsx";
import { estilosPantalla } from "../../components/pantalla/Pantalla.jsx";
import { ErrorVista } from "../../components/estados/ErrorVista.jsx";
import { Vacio } from "../../components/estados/Vacio.jsx";
import { useCarga } from "../../hooks/useCarga.js";
import { BarraCargando } from "../../components/carga/BarraCargando.jsx";
import { EsqueletoListaEventos } from "../../components/carga/Esqueletos.jsx";

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
