// Middleware global de errores: muestra información útil en desarrollo y oculta detalles internos en el resto.
export const errorHandler = (err, _req, res, _next) => {
  // JSON mal formado en el body (lo lanza express.json())
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ status: "fail", message: "El body no es un JSON válido" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ status: "fail", message: "El body es demasiado grande" });
  }

  const statusCode = err.statusCode || 500;

  if (err.isOperational) {
    const body = { status: err.status, message: err.message };
    if (err.errores) body.errores = err.errores;
    return res.status(statusCode).json(body);
  }

  // Error de programación: no enviar detalles al cliente
  console.error("ERROR 💥", err);
  const body = { status: "error", message: "Algo salió mal" };
  if (process.env.NODE_ENV === "development") {
    body.detalle = err.message;
    body.stack = err.stack;
  }
  res.status(500).json(body);
};
