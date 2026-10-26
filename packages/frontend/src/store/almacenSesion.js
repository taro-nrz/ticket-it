import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const CLAVE_TOKEN = "ticket-it:token";

// D-29: en el celular el token se guarda cifrado (Keychain / Keystore con expo-secure-store);
// en web no existe ese almacenamiento, así que se usa localStorage (AsyncStorage).
const enWeb = Platform.OS === "web";

export function leerToken() {
  return enWeb ? AsyncStorage.getItem(CLAVE_TOKEN) : SecureStore.getItemAsync(CLAVE_TOKEN);
}

export function guardarToken(token) {
  return enWeb
    ? AsyncStorage.setItem(CLAVE_TOKEN, token)
    : SecureStore.setItemAsync(CLAVE_TOKEN, token);
}

export function borrarToken() {
  return enWeb ? AsyncStorage.removeItem(CLAVE_TOKEN) : SecureStore.deleteItemAsync(CLAVE_TOKEN);
}
