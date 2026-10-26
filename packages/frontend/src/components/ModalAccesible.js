import { useEffect, useId, useRef } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEstilos } from "../hooks/useEstilos.js";
import { espacio } from "../theme.js";
import { Titulo } from "./ui.js";

// Modal propio y accesible (D-23). Sobre el Modal de React Native:
// - web: role="dialog" + aria-modal + foco atrapado + cierre con Esc (react-native-web) y,
//   agregado acá, aria-labelledby con el título y devolución del foco al elemento que lo abrió (WCAG 2.4.3)
// - Android: el botón "atrás" lo cierra (onRequestClose); iOS/Android: el lector queda dentro del modal
export function ModalAccesible({
  visible,
  onCerrar,
  titulo,
  posicion = "centro",
  children,
  cerrarAlTocarFuera = true,
}) {
  const styles = useEstilos(crearEstilos);
  const { bottom } = useSafeAreaInsets();
  const idTitulo = useId();
  const anterior = useRef(null);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    if (visible) {
      anterior.current = document.activeElement;
    } else if (anterior.current) {
      const elemento = anterior.current;
      anterior.current = null;
      setTimeout(() => elemento.focus?.(), 0);
    }
  }, [visible]);

  // El role="dialog" lo pone react-native-web en un contenedor externo: se le da nombre con el título.
  // Callback ref: corre cuando el contenido ya está en el DOM. Se busca por aria-modal porque role="dialog"
  // recién aparece al terminar la animación de entrada.
  const nombrarDialogo = (nodo) => {
    if (Platform.OS !== "web" || !nodo?.closest) return;
    nodo.closest('[aria-modal="true"]')?.setAttribute("aria-labelledby", idTitulo);
  };

  const abajo = posicion === "abajo";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
      statusBarTranslucent
    >
      <View style={[styles.fondo, abajo ? styles.fondoAbajo : styles.fondoCentro]}>
        {/* El fondo oscurecido cierra el modal; no es un control para el lector ni para el teclado */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={cerrarAlTocarFuera ? onCerrar : undefined}
          accessible={false}
          importantForAccessibility="no"
          tabIndex={-1}
          aria-hidden
        />
        <View
          ref={nombrarDialogo}
          accessibilityViewIsModal
          style={[
            styles.contenido,
            abajo ? [styles.hoja, { paddingBottom: bottom + espacio.xl }] : styles.tarjeta,
          ]}
        >
          {abajo && <View style={styles.agarre} aria-hidden />}
          <Titulo nivel={2} nativeID={idTitulo} id={idTitulo} style={styles.titulo}>
            {titulo}
          </Titulo>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const crearEstilos = ({ colores, texto }) => ({
  fondo: { flex: 1, backgroundColor: "rgba(10, 8, 18, 0.6)" },
  fondoCentro: { justifyContent: "center", alignItems: "center", padding: espacio.xl },
  fondoAbajo: { justifyContent: "flex-end" },
  contenido: {
    backgroundColor: colores.superficie,
    borderColor: colores.borde,
    borderWidth: 1,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    gap: espacio.l,
  },
  tarjeta: { borderRadius: 24, padding: espacio.xl },
  hoja: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: espacio.xl,
    paddingTop: espacio.m,
  },
  agarre: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colores.troquel,
  },
  titulo: { ...texto.titulo, fontSize: 21 },
});
