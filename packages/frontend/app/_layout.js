import { BricolageGrotesque_700Bold } from "@expo-google-fonts/bricolage-grotesque/700Bold";
import { BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque/800ExtraBold";
import { DMSans_400Regular } from "@expo-google-fonts/dm-sans/400Regular";
import { DMSans_500Medium } from "@expo-google-fonts/dm-sans/500Medium";
import { DMSans_600SemiBold } from "@expo-google-fonts/dm-sans/600SemiBold";
import { DMSans_700Bold } from "@expo-google-fonts/dm-sans/700Bold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Cargando } from "../src/components/ui.js";
import { SesionProvider, useSesion } from "../src/store/SesionContext.js";
import { DialogosProvider } from "../src/store/DialogosContext.js";
import { TemaProvider, useTema } from "../src/store/TemaContext.js";
import { configurarAccesibilidadWeb } from "../src/utils/accesibilidad.js";

// Idioma, foco visible y movimiento reducido en web (D-21)
configurarAccesibilidadWeb();

export default function RootLayout() {
  const [fuentesListas] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  return (
    <TemaProvider>
      <SesionProvider>
        <DialogosProvider>
          <BarraDeEstado />
          {fuentesListas ? <Navegador /> : <Cargando />}
        </DialogosProvider>
      </SesionProvider>
    </TemaProvider>
  );
}

// Hasta recuperar la sesión guardada no se muestra ninguna pantalla (evita requests sin x-user-id).
// Cada pantalla dibuja su propia cabecera (Encabezado / BarraVolver), por eso el Stack no muestra la suya.
function Navegador() {
  const { colores } = useTema();
  const { cargando } = useSesion();
  if (cargando) return <Cargando />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colores.fondo },
      }}
    />
  );
}

// Íconos de la barra de estado del celular legibles en ambos temas
function BarraDeEstado() {
  const { esOscuro } = useTema();
  return <StatusBar style={esOscuro ? "light" : "dark"} />;
}
