import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icono } from "../components/Icono.js";
import { ModalAccesible } from "../components/ModalAccesible.js";
import { Boton } from "../components/ui.js";
import { useEstilos } from "../hooks/useEstilos.js";
import { espacio, fuentes } from "../theme.js";
import { anunciar } from "../utils/accesibilidad.js";
import { registrarDialogos } from "../utils/confirmar.js";
import { useTema } from "./TemaContext.js";

const DURACION_AVISO_MS = 6000;

const DialogosContext = createContext();
export const useDialogos = () => useContext(DialogosContext);

// D-23: confirmaciones y errores en un modal propio; éxitos en un aviso no bloqueante abajo.
// Reemplaza a window.confirm / Alert.alert: mismo aspecto en web y mobile, con el tema y accesible.
export function DialogosProvider({ children }) {
  const [dialogo, setDialogo] = useState(null);
  const [aviso, setAviso] = useState(null);
  const resolver = useRef(null);

  const confirmar = useCallback(
    (opciones) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setDialogo({ tipo: "confirmar", ...opciones });
      }),
    [],
  );

  const avisarError = useCallback(
    (titulo, mensaje) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setDialogo({ tipo: "error", titulo, mensaje });
      }),
    [],
  );

  const avisarExito = useCallback((mensaje) => {
    setAviso({ mensaje, id: Date.now() });
    anunciar(mensaje);
  }, []);

  const responder = (valor) => {
    setDialogo(null);
    resolver.current?.(valor);
    resolver.current = null;
  };

  // Las funciones de utils/confirmar.js delegan acá (así las pantallas no cambian su forma de llamarlas)
  useEffect(() => {
    registrarDialogos({ confirmar, avisarError, avisarExito });
  }, [confirmar, avisarError, avisarExito]);

  return (
    <DialogosContext.Provider value={{ confirmar, avisarError, avisarExito }}>
      {children}
      <Dialogo dialogo={dialogo} onResponder={responder} />
      <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />
    </DialogosContext.Provider>
  );
}

function Dialogo({ dialogo, onResponder }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);
  const esError = dialogo?.tipo === "error";

  return (
    <ModalAccesible
      visible={!!dialogo}
      titulo={dialogo?.titulo ?? ""}
      onCerrar={() => onResponder(false)}
      cerrarAlTocarFuera={!esError}
    >
      {dialogo && (
        <>
          <View style={styles.cuerpo}>
            {(esError || dialogo.peligro) && (
              <View style={[styles.icono, esError && { backgroundColor: colores.errorFondo }]}>
                <Icono
                  name={esError ? "alert-circle" : "warning-outline"}
                  size={26}
                  color={esError ? colores.error : colores.acentoTexto}
                />
              </View>
            )}
            {!!dialogo.mensaje && (
              <Text style={styles.mensaje} role={esError ? "alert" : undefined}>
                {dialogo.mensaje}
              </Text>
            )}
          </View>
          {esError ? (
            <Boton titulo="Entendido" onPress={() => onResponder(true)} />
          ) : (
            <View style={styles.acciones}>
              {/* El botón seguro primero: es el que recibe el foco al abrir */}
              <Boton
                titulo={dialogo.textoCancelar ?? "Volver"}
                variante="secundario"
                onPress={() => onResponder(false)}
                style={styles.accion}
              />
              <Boton
                titulo={dialogo.textoConfirmar ?? "Confirmar"}
                variante={dialogo.peligro ? "peligroLleno" : "primario"}
                onPress={() => onResponder(true)}
                style={styles.accion}
              />
            </View>
          )}
        </>
      )}
    </ModalAccesible>
  );
}

// Aviso de éxito: no bloquea, se lee en voz alta (role="status") y se puede cerrar
function Aviso({ aviso, onCerrar }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);
  const { bottom } = useSafeAreaInsets();

  useEffect(() => {
    if (!aviso) return;
    const temporizador = setTimeout(onCerrar, DURACION_AVISO_MS);
    return () => clearTimeout(temporizador);
  }, [aviso, onCerrar]);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.avisoContenedor, { bottom: bottom + 86 }]}
      role="status"
      aria-live="polite"
    >
      {aviso && (
        <View style={styles.aviso}>
          <Icono name="checkmark-circle" size={22} color={colores.exito} />
          <Text style={styles.avisoTexto}>{aviso.mensaje}</Text>
          <Pressable
            onPress={onCerrar}
            accessibilityRole="button"
            accessibilityLabel="Cerrar aviso"
            style={styles.avisoCerrar}
          >
            <Icono name="close" size={20} color={colores.sobrePrimario} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const crearEstilos = ({ colores, texto }) => ({
  cuerpo: { flexDirection: "row", gap: espacio.m, alignItems: "flex-start" },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colores.acentoSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  mensaje: { ...texto.cuerpo, flex: 1, lineHeight: 22, alignSelf: "center" },
  // Mismo orden visual y de foco (WCAG 1.3.2 / 2.4.3): primero la opción segura, después la acción
  acciones: { flexDirection: "row", flexWrap: "wrap", gap: espacio.s },
  accion: { flexGrow: 1, flexBasis: 140 },
  avisoContenedor: {
    position: "absolute",
    left: espacio.l,
    right: espacio.l,
    alignItems: "center",
  },
  aviso: {
    width: "100%",
    maxWidth: 520,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colores.primario,
    borderRadius: 16,
    paddingLeft: 16,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  avisoTexto: { flex: 1, fontFamily: fuentes.semi, fontSize: 15, color: colores.sobrePrimario },
  avisoCerrar: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
