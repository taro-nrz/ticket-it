import express from "express";

import routes from "./routes/routes.js";
import { Server } from "./server.js";
import { obtenerConfig } from "./config/config.js";
import { RelojSistema } from "./utils/reloj.js";
import { crearLimiteDeLogin, crearMiddlewaresDeUsuario } from "./middlewares/usuarioMiddleware.js";
import { cargarDatosSemilla, PASSWORD_DEMO } from "./data/seed.js";
import { crearMantenimientoMiddleware } from "./middlewares/mantenimientoMiddleware.js";

import { UsuarioRepository } from "./models/repositories/usuarioRepository.js";
import { CategoriaRepository } from "./models/repositories/categoriaRepository.js";
import { EventoRepository } from "./models/repositories/eventoRepository.js";
import { CompraRepository } from "./models/repositories/compraRepository.js";
import { ReseniaRepository } from "./models/repositories/reseniaRepository.js";
import { NotificacionRepository } from "./models/repositories/notificacionRepository.js";
import { CuponRepository } from "./models/repositories/cuponRepository.js";
import { InscripcionEsperaRepository } from "./models/repositories/inscripcionEsperaRepository.js";
import { ListaEsperaService } from "./services/listaEsperaService.js";
import { ListaEsperaController } from "./controllers/listaEsperaController.js";
import { ArchivoService } from "./services/archivoService.js";
import { ArchivoController } from "./controllers/archivoController.js";
import { EmailSimulado } from "./services/emailService.js";
import { CodigoRecuperacionRepository } from "./models/repositories/codigoRecuperacionRepository.js";
import { PasarelaPagoSimulada } from "./services/pasarelaPago.js";

import { AuthService } from "./services/authService.js";
import { UsuarioService } from "./services/usuarioService.js";
import { CategoriaService } from "./services/categoriaService.js";
import { EventoService } from "./services/eventoService.js";
import { CompraService } from "./services/compraService.js";
import { MensajeService } from "./services/mensajeService.js";
import { ReseniaService } from "./services/reseniaService.js";
import { NotificacionService } from "./services/notificacionService.js";
import { CuponService } from "./services/cuponService.js";

import { AuthController } from "./controllers/authController.js";
import { UsuarioController } from "./controllers/usuarioController.js";
import { CategoriaController } from "./controllers/categoriaController.js";
import { EventoController } from "./controllers/eventoController.js";
import { CompraController } from "./controllers/compraController.js";
import { MensajeController } from "./controllers/mensajeController.js";
import { ReseniaController } from "./controllers/reseniaController.js";
import { NotificacionController } from "./controllers/notificacionController.js";
import { CuponController } from "./controllers/cuponController.js";
import { DevController } from "./controllers/devController.js";

// Arma la aplicación completa (inyección de dependencias manual, como en clase).
// Recibe el reloj para que los tests puedan fijar "ahora".
export async function crearApp({ reloj = new RelojSistema(), config = obtenerConfig() } = {}) {
  const server = new Server(express(), {
    port: config.port,
    allowedOrigins: config.allowedOrigins,
  });

  // ---------- REPOSITORIOS (persistencia en memoria) ----------
  const repositorios = {
    usuarioRepository: new UsuarioRepository(),
    categoriaRepository: new CategoriaRepository(),
    eventoRepository: new EventoRepository(),
    compraRepository: new CompraRepository(),
    reseniaRepository: new ReseniaRepository(),
    notificacionRepository: new NotificacionRepository(),
    cuponRepository: new CuponRepository(),
    inscripcionEsperaRepository: new InscripcionEsperaRepository(),
    codigoRecuperacionRepository: new CodigoRecuperacionRepository(),
  };
  const {
    usuarioRepository,
    categoriaRepository,
    eventoRepository,
    compraRepository,
    reseniaRepository,
    notificacionRepository,
    cuponRepository,
    inscripcionEsperaRepository,
  } = repositorios;

  // ---------- SERVICES ----------
  // D-32: los services avisan al de notificaciones lo que pasó (compras, mensajes, cancelaciones, reseñas)
  const notificacionService = new NotificacionService(notificacionRepository, reloj);
  const listaEsperaService = new ListaEsperaService(
    inscripcionEsperaRepository,
    eventoRepository,
    reloj,
    notificacionService,
  );
  const eventoService = new EventoService(
    eventoRepository,
    categoriaRepository,
    compraRepository,
    reseniaRepository,
    reloj,
    notificacionService,
    listaEsperaService,
  );
  // D-44: el email es simulado (consola + GET /dev/emails); en los tests no se muestra en la consola
  const email = new EmailSimulado({ mostrarEnConsola: config.nodeEnv !== "test" });
  const authService = new AuthService(usuarioRepository, config, {
    codigoRepository: repositorios.codigoRecuperacionRepository,
    email,
    reloj,
  });
  const usuarioService = new UsuarioService(usuarioRepository, eventoService);
  const categoriaService = new CategoriaService(categoriaRepository);
  const compraService = new CompraService(
    compraRepository,
    eventoRepository,
    reseniaRepository,
    reloj,
    config,
    {
      notificaciones: notificacionService,
      pasarelaPago: new PasarelaPagoSimulada(),
      cuponRepository,
      listaEspera: listaEsperaService,
      usuarioRepository,
    },
  );
  const cuponService = new CuponService(cuponRepository, eventoService, reloj);
  const mensajeService = new MensajeService(
    compraService,
    compraRepository,
    reloj,
    notificacionService,
  );
  const reseniaService = new ReseniaService(
    reseniaRepository,
    eventoRepository,
    compraRepository,
    usuarioRepository,
    reloj,
    notificacionService,
  );

  // ---------- DATOS SEMILLA ----------
  // Todos los usuarios demo comparten contraseña: se hashea una sola vez (bcrypt es lento a propósito)
  const hashDemo = await authService.hashear(PASSWORD_DEMO);
  const recargarDatos = async () => {
    for (const repositorio of Object.values(repositorios)) {
      await repositorio.clear();
    }
    return cargarDatosSemilla(repositorios, reloj.ahora(), { hashDemo });
  };
  await recargarDatos();

  // ---------- CONTROLLERS ----------
  server.setController(AuthController, new AuthController(authService, usuarioService));
  server.setController(UsuarioController, new UsuarioController(usuarioService));
  server.setController(CategoriaController, new CategoriaController(categoriaService));
  server.setController(
    EventoController,
    new EventoController(eventoService, { webUrl: config.webUrl }),
  );
  server.setController(CompraController, new CompraController(compraService));
  server.setController(MensajeController, new MensajeController(mensajeService));
  server.setController(ReseniaController, new ReseniaController(reseniaService));
  server.setController(CuponController, new CuponController(cuponService));
  server.setController(ListaEsperaController, new ListaEsperaController(listaEsperaService));
  server.setController(
    ArchivoController,
    new ArchivoController(new ArchivoService(config.uploadsDir), config),
  );
  server.setController(NotificacionController, new NotificacionController(notificacionService));
  server.setController(DevController, new DevController(recargarDatos, email));

  // ---------- RUTAS ----------
  server.setAuth({
    ...crearMiddlewaresDeUsuario(authService),
    limitarLogin: crearLimiteDeLogin(config),
  });
  server.addMiddleware(
    crearMantenimientoMiddleware([
      () => compraService.vencerReservas(),
      () => listaEsperaService.expirarPrioridades(),
    ]),
  );
  server.setOpcionesRutas({ uploadsDir: config.uploadsDir });
  routes.forEach((route) => server.addRoute(route));
  server.configureRoutes();

  return server;
}
