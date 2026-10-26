import { ConSesion } from "../../../src/components/Pantalla.js";
import EventoDetalle from "../../../src/features/evento/EventoDetalle.js";

export default function Ruta() {
  return (
    <ConSesion>
      <EventoDetalle />
    </ConSesion>
  );
}
