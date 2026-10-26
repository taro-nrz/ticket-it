const SECRETO_DESARROLLO = "secreto-solo-para-desarrollo";

// Se lee en tiempo de ejecución (después de dotenv.config() en index.js)
export function obtenerConfig() {
  const nodeEnv = process.env.NODE_ENV || "development";
  const jwtSecret = process.env.JWT_SECRET || (nodeEnv === "production" ? "" : SECRETO_DESARROLLO);
  if (!jwtSecret) {
    throw new Error("Falta JWT_SECRET: es obligatorio en producción");
  }
  return {
    port: Number(process.env.PORT) || 3000,
    host: process.env.HOST || "0.0.0.0",
    allowedOrigins: process.env.ALLOWED_ORIGINS || "*",
    nodeEnv,
    maxEntradasPorCompra: Number(process.env.MAX_ENTRADAS_POR_COMPRA) || 10,
    // D-29: autenticación con JWT
    jwtSecret,
    jwtExpiracion: process.env.JWT_EXPIRACION || "8h",
    bcryptRondas: Number(process.env.BCRYPT_RONDAS) || 10,
    loginMaxIntentos: Number(process.env.LOGIN_MAX_INTENTOS) || 10,
    loginVentanaMs: Number(process.env.LOGIN_VENTANA_MS) || 15 * 60 * 1000,
  };
}
