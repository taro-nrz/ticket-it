import { useState } from "react";
import { avisarError, avisarExito } from "../utils/confirmar.js";

// D-46: custom hook para las acciones de un botón que llaman al backend (comprar, cancelar, anotarse…).
// Reemplaza el bloque que se repetía en 9 pantallas: marcar qué acción está en curso (para deshabilitar
// o mostrar "cargando" en su botón), avisar el éxito y, si falla, mostrar el error en un diálogo.
//
// Uso:
//   const { ejecutar, enCurso } = useAccion();
//   const cancelar = () =>
//     ejecutar("CANCELAR", () => cancelarCompra(id), {
//       exito: "Compra cancelada",
//       error: "No se pudo cancelar la compra",
//     });
//   <Boton cargando={enCurso === "CANCELAR"} deshabilitado={enCurso !== null} ... />
//
// `ejecutar` devuelve true si la acción salió bien. Lo que haya que hacer después de un éxito
// (navegar, cerrar un modal) puede ir dentro de la propia acción o después de chequear ese valor.
export function useAccion() {
  const [enCurso, setEnCurso] = useState(null);

  const ejecutar = async (nombre, accion, { exito, error, alFallar } = {}) => {
    setEnCurso(nombre);
    try {
      const resultado = await accion();
      // `exito` puede depender del resultado (y no avisar nada si devuelve null)
      const mensaje = typeof exito === "function" ? exito(resultado) : exito;
      if (mensaje) avisarExito(mensaje);
      return true;
    } catch (e) {
      avisarError(error ?? "No se pudo completar la acción", e.message);
      alFallar?.(e);
      return false;
    } finally {
      setEnCurso(null);
    }
  };

  return { ejecutar, enCurso };
}
