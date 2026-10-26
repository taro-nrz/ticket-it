import { Redirect, Tabs } from "expo-router";
import { iconoTab, opcionesTabs } from "../../src/components/tabs.js";
import { useSesion } from "../../src/store/SesionContext.js";
import { useTema } from "../../src/store/TemaContext.js";

// Navegación del organizador
export default function TabsOrganizador() {
  const { esOrganizador } = useSesion();
  const { colores } = useTema();
  if (!esOrganizador) return <Redirect href="/" />;

  return (
    <Tabs screenOptions={opcionesTabs(colores)}>
      <Tabs.Screen
        name="mis-eventos"
        options={{ title: "Mis eventos", tabBarIcon: iconoTab("calendar", colores) }}
      />
      <Tabs.Screen
        name="crear-evento"
        options={{ title: "Publicar evento", tabBarIcon: iconoTab("add-circle", colores) }}
      />
    </Tabs>
  );
}
