import http from "node:http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middlewares/errorHandler.js";
import { loggerMiddleware } from "./middlewares/loggerMiddleware.js";

// El server recibe los controllers, los middlewares de autenticación y las rutas
export class Server {
  #controllers = {};
  #auth = {};
  #middlewares = [];
  #opcionesRutas = {};
  #alCrearHttp = [];
  #alCerrar = [];
  #app;
  #routes;

  constructor(app, { port, allowedOrigins = "*" } = {}) {
    this.#app = app;
    this.port = port;
    this.#routes = [];
    // D-35: headers de seguridad. La API sólo devuelve JSON (la CSP se desactiva para que Swagger UI funcione).
    this.#app.use(helmet({ contentSecurityPolicy: false }));
    this.#app.use(express.json({ limit: "100kb" }));
    this.#app.use(
      cors({
        origin: allowedOrigins === "*" ? "*" : allowedOrigins.split(",").map((o) => o.trim()),
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      }),
    );
    this.#app.use(loggerMiddleware);
  }

  get app() {
    return this.#app;
  }

  setController(controllerClass, controller) {
    this.#controllers[controllerClass.name] = controller;
  }

  getController(controllerClass) {
    const controller = this.#controllers[controllerClass.name];
    if (!controller) {
      throw new Error("Controller missing for the given route.");
    }
    return controller;
  }

  // Middlewares de identificación de usuario (requiereUsuario, requiereRol, usuarioOpcional)
  setAuth(auth) {
    this.#auth = auth;
  }

  // Middlewares que corren antes de todas las rutas (ej. el mantenimiento de D-36)
  addMiddleware(middleware) {
    this.#middlewares.push(middleware);
  }

  addRoute(route) {
    this.#routes.push(route);
  }

  // Opciones que algunas rutas necesitan (ej. la carpeta de imágenes subidas)
  setOpcionesRutas(opciones) {
    this.#opcionesRutas = opciones;
  }

  configureRoutes() {
    this.#middlewares.forEach((middleware) => this.#app.use(middleware));
    this.#routes.forEach((route) =>
      this.#app.use(route(this.getController.bind(this), this.#auth, this.#opcionesRutas)),
    );

    // Middleware para rutas no encontradas
    this.#app.use((_req, res) => {
      res.status(404).json({ status: "fail", message: "La ruta solicitada no existe" });
    });

    // Middleware global de manejo de errores
    this.#app.use(errorHandler);
  }

  // D-45: lo que hay que conectar al servidor HTTP al crearlo (los WebSockets)
  alCrearServidorHttp(funcion) {
    this.#alCrearHttp.push(funcion);
  }

  // Lo que hay que cerrar antes de apagar el servidor (los sockets abiertos no dejan terminar al HTTP)
  alCerrar(funcion) {
    this.#alCerrar.push(funcion);
  }

  cerrar() {
    this.#alCerrar.forEach((funcion) => funcion());
  }

  // Servidor HTTP con la app y los sockets (lo usan launch y los tests de tiempo real)
  crearServidorHttp() {
    const servidor = http.createServer(this.#app);
    this.#alCrearHttp.forEach((funcion) => funcion(servidor));
    return servidor;
  }

  // Devuelve el servidor HTTP para poder cerrarlo de forma ordenada (index.js)
  launch(host = "0.0.0.0") {
    const servidor = this.crearServidorHttp();
    servidor.listen(this.port, host, () => {
      console.log(`Server running on http://${host}:${this.port} (docs en /api-docs)`);
    });
    return servidor;
  }
}
