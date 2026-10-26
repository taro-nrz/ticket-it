import { Redirect } from "expo-router";
import { useSesion } from "../src/store/SesionContext.js";

// Punto de entrada: según la sesión y el rol, lleva al login o a las tabs correspondientes
export default function Inicio() {
  const { usuario, esComprador } = useSesion();
  if (!usuario) return <Redirect href="/login" />;
  return <Redirect href={esComprador ? "/explorar" : "/mis-eventos"} />;
}
