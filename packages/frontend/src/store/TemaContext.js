import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform, useColorScheme } from "react-native";
import { estadosDelTema, estilosDeTexto, paletas } from "../theme.js";

const CLAVE_TEMA = "ticket-it:tema";

// Orden en que el botón recorre las preferencias
export const PREFERENCIAS = ["sistema", "claro", "oscuro"];

const TemaContext = createContext();

// Mismo patrón que SesionContext / CartContext de clase
export const useTema = () => useContext(TemaContext);

// D-22: modo claro/oscuro. Por defecto sigue la configuración del sistema; la persona puede fijarlo.
export const TemaProvider = ({ children }) => {
  const esquemaDelSistema = useColorScheme();
  const [preferencia, setPreferenciaEstado] = useState("sistema");

  useEffect(() => {
    AsyncStorage.getItem(CLAVE_TEMA)
      .then((guardada) => {
        if (PREFERENCIAS.includes(guardada)) setPreferenciaEstado(guardada);
      })
      .catch(() => {});
  }, []);

  const setPreferencia = (nueva) => {
    setPreferenciaEstado(nueva);
    AsyncStorage.setItem(CLAVE_TEMA, nueva).catch(() => {});
  };

  const nombre =
    preferencia === "sistema" ? (esquemaDelSistema === "dark" ? "oscuro" : "claro") : preferencia;

  // En web: controles nativos del navegador (scroll, autocompletado) acordes al tema
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.documentElement.style.colorScheme = nombre === "oscuro" ? "dark" : "light";
      document.body.style.backgroundColor = paletas[nombre].fondo;
    }
  }, [nombre]);

  const valor = useMemo(() => {
    const colores = paletas[nombre];
    return {
      nombre,
      esOscuro: nombre === "oscuro",
      colores,
      texto: estilosDeTexto(colores),
      estados: estadosDelTema(nombre),
      preferencia,
      setPreferencia,
    };
    // setPreferencia es estable en la práctica (sólo usa setters)
    // eslint-disable-next-line
  }, [nombre, preferencia]);

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
};
