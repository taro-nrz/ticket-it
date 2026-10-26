import { z } from "zod";

const SECRETO_DESARROLLO = "secreto-solo-para-desarrollo";
const entero = (porDefecto) => z.coerce.number().int().positive().default(porDefecto);

// D-35: la configuración se valida al arrancar: si falta algo o tiene un formato inválido, el servidor no arranca
// y dice qué variable corregir (falla rápido en vez de fallar en medio de una request).
const esquemaEntorno = z
  .object({
    PORT: entero(3000),
    HOST: z.string().default("0.0.0.0"),
    ALLOWED_ORIGINS: z.string().default("*"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    MAX_ENTRADAS_POR_COMPRA: entero(10),
    MINUTOS_RESERVA: entero(15),
    JWT_SECRET: z.string().optional(),
    JWT_EXPIRACION: z.string().default("8h"),
    BCRYPT_RONDAS: entero(10),
    LOGIN_MAX_INTENTOS: entero(10),
    LOGIN_VENTANA_MS: entero(15 * 60 * 1000),
  })
  .refine((entorno) => entorno.NODE_ENV !== "production" || entorno.JWT_SECRET?.length >= 32, {
    message: "En producción JWT_SECRET es obligatorio y debe tener al menos 32 caracteres",
    path: ["JWT_SECRET"],
  });

// Se lee en tiempo de ejecución (después de dotenv.config() en index.js)
export function obtenerConfig(entorno = process.env) {
  const resultado = esquemaEntorno.safeParse(entorno);
  if (!resultado.success) {
    const detalle = resultado.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Configuración inválida (revisá el .env):\n${detalle}`);
  }
  const e = resultado.data;
  return {
    port: e.PORT,
    host: e.HOST,
    allowedOrigins: e.ALLOWED_ORIGINS,
    nodeEnv: e.NODE_ENV,
    maxEntradasPorCompra: e.MAX_ENTRADAS_POR_COMPRA,
    // D-36: plazo para pagar una compra pendiente antes de que venza
    minutosReserva: e.MINUTOS_RESERVA,
    // D-29: autenticación con JWT
    jwtSecret: e.JWT_SECRET || SECRETO_DESARROLLO,
    jwtExpiracion: e.JWT_EXPIRACION,
    bcryptRondas: e.BCRYPT_RONDAS,
    loginMaxIntentos: e.LOGIN_MAX_INTENTOS,
    loginVentanaMs: e.LOGIN_VENTANA_MS,
  };
}
