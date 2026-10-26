import { Icono } from "../../components/Icono.js";
import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { getCategorias, getEventos } from "../../api/api.js";
import { EventoCard } from "../../components/EventoCard.js";
import { Encabezado, estilosPantalla } from "../../components/Pantalla.js";
import { Boton, Chips, ErrorVista, Vacio } from "../../components/ui.js";
import { BarraCargando, EsqueletoListaEventos } from "../../components/Carga.js";
import { useCarga } from "../../hooks/useCarga.js";
import { useSesion } from "../../store/SesionContext.js";
import { espacio, fuentes } from "../../theme.js";
import { useTema } from "../../store/TemaContext.js";
import { useEstilos } from "../../hooks/useEstilos.js";

const ORDENES = [
  { valor: "fecha:asc", etiqueta: "Próximos" },
  { valor: "precio:asc", etiqueta: "Menor precio" },
  { valor: "precio:desc", etiqueta: "Mayor precio" },
  { valor: "puntaje:desc", etiqueta: "Mejor organizador" },
];

const POR_PAGINA = 10;

// HU-02 (búsqueda textual y por categoría) + HU-03 (orden)
export default function Explorar() {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);

  const router = useRouter();
  const { usuario } = useSesion();
  const [texto_, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState(null);
  const [ordenElegido, setOrdenElegido] = useState(ORDENES[0].valor);
  const [verOrden, setVerOrden] = useState(false);
  const [limite, setLimite] = useState(POR_PAGINA);

  const { datos: categorias } = useCarga(getCategorias);
  const [orden, dir] = ordenElegido.split(":");
  const {
    datos: resultado,
    cargandoInicial,
    recargando,
    demorado,
    error,
    recargar,
    refrescando,
    refrescar,
  } = useCarga(
    () =>
      getEventos({
        texto: busqueda || undefined,
        categoria: categoria ?? undefined,
        orden,
        dir,
        limit: limite,
      }),
    [busqueda, categoria, ordenElegido, limite],
    { alEnfocar: true },
  );

  const buscar = () => {
    setLimite(POR_PAGINA);
    setBusqueda(texto_.trim());
  };

  const limpiar = () => {
    setTexto("");
    setBusqueda("");
  };

  const etiquetaOrden = ORDENES.find((o) => o.valor === ordenElegido).etiqueta;

  const filtros = (
    <View style={styles.filtros}>
      <View style={styles.buscador}>
        <Icono name="search" size={20} color={colores.textoSecundario} />
        <TextInput
          value={texto_}
          onChangeText={setTexto}
          onSubmitEditing={buscar}
          returnKeyType="search"
          placeholder="Artistas, obras, lugares…"
          placeholderTextColor={colores.textoSecundario}
          accessibilityLabel="Buscar eventos"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect={false}
          style={styles.input}
        />
        {texto_.length > 0 && (
          <Pressable
            onPress={limpiar}
            accessibilityRole="button"
            accessibilityLabel="Limpiar búsqueda"
            style={styles.limpiar}
          >
            <Icono name="close-circle" size={20} color={colores.textoSecundario} />
          </Pressable>
        )}
        <Pressable onPress={buscar} style={styles.botonBuscar} accessibilityRole="button">
          <Text style={styles.botonBuscarTexto}>Buscar</Text>
        </Pressable>
      </View>
      {categorias && (
        <Chips
          opciones={[
            { valor: null, etiqueta: "Todas" },
            ...categorias.map((c) => ({ valor: c.id, etiqueta: c.nombre })),
          ]}
          seleccionada={categoria}
          etiqueta="Filtrar por categoría"
          onSeleccionar={(valor) => {
            setLimite(POR_PAGINA);
            setCategoria(valor);
          }}
        />
      )}
      <View style={styles.resumen}>
        {/* Pauta 9: la cantidad de resultados se anuncia cuando cambia */}
        <Text style={texto.chico} aria-live="polite" accessibilityLiveRegion="polite">
          {resultado
            ? `${resultado.total} ${resultado.total === 1 ? "evento" : "eventos"}${busqueda ? ` para "${busqueda}"` : " próximos"}`
            : " "}
        </Text>
        <Pressable
          onPress={() => setVerOrden(!verOrden)}
          style={styles.ordenar}
          accessibilityRole="button"
          aria-expanded={verOrden}
          accessibilityState={{ expanded: verOrden }}
        >
          <Icono name="swap-vertical" size={16} color={colores.texto} />
          <Text style={styles.ordenarTexto}>Ordenar: {etiquetaOrden}</Text>
        </Pressable>
      </View>
      {verOrden && (
        <Chips
          opciones={ORDENES}
          etiqueta="Ordenar eventos por"
          seleccionada={ordenElegido}
          onSeleccionar={(valor) => {
            setOrdenElegido(valor);
            setVerOrden(false);
          }}
        />
      )}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Encabezado saludo={`Hola, ${usuario.nombre}`} titulo="¿Qué salimos a ver?">
        {filtros}
      </Encabezado>
      {error ? (
        <ErrorVista error={error} onReintentar={recargar} />
      ) : cargandoInicial ? (
        // Fuera de la lista: una zona desplazable sin nada enfocable no es accesible con teclado
        <View style={[estilosPantalla.contenido, { flex: 1 }]}>
          <EsqueletoListaEventos demorado={demorado} onReintentar={recargar} />
        </View>
      ) : (
        <>
          <BarraCargando activa={recargando} etiqueta="Buscando eventos" />
          <FlatList
            data={resultado?.data ?? []}
            style={recargando && { opacity: 0.6 }}
            refreshing={refrescando}
            onRefresh={refrescar}
            keyExtractor={(evento) => String(evento.id)}
            contentContainerStyle={[estilosPantalla.contenido, { paddingTop: 4 }]}
            renderItem={({ item }) => (
              <EventoCard evento={item} onPress={() => router.push(`/evento/${item.id}`)} />
            )}
            ListEmptyComponent={
              <Vacio icono="search-outline" mensaje="No encontramos eventos con esos filtros" />
            }
            ListFooterComponent={
              resultado && resultado.data.length < resultado.total ? (
                <Boton
                  titulo="Ver más eventos"
                  variante="secundario"
                  onPress={() => setLimite(limite + POR_PAGINA)}
                  cargando={recargando}
                />
              ) : null
            }
          />
        </>
      )}
    </View>
  );
}

const crearEstilos = ({ colores }) => ({
  filtros: { gap: espacio.m },
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colores.superficie,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colores.borde,
    paddingLeft: 14,
    paddingRight: 5,
    height: 50,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    fontFamily: fuentes.texto,
    color: colores.texto,
  },
  botonBuscar: {
    backgroundColor: colores.primario,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 40,
    justifyContent: "center",
  },
  botonBuscarTexto: { fontFamily: fuentes.negrita, color: colores.sobrePrimario, fontSize: 14 },
  resumen: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ordenar: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44 },
  limpiar: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  ordenarTexto: { fontFamily: fuentes.semi, fontSize: 13, color: colores.texto },
});
