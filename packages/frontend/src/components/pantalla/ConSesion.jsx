import { Redirect } from "expo-router";
import { useSesion } from "../../context/SesionContext.jsx";

// Protege las pantallas que necesitan un usuario identificado
export function ConSesion({ children }) {
  const { usuario } = useSesion();
  if (!usuario) return <Redirect href="/login" />;
  return children;
}
