import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../src/api/client";

const PRIMARY = "#084D6E";
const BG_DARK = "#d9e1e9ff";
const TEXT_PRIMARY = "#072A4A";
const TEXT_MUTED = "#59708B";

export default function LogoutScreen() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const doLogout = async () => {
      try {
        await api.post("/logout");
      } catch (e) {
        console.log("Error al cerrar sesión (ignorado):", e?.response?.data || e);
      } finally {
        setDone(true);
        // Ajusta esta ruta a tu pantalla de login real
        router.replace("/login");
      }
    };

    doLogout();
  }, []);

  return (
    <View style={styles.safe}>
      <ActivityIndicator size="large" color={PRIMARY} />
      <Text style={styles.text}>
        {done ? "Redirigiendo..." : "Cerrando sesión..."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG_DARK,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: TEXT_MUTED,
  },
});
