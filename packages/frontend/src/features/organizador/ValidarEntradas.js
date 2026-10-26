import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Platform, Text, View } from "react-native";
import { getEvento, validarEntrada } from "../../api/api.js";
import { Icono } from "../../components/Icono.js";
import { BarraVolver, Pantalla } from "../../components/Pantalla.js";
import { Boton, Campo, Tarjeta } from "../../components/ui.js";
import { useCarga } from "../../hooks/useCarga.js";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useTema } from "../../store/TemaContext.js";
import { espacio, fuentes, radio } from "../../theme.js";
import { anunciar } from "../../utils/accesibilidad.js";
import { nombreCompleto, plural } from "../../utils/formato.js";

// La cámara sólo se ofrece en el celular; en web (o sin permiso) se escribe el código
const PUEDE_ESCANEAR = Platform.OS !== "web";

// D-33: control de acceso en la puerta. El organizador escanea el QR de la entrada o escribe su código.
export default function ValidarEntradas() {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);
  const { id } = useLocalSearchParams();
  const { datos: evento } = useCarga(() => getEvento(id), [id]);
  const [codigo, setCodigo] = useState("");
  const [resultado, setResultado] = useState(null);
  const [validando, setValidando] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [validadas, setValidadas] = useState(0);
  const [permiso, pedirPermiso] = useCameraPermissions();
  const ultimoEscaneo = useRef(null);
  const campo = useRef(null);

  const validar = async (valor) => {
    const limpio = valor.trim();
    if (!limpio) {
      setResultado({ ok: false, mensaje: "Escribí o escaneá el código de la entrada" });
      campo.current?.focus();
      return;
    }
    setValidando(true);
    try {
      const compra = await validarEntrada(id, limpio);
      const mensaje = `Entrada válida: ${nombreCompleto(compra.comprador)}, ${compra.cantidad} × ${compra.tipoEntrada.nombre}`;
      setResultado({ ok: true, mensaje, compra });
      setValidadas((n) => n + 1);
      setCodigo("");
      anunciar(mensaje);
    } catch (e) {
      setResultado({ ok: false, mensaje: e.message });
      anunciar(`Entrada rechazada: ${e.message}`);
    } finally {
      setValidando(false);
    }
  };

  const empezarEscaneo = async () => {
    if (!permiso?.granted) {
      const respuesta = await pedirPermiso();
      if (!respuesta.granted) {
        setResultado({
          ok: false,
          mensaje: "Sin permiso para la cámara: escribí el código de la entrada.",
        });
        return;
      }
    }
    setResultado(null);
    setEscaneando(true);
  };

  // El lector dispara muchas veces por segundo: se valida cada código una sola vez
  const alEscanear = ({ data }) => {
    if (validando || data === ultimoEscaneo.current) return;
    ultimoEscaneo.current = data;
    setEscaneando(false);
    validar(data);
  };

  return (
    <View style={{ flex: 1 }}>
      <BarraVolver subtitulo={evento?.nombre ?? "Control de acceso"} titulo="Validar entradas" />
      <Pantalla>
        <Text style={[texto.secundario, { marginBottom: espacio.l }]}>
          Escaneá el QR que muestra cada persona o escribí el código de su entrada (por ejemplo
          TK-JUAN-H7Y5). Una entrada válida queda marcada como utilizada.
        </Text>

        {escaneando && (
          <View style={styles.camara}>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={alEscanear}
            />
            <Boton
              titulo="Dejar de escanear"
              variante="secundario"
              onPress={() => setEscaneando(false)}
            />
          </View>
        )}

        {PUEDE_ESCANEAR && !escaneando && (
          <Boton
            titulo="Escanear QR con la cámara"
            icono="camera-outline"
            variante="acento"
            onPress={empezarEscaneo}
            style={{ marginBottom: espacio.l }}
          />
        )}

        <Tarjeta>
          <Campo
            ref={campo}
            etiqueta="Código de la entrada"
            value={codigo}
            onChangeText={(valor) => {
              setCodigo(valor);
              ultimoEscaneo.current = null;
            }}
            placeholder="TK-XXXX-XXXX"
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            returnKeyType="done"
            onSubmitEditing={() => validar(codigo)}
          />
          <Boton
            titulo="Validar entrada"
            icono="checkmark-circle-outline"
            onPress={() => validar(codigo)}
            cargando={validando}
          />
        </Tarjeta>

        {/* El resultado se anuncia: verde y con ícono si pasa, rojo si se rechaza (no sólo por color) */}
        <View aria-live="assertive" accessibilityLiveRegion="assertive">
          {resultado && (
            <View
              style={[styles.resultado, resultado.ok ? styles.resultadoOk : styles.resultadoError]}
            >
              <Icono
                name={resultado.ok ? "checkmark-circle" : "close-circle"}
                size={32}
                color={resultado.ok ? colores.exito : colores.error}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={[
                    styles.resultadoTitulo,
                    { color: resultado.ok ? colores.exito : colores.error },
                  ]}
                >
                  {resultado.ok ? "Puede pasar" : "No puede pasar"}
                </Text>
                <Text style={texto.cuerpo}>{resultado.mensaje}</Text>
              </View>
            </View>
          )}
        </View>

        {validadas > 0 && (
          <Text style={[texto.chico, { textAlign: "center", marginTop: espacio.l }]}>
            Validaste {plural(validadas, "entrada")} en esta sesión.
          </Text>
        )}
      </Pantalla>
    </View>
  );
}

const crearEstilos = ({ colores }) => ({
  camara: {
    height: 360,
    borderRadius: radio.l,
    overflow: "hidden",
    gap: espacio.s,
    marginBottom: espacio.l,
  },
  resultado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radio.l,
    borderWidth: 2,
    padding: espacio.l,
    marginTop: espacio.l,
  },
  resultadoOk: { borderColor: colores.exito, backgroundColor: colores.superficie },
  resultadoError: { borderColor: colores.error, backgroundColor: colores.errorFondo },
  resultadoTitulo: { fontFamily: fuentes.titulo, fontSize: 22 },
});
