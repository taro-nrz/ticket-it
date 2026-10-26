import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

// Después de este tiempo se avisa que está tardando más de lo normal
const MS_DEMORA = 8000;

// Custom hook para cargar datos de la API con estado de carga y error.
// `alEnfocar` recarga cada vez que la pantalla vuelve a estar visible (ej. al volver de un detalle).
export function useCarga(funcionDeCarga, dependencias = [], { alEnfocar = false } = {}) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [refrescando, setRefrescando] = useState(false);
  // D-39: hay una carga en curso (inicial o recarga) y si tardó más de lo esperable
  const [enCurso, setEnCurso] = useState(true);
  const [demorado, setDemorado] = useState(false);
  const temporizador = useRef(null);

  // Las dependencias las define quien usa el hook (ej. [id, filtros])
  const cargar = useCallback(async () => {
    setError(null);
    setEnCurso(true);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setDemorado(true), MS_DEMORA);
    try {
      setDatos(await funcionDeCarga());
    } catch (e) {
      setError(e);
    } finally {
      clearTimeout(temporizador.current);
      setDemorado(false);
      setEnCurso(false);
      setCargando(false);
    }
    // Las dependencias las elige quien llama (como en useEffect); la regla no puede verificarlas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);

  useEffect(() => {
    if (!alEnfocar) {
      setCargando(true);
      cargar();
    }
  }, [cargar, alEnfocar]);

  useFocusEffect(
    useCallback(() => {
      if (alEnfocar) cargar();
    }, [cargar, alEnfocar]),
  );

  // D-35: "deslizar para recargar" en las listas (no muestra el spinner de carga inicial)
  const refrescar = useCallback(async () => {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  }, [cargar]);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  return {
    datos,
    cargando,
    error,
    recargar: cargar,
    setDatos,
    refrescando,
    refrescar,
    // Primera carga (todavía no hay nada que mostrar → esqueleto) y recarga (ya hay datos → barra fina)
    cargandoInicial: cargando && datos === null,
    recargando: enCurso && datos !== null && !refrescando,
    demorado,
  };
}
