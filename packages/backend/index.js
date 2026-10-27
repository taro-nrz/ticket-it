import dotenv from "dotenv";
dotenv.config({ quiet: true }); // siempre antes de leer process.env

import { crearApp } from "./app.js";
import { obtenerConfig } from "./config/config.js";

const start = async () => {
  try {
    const config = obtenerConfig();
    const server = await crearApp({ config });
    const http = server.launch(config.host);

    // D-35: cierre ordenado (Docker manda SIGTERM): deja de aceptar conexiones y termina las requests en curso
    const cerrar = (senial) => {
      console.log(`${senial} recibido: cerrando el servidor...`);
      server.cerrar(); // primero los WebSockets
      http.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10_000).unref();
    };
    process.on("SIGTERM", () => cerrar("SIGTERM"));
    process.on("SIGINT", () => cerrar("SIGINT"));
  } catch (error) {
    console.error("No se pudo iniciar el servidor:", error.message);
    process.exit(1);
  }
};

start();
