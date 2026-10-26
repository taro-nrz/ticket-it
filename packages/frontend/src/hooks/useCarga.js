import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";

// Custom hook para cargar datos de la API con estado de carga y error.
// `alEnfocar` recarga cada vez que la pantalla vuelve a estar visible (ej. al volver de un detalle).
export function useCarga(funcionDeCarga, dependencias = [], { alEnfocar = false } = {}) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

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

  return { datos, cargando, error, recargar: cargar, setDatos };
}
