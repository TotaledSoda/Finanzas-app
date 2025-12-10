// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useWindowDimensions, Platform } from "react-native";

const PRIMARY = "#084D6E"; // azul principal
const BG_DARK = "#d9e1e9ff"; // fondo claro y sereno
const SURFACE = "#FFFFFF"; // tarjetas
const TEXT_PRIMARY = "#072A4A"; // texto principal, azul oscuro
const TEXT_MUTED = "#59708B"; // texto secundario, gris azulado
const BORDER_SOFT = "#E6EEF7"; // bordes sutiles
const AVATAR_BG = PRIMARY;
const ICON_BG = "#0B2740"; // fondo de iconos redondos
const INPUT_BG = "#F0F5FB"; // fondo input suave
const BUTTON_TEXT = "#FFFFFF";
const PROGRESS_BG = "#EAF2FF"; // fondo barra de progreso
const ICON_ACCENT = "#2DD4BF"; // acento teal para algunos iconos
const CHANGE_POS = "#16A34A"; // verde positivo
const CHANGE_NEG = "#DC2626"; // rojo negativo

export default function TabsLayout() {
  const { width, height } = useWindowDimensions();
  // Consider it a phone when the smallest dimension is below ~420
  const isPhone = Math.min(width, height) < 420;

  const tabBarStyle = {
    backgroundColor: BG_DARK,
    borderTopColor: BORDER_SOFT,
    height: isPhone ? 60 : 80,
    paddingBottom: isPhone ? 8 : 16,
  };

  const commonScreenOptions = {
    headerShown: false,
    tabBarActiveTintColor: PRIMARY,
    tabBarInactiveTintColor: TEXT_MUTED,
    tabBarShowLabel: !isPhone, // hide labels on small phones to save space
    tabBarStyle,
    // if you want smaller label text on small screens:
    tabBarLabelStyle: {
      fontSize: isPhone ? 10 : 12,
      color: TEXT_PRIMARY,
    },
  } as const;

  return (
    <Tabs screenOptions={commonScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={isPhone ? 22 : 26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          title: "Pagos",
          tabBarIcon: ({ color }) => (
            <MaterialIcons
              name="receipt-long"
              size={isPhone ? 22 : 26}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tandas"
        options={{
          title: "Tandas",
          tabBarIcon: ({ color }) => (
            <MaterialIcons
              name="groups"
              size={isPhone ? 22 : 26}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Ahorros",
          tabBarIcon: ({ color }) => (
            <MaterialIcons
              name="savings"
              size={isPhone ? 22 : 26}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendario",
          tabBarIcon: ({ color }) => (
            <MaterialIcons
              name="calendar-month"
              size={isPhone ? 22 : 26}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
