import dotenv from "dotenv";
dotenv.config({ quiet: true }); // siempre antes de leer process.env

import { crearApp } from "./app.js";
import { obtenerConfig } from "./config/config.js";

const start = async () => {
  try {
    const config = obtenerConfig();
    const server = await crearApp({ config });
    server.launch(config.host);
  } catch (error) {
    console.error("No se pudo iniciar el servidor", error);
    process.exit(1);
  }
};

start();
