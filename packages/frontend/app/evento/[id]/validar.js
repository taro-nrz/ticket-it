import { ConSesion } from "../../../src/components/Pantalla.js";
import ValidarEntradas from "../../../src/features/organizador/ValidarEntradas.js";

export default function Ruta() {
  return (
    <ConSesion>
      <ValidarEntradas />
    </ConSesion>
  );
}
