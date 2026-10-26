import { ConSesion } from "../../../src/components/Pantalla.js";
import CompraDetalle from "../../../src/features/compras/CompraDetalle.js";

export default function Ruta() {
  return (
    <ConSesion>
      <CompraDetalle />
    </ConSesion>
  );
}
