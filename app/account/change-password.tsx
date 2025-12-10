// app/account/change-password.tsx  (o donde la tengas)
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

const PRIMARY = "#084D6E";
const BG_DARK = "#d9e1e9ff";
const SURFACE = "#FFFFFF";
const TEXT_PRIMARY = "#072A4A";
const TEXT_MUTED = "#59708B";
const BORDER_SOFT = "#E6EEF7";
const BUTTON_TEXT = "#FFFFFF";

export default function ChangePasswordScreen() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword || !password || !passwordConfirmation) {
      Alert.alert("Campos incompletos", "Completa todos los campos.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== passwordConfirmation) {
      Alert.alert("Error", "La nueva contraseña y la confirmación no coinciden.");
      return;
    }

    try {
      setLoading(true);

      // 👈 AQUÍ EL CAMBIO IMPORTANTE
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      });

      Alert.alert("Listo", "Tu contraseña se actualizó correctamente.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      console.log("Error cambiando contraseña:", e?.response?.data || e);

      const msg =
        e?.response?.data?.message ||
        "No se pudo cambiar la contraseña. Revisa tus datos.";

      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={22} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cambiar contraseña</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      >
        <View style={styles.card}>
          <Text style={styles.description}>
            Por seguridad, te pedimos tu contraseña actual antes de crear una nueva.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Contraseña actual</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              placeholderTextColor={TEXT_MUTED}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nueva contraseña</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={TEXT_MUTED}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirmar nueva contraseña</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              placeholder="Repite la nueva contraseña"
              placeholderTextColor={TEXT_MUTED}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={BUTTON_TEXT} />
            ) : (
              <Text style={styles.buttonText}>Guardar cambios</Text>
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
  description: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 12,
  },
  field: {
    marginBottom: 10,
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
    marginTop: 16,
    backgroundColor: PRIMARY,
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
