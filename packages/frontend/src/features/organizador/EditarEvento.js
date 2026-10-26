import { useLocalSearchParams } from "expo-router";
import { getEvento } from "../../api/api.js";
import { ErrorVista } from "../../components/ui.js";
import { useCarga } from "../../hooks/useCarga.js";
import CrearEvento from "./CrearEvento.js";
import { EsqueletoFormulario } from "../../components/Carga.js";
import { View } from "react-native";
import { BarraVolver } from "../../components/Pantalla.js";

// D-31: editar un evento reutiliza el formulario de publicación con los datos cargados
export default function EditarEvento() {
  const { id } = useLocalSearchParams();
  const {
    datos: evento,
    cargandoInicial,
    demorado,
    error,
    recargar,
  } = useCarga(() => getEvento(id), [id]);

  if (cargandoInicial) {
    return (
      <View style={{ flex: 1 }}>
        <BarraVolver subtitulo="Tu evento" titulo="Editar evento" />
        <EsqueletoFormulario
          campos={6}
          etiqueta="Cargando los datos del evento"
          demorado={demorado}
          onReintentar={recargar}
        />
      </View>
    );
  }
  if (error) return <ErrorVista error={error} onReintentar={recargar} />;
  return <CrearEvento evento={evento} />;
}
