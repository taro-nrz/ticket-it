import { useRef, useState } from "react";
import { anunciar } from "../utils/accesibilidad.js";
import { plural } from "../utils/formato.js";

// D-46: custom hook para los formularios (como useForm de la rama evolutivo-9 de clase).
// Junta lo que repetían los 7 formularios de la app:
// - valores controlados y `cambiar(campo)` para el onChangeText de cada campo
// - errores de validación propios + los que manda el backend por campo ({ errores: [{ campo, mensaje }] })
// - los errores se muestran recién después del primer intento de envío
// - al enviar con errores: foco en el primer campo con error y anuncio al lector de pantalla (pauta 9)
// - `enviando` mientras espera al backend y `errorGeneral` si el error no es de un campo
//
// Uso:
//   const form = useFormulario({ inicial, validar, alEnviar });
//   <Campo ref={form.registrar("email")} value={form.valores.email}
//          onChangeText={form.cambiar("email")} error={form.error("email")} />
//   <Boton onPress={form.enviar} cargando={form.enviando} />
export function useFormulario({
  inicial,
  validar = () => ({}),
  alEnviar,
  alFallar, // opcional: reemplaza el manejo de errores del backend (ej. mostrar un diálogo)
  palabra = "campo", // "campo" o "dato": se usa en el anuncio y en el resumen
  nombres, // opcional: { campo: "nombre legible" } o función, para el resumen de errores
}) {
  const [valores, setValores] = useState(inicial);
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [erroresServidor, setErroresServidor] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const campos = useRef({});

  const errores = { ...validar(valores), ...erroresServidor };
  const camposConError = Object.keys(errores);
  const error = (campo) => (intentoEnviar ? errores[campo] : undefined);

  // `formato` permite transformar lo que se escribe (ej. agrupar el número de tarjeta de a 4)
  const cambiar =
    (campo, formato = (valor) => valor) =>
    (valor) => {
      setValores((actuales) => ({ ...actuales, [campo]: formato(valor) }));
      setErroresServidor(({ [campo]: _quitado, ...resto }) => resto);
      setErrorGeneral(null);
    };

  const registrar = (campo) => (elemento) => {
    campos.current[campo] = elemento;
  };
  const enfocar = (campo) => campos.current[campo]?.focus();

  // Los campos del backend pueden venir anidados ("tarjeta.numero"): se usa el último tramo
  const erroresPorCampo = (e) =>
    Object.fromEntries(
      (e.errores ?? [])
        .map((err) => [err.campo.split(".").at(-1), err.mensaje])
        .filter(([campo]) => campo in valores),
    );

  const enviar = async () => {
    setIntentoEnviar(true);
    if (camposConError.length > 0) {
      enfocar(camposConError.find((campo) => campos.current[campo]) ?? camposConError[0]);
      anunciar(`Hay ${plural(camposConError.length, palabra)} para corregir`);
      return;
    }
    setEnviando(true);
    try {
      await alEnviar(valores);
    } catch (e) {
      if (alFallar) return alFallar(e);
      const porCampo = erroresPorCampo(e);
      if (Object.keys(porCampo).length > 0) {
        setErroresServidor(porCampo);
        enfocar(Object.keys(porCampo)[0]);
      } else {
        setErrorGeneral(e.message);
      }
    } finally {
      setEnviando(false);
    }
  };

  // Vuelve al estado inicial (o a otros valores), por ejemplo después de crear algo
  const reiniciar = (nuevos = inicial) => {
    setValores(nuevos);
    setIntentoEnviar(false);
    setErroresServidor({});
    setErrorGeneral(null);
  };

  // "Revisá 2 campos: nombre, email." (o el error general del backend)
  const nombreDe = typeof nombres === "function" ? nombres : (campo) => nombres?.[campo] ?? campo;
  const resumen =
    errorGeneral ??
    (intentoEnviar && camposConError.length > 0
      ? `Revisá ${plural(camposConError.length, palabra)}: ${camposConError.map(nombreDe).join(", ")}.`
      : null);

  return {
    valores,
    setValores,
    cambiar,
    error,
    camposConError,
    intentoEnviar,
    registrar,
    enfocar,
    enviar,
    enviando,
    errorGeneral,
    setErrorGeneral,
    resumen,
    reiniciar,
  };
}
