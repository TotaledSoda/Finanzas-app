import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "../src/api/client";

// 🎨 Misma paleta que el dashboard
const PRIMARY = "#084D6E"; // azul principal
const BG_DARK = "#d9e1e9ff"; // fondo claro y sereno
const SURFACE = "#FFFFFF"; // tarjetas
const TEXT_PRIMARY = "#072A4A"; // texto principal, azul oscuro
const TEXT_MUTED = "#59708B"; // texto secundario, gris azulado
const BORDER_SOFT = "#E6EEF7"; // bordes sutiles
const ICON_BG = "#0B2740"; // fondo de iconos redondos
const BUTTON_TEXT = "#FFFFFF";
const DANGER = "#DC2626";

export default function AccountScreen() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Campos incompletos", "Llena todos los campos.");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        "Contraseña insegura",
        "La nueva contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        "No coinciden",
        "La confirmación de contraseña no coincide."
      );
      return;
    }

    try {
      setSavingPassword(true);

      // AJUSTA ESTA RUTA SEGÚN TU BACKEND
      // Ejemplo en Laravel: Route::post('/account/change-password', ...)
      await api.post("/account/change-password", {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      Alert.alert("Listo", "Tu contraseña se actualizó correctamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      console.log("Error cambiando contraseña:", e?.response?.data || e);

      const msg =
        e?.response?.data?.message ||
        "No se pudo cambiar la contraseña. Inténtalo de nuevo.";
      Alert.alert("Error", msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Eliminar cuenta",
      "Esta acción es permanente. Se eliminarán tus datos de la app. ¿Seguro que quieres continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: handleDeleteAccount },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    try {
      setDeletingAccount(true);

      // AJUSTA ESTA RUTA SEGÚN TU BACKEND
      // Ejemplo en Laravel: Route::delete('/account', ...)
      await api.delete("/account");

      Alert.alert(
        "Cuenta eliminada",
        "Tu cuenta se ha eliminado correctamente."
      );

      // Aquí podrías limpiar tokens / ir al login
      router.replace("/login");
    } catch (e: any) {
      console.log("Error eliminando cuenta:", e?.response?.data || e);

      const msg =
        e?.response?.data?.message ||
        "No se pudo eliminar la cuenta. Inténtalo de nuevo.";
      Alert.alert("Error", msg);
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons
              name="arrow-back"
              size={22}
              color={BUTTON_TEXT}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tu cuenta</Text>
          <View style={{ width: 34 }} />
        </View>

        {/* Contenido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seguridad</Text>
          <Text style={styles.sectionSubtitle}>
            Actualiza tu contraseña para mantener tu cuenta protegida.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Contraseña actual</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              placeholderTextColor={TEXT_MUTED}
              secureTextEntry
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nueva contraseña</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor={TEXT_MUTED}
              secureTextEntry
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirmar nueva contraseña</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repite la nueva contraseña"
              placeholderTextColor={TEXT_MUTED}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleChangePassword}
            disabled={savingPassword}
          >
            {savingPassword ? (
              <ActivityIndicator size="small" color={BUTTON_TEXT} />
            ) : (
              <>
                <MaterialIcons
                  name="lock-reset"
                  size={18}
                  color={BUTTON_TEXT}
                />
                <Text style={styles.saveButtonText}>
                  Actualizar contraseña
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Zona peligrosa */}
        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Zona peligrosa</Text>
          <Text style={styles.dangerText}>
            Si eliminas tu cuenta, tus datos se borrarán y no podrás
            recuperarlos. Úsalo solo si estás seguro.
          </Text>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={confirmDeleteAccount}
            disabled={deletingAccount}
          >
            {deletingAccount ? (
              <ActivityIndicator size="small" color={BUTTON_TEXT} />
            ) : (
              <>
                <MaterialIcons
                  name="delete-forever"
                  size={18}
                  color={BUTTON_TEXT}
                />
                <Text style={styles.deleteButtonText}>
                  Eliminar cuenta
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG_DARK,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: ICON_BG,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER_SOFT,
  },
  headerTitle: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: "700",
  },

  // SECCIÓN SEGURIDAD
  section: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    marginBottom: 16,
  },
  sectionTitle: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: TEXT_MUTED,
    fontSize: 12,
    marginBottom: 10,
  },
  field: {
    marginBottom: 10,
  },
  label: {
    color: TEXT_PRIMARY,
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#F0F5FB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: TEXT_PRIMARY,
    fontSize: 14,
  },
  saveButton: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 10,
  },
  saveButtonText: {
    color: BUTTON_TEXT,
    fontSize: 14,
    fontWeight: "700",
  },

  // ZONA PELIGROSA
  dangerSection: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FECACA", // ligero rojo
  },
  dangerTitle: {
    color: DANGER,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  dangerText: {
    color: TEXT_MUTED,
    fontSize: 12,
    marginBottom: 10,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: DANGER,
    borderRadius: 12,
    paddingVertical: 10,
  },
  deleteButtonText: {
    color: BUTTON_TEXT,
    fontSize: 14,
    fontWeight: "700",
  },
});
