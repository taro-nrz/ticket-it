import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";

// Custom hook para cargar datos de la API con estado de carga y error.
// `alEnfocar` recarga cada vez que la pantalla vuelve a estar visible (ej. al volver de un detalle).
export function useCarga(funcionDeCarga, dependencias = [], { alEnfocar = false } = {}) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [refrescando, setRefrescando] = useState(false);

  // Las dependencias las define quien usa el hook (ej. [id, filtros])
  const cargar = useCallback(async () => {
    setError(null);
    try {
      setDatos(await funcionDeCarga());
    } catch (e) {
      setError(e);
    } finally {
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

  return { datos, cargando, error, recargar: cargar, setDatos, refrescando, refrescar };
}
