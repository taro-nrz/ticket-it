import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getUsuarioActual, login, registrarse } from "../api/api.js";
import { registrarRechazoDeSesion, setToken } from "../api/cliente.js";
import { avisarError } from "../utils/confirmar.js";
import { borrarToken, guardarToken, leerToken } from "./almacenSesion.js";

// Crear contexto
const SesionContext = createContext();

// usar el contexto en un wrapper (mismo patrón que useCartContext de clase)
export const useSesion = () => useContext(SesionContext);

// D-29: sesión con JWT. El token se guarda en el dispositivo y al abrir la app se valida con /auth/me.
export const SesionProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const limpiar = useCallback(async () => {
    setToken(null);
    setUsuario(null);
    await borrarToken().catch(() => {});
  }, []);

  // Al abrir la app, recupera la sesión anterior si el token todavía es válido
  useEffect(() => {
    const restaurar = async () => {
      try {
        const token = await leerToken();
        if (token) {
          setToken(token);
          setUsuario(await getUsuarioActual());
        }
      } catch (_error) {
        await limpiar();
      } finally {
        setCargando(false);
      }
    };
    restaurar();
  }, [limpiar]);

  // Si el backend rechaza el token en medio del uso, se cierra la sesión y se explica por qué
  useEffect(() => {
    registrarRechazoDeSesion(async (mensaje) => {
      await limpiar();
      avisarError("Tu sesión terminó", mensaje ?? "Volvé a ingresar con tu email y contraseña.");
    });
    return () => registrarRechazoDeSesion(null);
  }, [limpiar]);

  const guardarSesion = async ({ token, usuario: usuarioDeLaSesion }) => {
    setToken(token);
    await guardarToken(token);
    setUsuario(usuarioDeLaSesion);
    return usuarioDeLaSesion;
  };

  const ingresar = async (email, password) => guardarSesion(await login(email, password));

  const crearCuenta = async (datosRegistro) => guardarSesion(await registrarse(datosRegistro));

  const cerrarSesion = limpiar;

  // Para cuando el usuario cambia sus datos (perfil)
  const actualizarUsuario = (cambios) => setUsuario((actual) => ({ ...actual, ...cambios }));

  const esComprador = usuario?.rol === "COMPRADOR";
  const esOrganizador = usuario?.rol === "ORGANIZADOR";

  return (
    <SesionContext.Provider
      value={{
        usuario,
        cargando,
        esComprador,
        esOrganizador,
        ingresar,
        crearCuenta,
        cerrarSesion,
        actualizarUsuario,
      }}
    >
      {children}
    </SesionContext.Provider>
  );
};
