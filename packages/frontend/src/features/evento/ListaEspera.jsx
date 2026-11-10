import { useState } from "react";
import { Text, View } from "react-native";
import { anotarseEnEspera, salirDeEspera } from "../../service/eventosService.js";
import { Icono } from "../../components/icono/Icono.jsx";
import { Boton } from "../../components/boton/Boton.jsx";
import { Contador } from "../../components/contador/Contador.jsx";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useTema } from "../../context/TemaContext.jsx";
import { espacio, radio } from "../../theme.js";
import { formatearHora } from "../../utils/formato.js";
import { useAccion } from "../../hooks/useAccion.js";

// D-40: lista de espera dentro de la tarjeta de un tipo agotado (para compradores)
export function ListaEspera({ evento, tipo, inscripcion, onCambio }) {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);
  const [abierto, setAbierto] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const { ejecutar, enCurso } = useAccion();
  const enviando = enCurso !== null;

  const anotarse = () =>
    ejecutar(
      "ANOTARSE",
      async () => {
        await anotarseEnEspera(evento.id, tipo.id, cantidad);
        setAbierto(false);
        onCambio();
      },
      {
        exito: `Te anotamos en la lista de espera de ${tipo.nombre}. Te avisamos si se libera.`,
        error: "No se pudo anotarte",
      },
    );

  const salir = () =>
    ejecutar(
      "SALIR",
      async () => {
        await salirDeEspera(evento.id, tipo.id);
        onCambio();
      },
      { exito: "Saliste de la lista de espera", error: "No se pudo salir de la lista" },
    );

  if (inscripcion?.estado === "ESPERANDO") {
    return (
      <View style={styles.caja}>
        <View style={styles.fila}>
          <Icono name="hourglass-outline" size={20} color={colores.texto} />
          <View style={{ flex: 1 }}>
            <Text style={texto.cuerpoFuerte}>
              Estás en la lista de espera · puesto {inscripcion.posicion}
            </Text>
            <Text style={texto.chico}>
              Si se liberan{" "}
              {inscripcion.cantidad === 1 ? "una entrada" : `${inscripcion.cantidad} entradas`}, te
              las guardamos 30 minutos y te avisamos.
            </Text>
          </View>
        </View>
        <Boton
          titulo="Salir de la lista"
          variante="secundario"
          onPress={salir}
          cargando={enviando}
          accessibilityHint={`Deja de esperar entradas de ${tipo.nombre}`}
        />
      </View>
    );
  }

  if (!abierto) {
    return (
      <Boton
        titulo="Avisarme si se libera"
        icono="notifications-outline"
        variante="secundario"
        onPress={() => setAbierto(true)}
        accessibilityHint={`Te anota en la lista de espera de ${tipo.nombre}`}
        style={{ marginTop: espacio.s }}
      />
    );
  }

  return (
    <View style={styles.caja}>
      <View style={[styles.fila, { justifyContent: "space-between" }]}>
        <Text style={texto.secundario}>¿Cuántas entradas querés?</Text>
        <Contador
          valor={cantidad}
          maximo={10}
          onCambiar={setCantidad}
          etiqueta={`Entradas de ${tipo.nombre} que esperás`}
        />
      </View>
      <View style={[styles.fila, { flexWrap: "wrap" }]}>
        <Boton
          titulo="Cancelar"
          variante="secundario"
          onPress={() => setAbierto(false)}
          style={styles.accion}
        />
        <Boton titulo="Anotarme" onPress={anotarse} cargando={enviando} style={styles.accion} />
      </View>
    </View>
  );
}

// El primero de la lista tiene entradas guardadas: se le avisa hasta cuándo
export function AvisoPrioridad({ inscripcion }) {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);
  return (
    <View style={[styles.caja, styles.prioridad]} role="note">
      <View style={styles.fila}>
        <Icono name="sparkles-outline" size={20} color={colores.acentoTexto} />
        <Text style={[texto.cuerpoFuerte, { flex: 1 }]}>
          ¡Te guardamos{" "}
          {inscripcion.cantidad === 1 ? "1 entrada" : `${inscripcion.cantidad} entradas`} hasta las{" "}
          {formatearHora(inscripcion.prioridadHasta)}!
        </Text>
      </View>
      <Text style={texto.chico}>
        Elegí este tipo y comprá antes de que pasen al siguiente de la lista.
      </Text>
    </View>
  );
}

const crearEstilos = ({ colores }) => ({
  caja: {
    gap: espacio.s,
    marginTop: espacio.s,
    padding: 12,
    borderRadius: radio.m,
    backgroundColor: colores.superficie,
  },
  prioridad: { backgroundColor: colores.acentoSuave, marginTop: 0, marginBottom: espacio.s },
  fila: { flexDirection: "row", alignItems: "center", gap: 10 },
  accion: { flexGrow: 1, flexBasis: 120 },
});
