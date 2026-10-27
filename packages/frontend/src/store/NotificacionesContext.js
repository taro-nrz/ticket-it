import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getResumenNotificaciones } from "../api/api.js";
import { escuchar, useConexionEnVivo } from "../api/tiempoReal.js";
import { useSesion } from "./SesionContext.js";

// Sondeo de respaldo: sólo mientras no hay conexión en vivo (D-45)
const INTERVALO_MS = 15000;

const NotificacionesContext = createContext({ noLeidas: 0, recargar: () => {} });
export const useNotificaciones = () => useContext(NotificacionesContext);

// D-32: cantidad de notificaciones sin leer, compartida por la campana de todas las pantallas.
// D-45: se actualiza en vivo por WebSocket; si no hay conexión, con polling (sólo con una sesión iniciada).
export function NotificacionesProvider({ children }) {
  const { usuario } = useSesion();
  const [noLeidas, setNoLeidas] = useState(0);
  const enVivo = useConexionEnVivo();

  const recargar = useCallback(async () => {
    if (!usuario) return;
    try {
      setNoLeidas((await getResumenNotificaciones()).noLeidas);
    } catch (_error) {
      // si falla una consulta se reintenta en la próxima
    }
  }, [usuario]);

  // D-45: con conexión en vivo, el backend empuja el contador cada vez que cambia
  useEffect(
    () => escuchar("notificaciones:resumen", (resumen) => setNoLeidas(resumen.noLeidas)),
    [],
  );

  useEffect(() => {
    if (!usuario) {
      setNoLeidas(0);
      return;
    }
    // Al conectar (o reconectar) se trae el valor actual por si algo cambió mientras no había conexión
    recargar();
    if (enVivo) return;
    const intervalo = setInterval(recargar, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [usuario, recargar, enVivo]);

  return (
    <NotificacionesContext.Provider value={{ noLeidas, recargar }}>
      {children}
    </NotificacionesContext.Provider>
  );
}
