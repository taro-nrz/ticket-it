import { BagelFatOne_400Regular } from "@expo-google-fonts/bagel-fat-one/400Regular";
import { Figtree_400Regular } from "@expo-google-fonts/figtree/400Regular";
import { Figtree_500Medium } from "@expo-google-fonts/figtree/500Medium";
import { Figtree_600SemiBold } from "@expo-google-fonts/figtree/600SemiBold";
import { Figtree_700Bold } from "@expo-google-fonts/figtree/700Bold";
import { Figtree_800ExtraBold } from "@expo-google-fonts/figtree/800ExtraBold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { PantallaInicio } from "../src/components/carga/PantallaInicio.jsx";
import { iniciarMocks } from "../src/mocks/iniciar.js";
import { SesionProvider, useSesion } from "../src/context/SesionContext.jsx";
import { DialogosProvider } from "../src/context/DialogosContext.jsx";
import { NotificacionesProvider } from "../src/context/NotificacionesContext.jsx";
import { TemaProvider, useTema } from "../src/context/TemaContext.jsx";
import { configurarAccesibilidadWeb } from "../src/utils/accesibilidad.js";

// Idioma, foco visible y movimiento reducido en web (D-21)
configurarAccesibilidadWeb();

export default function RootLayout() {
  // D-39: si se pidió MSW, se arranca antes de la primera llamada a la API
  const [mocksListos, setMocksListos] = useState(false);
  useEffect(() => {
    iniciarMocks()
      .catch((error) => console.error("[MSW] no se pudo iniciar", error))
      .finally(() => setMocksListos(true));
  }, []);

  const [fuentesListas] = useFonts({
    BagelFatOne_400Regular,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
  });

  if (!mocksListos) {
    return (
      <TemaProvider>
        <PantallaInicio />
      </TemaProvider>
    );
  }

  return (
    <TemaProvider>
      <SesionProvider>
        <DialogosProvider>
          <NotificacionesProvider>
            <BarraDeEstado />
            {fuentesListas ? <Navegador /> : <PantallaInicio />}
          </NotificacionesProvider>
        </DialogosProvider>
      </SesionProvider>
    </TemaProvider>
  );
}

// Hasta recuperar la sesión guardada no se muestra ninguna pantalla (evita requests sin token).
// Cada pantalla dibuja su propia cabecera (Encabezado / BarraVolver), por eso el Stack no muestra la suya.
function Navegador() {
  const { colores } = useTema();
  const { cargando } = useSesion();
  if (cargando) return <PantallaInicio />;

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
