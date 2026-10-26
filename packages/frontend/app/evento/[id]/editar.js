import { ConSesion } from "../../../src/components/Pantalla.js";
import EditarEvento from "../../../src/features/organizador/EditarEvento.js";

export default function Ruta() {
  return (
    <ConSesion>
      <EditarEvento />
    </ConSesion>
  );
}
