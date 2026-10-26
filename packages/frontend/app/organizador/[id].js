import { ConSesion } from "../../src/components/Pantalla.js";
import ReseniasOrganizador from "../../src/features/evento/ReseniasOrganizador.js";

export default function Ruta() {
  return (
    <ConSesion>
      <ReseniasOrganizador />
    </ConSesion>
  );
}
