export function loggerMiddleware(req, _res, next) {
  if (process.env.NODE_ENV !== "test") {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  }
  next();
}
