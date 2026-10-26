import { useLocalSearchParams } from "expo-router";
import { getEvento } from "../../api/api.js";
import { Cargando, ErrorVista } from "../../components/ui.js";
import { useCarga } from "../../hooks/useCarga.js";
import CrearEvento from "./CrearEvento.js";

// D-31: editar un evento reutiliza el formulario de publicación con los datos cargados
export default function EditarEvento() {
  const { id } = useLocalSearchParams();
  const { datos: evento, cargando, error, recargar } = useCarga(() => getEvento(id), [id]);

  if (cargando) return <Cargando />;
  if (error) return <ErrorVista error={error} onReintentar={recargar} />;
  return <CrearEvento evento={evento} />;
}
