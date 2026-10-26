import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { getUsuarioActual } from "../api/api.js";
import { setUsuarioId } from "../api/cliente.js";

const CLAVE_USUARIO = "ticket-it:usuarioId";

// Crear contexto
const SesionContext = createContext();

// usar el contexto en un wrapper (mismo patrón que useCartContext de clase)
export const useSesion = () => useContext(SesionContext);

export const SesionProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al abrir la app, recupera el usuario elegido la última vez
  useEffect(() => {
    const restaurar = async () => {
      try {
        const id = await AsyncStorage.getItem(CLAVE_USUARIO);
        if (id) {
          setUsuarioId(id);
          setUsuario(await getUsuarioActual());
        }
      } catch (_error) {
        setUsuarioId(null);
        await AsyncStorage.removeItem(CLAVE_USUARIO);
      } finally {
        setCargando(false);
      }
    };
    restaurar();
  }, []);

  const iniciarSesion = async (usuarioElegido) => {
    setUsuarioId(usuarioElegido.id);
    await AsyncStorage.setItem(CLAVE_USUARIO, String(usuarioElegido.id));
    setUsuario(usuarioElegido);
  };

  const cerrarSesion = async () => {
    setUsuarioId(null);
    await AsyncStorage.removeItem(CLAVE_USUARIO);
    setUsuario(null);
  };

  const esComprador = usuario?.rol === "COMPRADOR";
  const esOrganizador = usuario?.rol === "ORGANIZADOR";

  return (
    <SesionContext.Provider
      value={{ usuario, cargando, esComprador, esOrganizador, iniciarSesion, cerrarSesion }}
    >
      {children}
    </SesionContext.Provider>
  );
};
