import { randomUUID } from "node:crypto";

// D-35: cada request recibe un id (header X-Request-Id, o el que mande un proxy) para seguirla en los logs.
// Se registra al terminar, con el status y cuánto tardó.
export function loggerMiddleware(req, res, next) {
  const id = req.get("x-request-id") || randomUUID();
  req.id = id;
  res.set("X-Request-Id", id);

  const inicio = process.hrtime.bigint();
  res.on("finish", () => {
    if (process.env.NODE_ENV === "test") return;
    const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
    console.log(
      `${new Date().toISOString()} ${id.slice(0, 8)} ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms.toFixed(1)} ms)`,
    );
  });
  next();
}
