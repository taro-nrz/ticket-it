import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

// En Expo Go el celular no conoce "localhost": se usa la IP de la PC donde corre el servidor de Expo.
function resolverUrlApi() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === "web") return "http://localhost:3000";
  const hostDeExpo = Constants.expoConfig?.hostUri?.split(":")[0];
  return `http://${hostDeExpo ?? "localhost"}:3000`;
}

export const API_URL = resolverUrlApi();

export const cliente = axios.create({ baseURL: API_URL, timeout: 10000 });

// D-29: el token de la sesión viaja en el header Authorization: Bearer <token>
let tokenActual = null;
export function setToken(token) {
  tokenActual = token;
}

// Lo registra la sesión: se llama cuando el backend rechaza el token (venció o dejó de ser válido)
let alRechazarSesion = null;
export function registrarRechazoDeSesion(funcion) {
  alRechazarSesion = funcion;
}

cliente.interceptors.request.use((config) => {
  if (tokenActual) {
    config.headers.Authorization = `Bearer ${tokenActual}`;
  }
  return config;
});

// Convierte los errores del backend ({ status, message, errores }) en un Error con mensaje legible
cliente.interceptors.response.use(
  (response) => response,
  (error) => {
    const datos = error.response?.data;
    let mensaje = datos?.message;
    if (datos?.errores?.length) {
      mensaje = datos.errores.map((e) => `${e.campo}: ${e.mensaje}`).join("\n");
    }
    if (!error.response) {
      mensaje = `No se pudo conectar con el servidor (${API_URL}). ¿Está corriendo el backend?`;
    }
    // Un 401 con token significa que la sesión ya no sirve (no aplica al login con credenciales incorrectas)
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      alRechazarSesion?.(mensaje);
    }
    const errorApi = new Error(mensaje ?? "Ocurrió un error inesperado");
    errorApi.status = error.response?.status;
    errorApi.errores = datos?.errores;
    return Promise.reject(errorApi);
  },
);
