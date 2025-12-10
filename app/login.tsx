// app/login.tsx
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

const PRIMARY = "#084D6E"; // azul principal
const BG_DARK = "#d9e1e9ff"; // fondo claro y sereno
const SURFACE = "#FFFFFF"; // tarjetas
const TEXT_PRIMARY = "#072A4A"; // texto principal, azul oscuro
const TEXT_MUTED = "#59708B"; // texto secundario, gris azulado
const BORDER_SOFT = "#E6EEF7"; // bordes sutiles
const AVATAR_BG = PRIMARY;
const ICON_BG = "#0B2740"; // fondo de iconos redondos (usado como color de iconos)
const INPUT_BG = "#F0F5FB"; // fondo input suave
const BUTTON_TEXT = "#FFFFFF";
const PROGRESS_BG = "#EAF2FF";
const ICON_ACCENT = "#2DD4BF";
const CHANGE_POS = "#16A34A";
const CHANGE_NEG = "#DC2626";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Ingresa correo y contraseña");
      return;
    }
    try {
      setLoading(true);
      await login(email, password);
      router.replace("/(tabs)");
    } catch (error: any) {
      console.log(error?.response?.data || error);
      Alert.alert("Error", "Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.logoWrapper}>
          <View style={styles.logoCircleOuter}>
            <View style={styles.logoCircleInner} />
          </View>
        </View>

        <Text style={styles.title}>¡Bienvenido de vuelta!</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu correo electrónico"
            placeholderTextColor={TEXT_MUTED}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Contraseña</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.input, { paddingRight: 44 }]}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor={TEXT_MUTED}
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
                color={TEXT_MUTED}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgot}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && { opacity: 0.8 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginText}>
              {loading ? "Entrando..." : "Iniciar Sesión"}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>O inicia sesión con</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton}>
              <MaterialIcons name="email" size={20} color={ICON_BG} />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <MaterialIcons name="apple" size={20} color={ICON_BG} />
              <Text style={styles.socialText}>Apple</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>¿No tienes cuenta?{" "}</Text>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text style={styles.footerLink}>Regístrate</Text>
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
    justifyContent: "center",
    backgroundColor: BG_DARK,
  },
  logoWrapper: { alignItems: "center", marginBottom: 24 },
  logoCircleOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(8,77,110,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoCircleInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AVATAR_BG,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    textAlign: "center",
    marginBottom: 24,
  },
  form: { gap: 8 },
  label: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    backgroundColor: INPUT_BG,
    color: TEXT_PRIMARY,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 14,
  },
  passwordWrapper: { position: "relative" },
  eyeButton: { position: "absolute", right: 12, top: 14 },
  forgot: { alignSelf: "flex-end", marginTop: 8 },
  forgotText: {
    color: PRIMARY,
    fontSize: 12,
    textDecorationLine: "underline",
  },
  loginButton: {
    marginTop: 20,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: { color: BUTTON_TEXT, fontSize: 16, fontWeight: "700" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 8,
  },
  divider: { flex: 1, height: 1, backgroundColor: BORDER_SOFT },
  dividerText: { color: TEXT_MUTED, fontSize: 12 },
  socialRow: { flexDirection: "row", gap: 12 },
  socialButton: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 12,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
  },
  socialText: { fontSize: 14, fontWeight: "600", color: TEXT_PRIMARY },
  footerContainer: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: TEXT_MUTED,
    fontSize: 12,
  },
  footerLink: { color: PRIMARY, fontWeight: "700", fontSize: 12 },
});
