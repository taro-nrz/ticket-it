import { ConSesion } from "../src/components/Pantalla.js";
import Notificaciones from "../src/features/notificaciones/Notificaciones.js";

export default function Ruta() {
  return (
    <ConSesion>
      <Notificaciones />
    </ConSesion>
  );
}
