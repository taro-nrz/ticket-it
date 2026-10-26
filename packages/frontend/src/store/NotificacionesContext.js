import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getResumenNotificaciones } from "../api/api.js";
import { useSesion } from "./SesionContext.js";

const INTERVALO_MS = 15000;

const NotificacionesContext = createContext({ noLeidas: 0, recargar: () => {} });
export const useNotificaciones = () => useContext(NotificacionesContext);

// D-32: cantidad de notificaciones sin leer, compartida por la campana de todas las pantallas.
// Se actualiza con polling (como el chat), sólo mientras hay una sesión iniciada.
export function NotificacionesProvider({ children }) {
  const { usuario } = useSesion();
  const [noLeidas, setNoLeidas] = useState(0);

  const recargar = useCallback(async () => {
    if (!usuario) return;
    try {
      setNoLeidas((await getResumenNotificaciones()).noLeidas);
    } catch (_error) {
      // si falla una consulta se reintenta en la próxima
    }
  }, [usuario]);

  useEffect(() => {
    if (!usuario) {
      setNoLeidas(0);
      return;
    }
    recargar();
    const intervalo = setInterval(recargar, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [usuario, recargar]);

  return (
    <NotificacionesContext.Provider value={{ noLeidas, recargar }}>
      {children}
    </NotificacionesContext.Provider>
  );
}
