import express from "express";
import cors from "cors";
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
    this.#app.use(express.json());
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

  launch(host = "0.0.0.0") {
    this.#app.listen(this.port, host, () => {
      console.log(`Server running on http://${host}:${this.port} (docs en /api-docs)`);
    });
  }
}
