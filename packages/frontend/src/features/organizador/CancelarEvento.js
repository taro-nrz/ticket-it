import { useState } from "react";
import { Text, View } from "react-native";
import { cancelarEvento } from "../../api/api.js";
import { ModalAccesible } from "../../components/ModalAccesible.js";
import { Boton, Campo } from "../../components/ui.js";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useTema } from "../../store/TemaContext.js";
import { espacio } from "../../theme.js";
import { avisarExito } from "../../utils/confirmar.js";
import { plural } from "../../utils/formato.js";

// D-31: cancelar un evento es destructivo: se explica qué pasa con las compras y se pide el motivo
export function CancelarEvento({ evento, visible, onCerrar, onCancelado }) {
  const { texto } = useTema();
  const styles = useEstilos(crearEstilos);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const confirmar = async () => {
    if (motivo.trim().length < 5) {
      setError("Contá brevemente el motivo (al menos 5 caracteres): lo van a ver los compradores");
      return;
    }
    setEnviando(true);
    try {
      const resultado = await cancelarEvento(evento.id, motivo.trim());
      avisarExito(
        resultado.comprasCanceladas
          ? `Evento cancelado. Se cancelaron ${plural(resultado.comprasCanceladas, "compra")}`
          : "Evento cancelado",
      );
      onCancelado(resultado.evento);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ModalAccesible visible={visible} onCerrar={onCerrar} titulo="¿Cancelar el evento?">
      <Text style={texto.cuerpo}>
        Se van a cancelar todas las compras de «{evento.nombre}» y se reembolsará el dinero de las
        que ya estaban pagadas. El evento deja de verse en el catálogo. Esta acción no se puede
        deshacer.
      </Text>
      <Campo
        etiqueta="Motivo de la cancelación"
        value={motivo}
        onChangeText={(valor) => {
          setMotivo(valor);
          setError(null);
        }}
        error={error}
        ayuda="Lo van a ver los compradores."
        placeholder="Ej: problemas con el lugar"
        multiline
      />
      <View style={styles.acciones}>
        <Boton
          titulo="No, mantener el evento"
          variante="secundario"
          onPress={onCerrar}
          style={styles.accion}
        />
        <Boton
          titulo="Sí, cancelar el evento"
          variante="peligroLleno"
          onPress={confirmar}
          cargando={enviando}
          style={styles.accion}
        />
      </View>
    </ModalAccesible>
  );
}

const crearEstilos = () => ({
  acciones: { flexDirection: "row", flexWrap: "wrap", gap: espacio.s },
  accion: { flexGrow: 1, flexBasis: 160 },
});
