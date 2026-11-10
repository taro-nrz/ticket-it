import { cliente, datos } from "./api.js";

// ---------- AUTENTICACIÓN (D-29) ----------
export const login = (email, password) => datos(cliente.post("/auth/login", { email, password }));
export const registrarse = (datosRegistro) => datos(cliente.post("/auth/registro", datosRegistro));
export const getUsuarioActual = () => datos(cliente.get("/auth/me"));
// D-44: recuperar la contraseña con un código enviado por email
export const pedirRecuperacion = (email) => datos(cliente.post("/auth/recuperar", { email }));
export const restablecerPassword = (email, codigo, passwordNueva) =>
  cliente.post("/auth/restablecer", { email, codigo, passwordNueva });
export const cambiarPassword = (passwordActual, passwordNueva) =>
  cliente.post("/auth/cambiar-password", { passwordActual, passwordNueva });
