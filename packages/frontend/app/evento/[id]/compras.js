import { ConSesion } from "../../../src/components/Pantalla.js";
import ComprasDeEvento from "../../../src/features/organizador/ComprasDeEvento.js";

export default function Ruta() {
  return (
    <ConSesion>
      <ComprasDeEvento />
    </ConSesion>
  );
}
