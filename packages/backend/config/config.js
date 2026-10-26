// Se lee en tiempo de ejecución (después de dotenv.config() en index.js)
export function obtenerConfig() {
  return {
    port: Number(process.env.PORT) || 3000,
    host: process.env.HOST || "0.0.0.0",
    allowedOrigins: process.env.ALLOWED_ORIGINS || "*",
    nodeEnv: process.env.NODE_ENV || "development",
    maxEntradasPorCompra: Number(process.env.MAX_ENTRADAS_POR_COMPRA) || 10,
  };
}
