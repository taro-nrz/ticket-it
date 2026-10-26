import { Alert, Platform } from "react-native";

// Puente hacia el DialogosProvider (D-23): las pantallas llaman a estas funciones y el provider dibuja
// el modal o el aviso propios. Si el provider todavía no está montado, se usa el diálogo del sistema.
let dialogos = null;

export function registrarDialogos(funciones) {
  dialogos = funciones;
}

// Pide confirmación. Los textos de los botones dicen exactamente qué pasa ("Sí, cancelar la compra").
// opciones: { titulo, mensaje, textoConfirmar, textoCancelar, peligro }
export function confirmar(opciones) {
  if (dialogos) return dialogos.confirmar(opciones);
  const texto = `${opciones.titulo}\n\n${opciones.mensaje ?? ""}`;
  if (Platform.OS === "web") return Promise.resolve(window.confirm(texto));
  return new Promise((resolve) => {
    Alert.alert(opciones.titulo, opciones.mensaje, [
      { text: opciones.textoCancelar ?? "Volver", style: "cancel", onPress: () => resolve(false) },
      { text: opciones.textoConfirmar ?? "Confirmar", onPress: () => resolve(true) },
    ]);
  });
}

// Algo salió bien: aviso no bloqueante que se lee en voz alta
export function avisarExito(mensaje) {
  if (dialogos) return dialogos.avisarExito(mensaje);
  if (Platform.OS === "web") window.alert(mensaje);
  else Alert.alert(mensaje);
}

// Algo salió mal: modal que requiere atención
export function avisarError(titulo, mensaje) {
  if (dialogos) return dialogos.avisarError(titulo, mensaje);
  if (Platform.OS === "web") window.alert(`${titulo}\n\n${mensaje ?? ""}`);
  else Alert.alert(titulo, mensaje);
  return Promise.resolve(true);
}
