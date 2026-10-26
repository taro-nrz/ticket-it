import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middlewares/errorHandler.js";
import { loggerMiddleware } from "./middlewares/loggerMiddleware.js";

// El server recibe los controllers, los middlewares de autenticación y las rutas
export class Server {
  #controllers = {};
  #auth = {};
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

  addRoute(route) {
    this.#routes.push(route);
  }

  configureRoutes() {
    this.#routes.forEach((route) =>
      this.#app.use(route(this.getController.bind(this), this.#auth)),
    );

    // Middleware para rutas no encontradas
    this.#app.use((_req, res) => {
      res.status(404).json({ status: "fail", message: "La ruta solicitada no existe" });
    });

    // Middleware global de manejo de errores
    this.#app.use(errorHandler);
  }

  // Devuelve el servidor HTTP para poder cerrarlo de forma ordenada (index.js)
  launch(host = "0.0.0.0") {
    return this.#app.listen(this.port, host, () => {
      console.log(`Server running on http://${host}:${this.port} (docs en /api-docs)`);
    });
  }
}
