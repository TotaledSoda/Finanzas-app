// app/register.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { api } from "../src/api/client";

const PRIMARY = "#13ec5b";
const BG_DARK = "#102216";

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirm) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    try {
      setLoading(true);

      // 1. Registrar en tu API Laravel
      await api.post("/auth/register", {
        name,
        email,
        password,
        password_confirmation: confirm,
      });

      // 2. Auto-login con el mismo usuario
      await login(email, password);

      // 3. Mandar al dashboard (tabs)
      router.replace("/(tabs)");
    } catch (error: any) {
      console.log(error?.response?.data || error);
      const msg =
        error?.response?.data?.message ||
        "No se pudo crear la cuenta, revisa los datos";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Back */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#e5e7eb" />
        </TouchableOpacity>

        <Text style={styles.title}>Crea tu cuenta</Text>
        <Text style={styles.subtitle}>
          Registra una cuenta para empezar a organizar tus finanzas.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Tu nombre"
            placeholderTextColor="#64748b"
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>
            Correo electrónico
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu correo"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Contraseña</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.input, { paddingRight: 44 }]}
              placeholder="Crea una contraseña"
              placeholderTextColor="#64748b"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPass((prev) => !prev)}
            >
              <MaterialIcons
                name={showPass ? "visibility-off" : "visibility"}
                size={22}
                color="#94a3b8"
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>
            Confirmar contraseña
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Repite la contraseña"
            placeholderTextColor="#64748b"
            secureTextEntry={!showPass}
            value={confirm}
            onChangeText={setConfirm}
          />

          <TouchableOpacity
            style={[styles.registerButton, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.registerText}>
              {loading ? "Creando cuenta..." : "Registrarme"}
            </Text>
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.replace("/login")}>
              <Text style={styles.footerLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG_DARK },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: BG_DARK,
  },
  backButton: {
    marginBottom: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#f9fafb",
    marginBottom: 4,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 13,
    marginBottom: 24,
  },
  form: { marginTop: 4 },
  label: {
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#020617",
    color: "#f9fafb",
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
  },
  passwordWrapper: { position: "relative" },
  eyeButton: { position: "absolute", right: 12, top: 12 },
  registerButton: {
    marginTop: 20,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  registerText: { color: "#052e16", fontSize: 16, fontWeight: "700" },
  footerContainer: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: { color: "#9ca3af", fontSize: 12 },
  footerLink: { color: PRIMARY, fontWeight: "700", fontSize: 12 },
});
