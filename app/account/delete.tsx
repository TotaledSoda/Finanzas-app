// app/account/delete.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "../../src/api/client";
import { useAuth } from "../../src/context/AuthContext";

const PRIMARY = "#084D6E";
const BG_DARK = "#d9e1e9ff";
const SURFACE = "#FFFFFF";
const TEXT_PRIMARY = "#072A4A";
const TEXT_MUTED = "#59708B";
const BORDER_SOFT = "#E6EEF7";
const BUTTON_TEXT = "#FFFFFF";
const DANGER = "#DC2626";

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!password.trim()) {
      Alert.alert("Campo requerido", "Ingresa tu contraseña para continuar.");
      return;
    }

    Alert.alert(
      "¿Eliminar cuenta?",
      "Esta acción es permanente. Se cerrará tu sesión y tu información puede ser eliminada o anonimizada según la política de datos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              // 👈 IMPORTANTE: endpoint correcto según las rutas del backend
              await api.delete("/auth/delete", {
                data: { password },
              });

              // Cerramos sesión localmente
              await logout();

              Alert.alert("Cuenta eliminada", "Tu cuenta ha sido eliminada.", [
                {
                  text: "OK",
                  onPress: () => {
                    router.replace("/login");
                  },
                },
              ]);
            } catch (e: any) {
              console.log("Error eliminando cuenta:", e?.response?.data || e);

              const msg =
                e?.response?.data?.message ||
                "No se pudo eliminar la cuenta. Verifica tu contraseña.";

              Alert.alert("Error", msg);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={22} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Eliminar cuenta</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      >
        <View style={styles.card}>
          <View style={styles.warningHeader}>
            <MaterialIcons name="warning-amber" size={24} color={DANGER} />
            <Text style={styles.warningTitle}>Acción irreversible</Text>
          </View>

          <Text style={styles.description}>Al eliminar tu cuenta:</Text>
          <Text style={styles.bullet}>
            • Se cerrará tu sesión en todos los dispositivos.
          </Text>
          <Text style={styles.bullet}>
            • Tu información financiera puede ser eliminada o anonimizada.
          </Text>
          <Text style={styles.bullet}>
            • No podrás recuperar tu cuenta con este correo.
          </Text>

          <Text style={[styles.description, { marginTop: 12 }]}>
            Por seguridad, ingresa tu contraseña actual para confirmar.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={TEXT_MUTED}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={BUTTON_TEXT} />
            ) : (
              <Text style={styles.buttonText}>Eliminar cuenta</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG_DARK,
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    marginTop: 4,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: DANGER,
  },
  description: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 4,
  },
  bullet: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginLeft: 4,
    marginTop: 2,
  },
  field: {
    marginTop: 14,
  },
  label: {
    fontSize: 12,
    color: TEXT_PRIMARY,
    marginBottom: 4,
    fontWeight: "600",
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    paddingHorizontal: 10,
    backgroundColor: "#F0F5FB",
    color: TEXT_PRIMARY,
    fontSize: 14,
  },
  button: {
    marginTop: 18,
    backgroundColor: DANGER,
    borderRadius: 999,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: BUTTON_TEXT,
    fontSize: 15,
    fontWeight: "700",
  },
});
