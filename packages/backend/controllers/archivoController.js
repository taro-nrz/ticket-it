export class ArchivoController {
  constructor(archivoService, config) {
    this.archivoService = archivoService;
    this.config = config;
  }

  async subirImagen(req, res, next) {
    try {
      // La URL pública se arma con PUBLIC_URL si está configurada (detrás de un proxy), o con el host del pedido
      const urlBase = this.config.publicUrl || `${req.protocol}://${req.get("host")}`;
      const imagen = await this.archivoService.guardarImagen(req.file, urlBase);
      res.status(201).json(imagen);
    } catch (error) {
      next(error);
    }
  }
}
