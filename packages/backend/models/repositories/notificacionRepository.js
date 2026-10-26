import { EstadoNotificacion } from "../entities/notificacion.js";
import { InMemoryRepository } from "./inMemoryRepository.js";

const masRecientePrimero = (a, b) => b.fecha - a.fecha;

export class NotificacionRepository extends InMemoryRepository {
  async findByUsuario(usuarioId, estado) {
    const notificaciones = await this.findBy(
      (notificacion) =>
        notificacion.usuario.id === usuarioId && (!estado || notificacion.estado === estado),
    );
    return notificaciones.sort(masRecientePrimero);
  }

  async contarNoLeidas(usuarioId) {
    return (await this.findByUsuario(usuarioId, EstadoNotificacion.NO_LEIDA)).length;
  }
}
