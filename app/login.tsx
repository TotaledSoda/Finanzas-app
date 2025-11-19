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

const PRIMARY = "#13ec5b";
const BG_DARK = "#102216";

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
      <StatusBar barStyle="light-content" />
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
            placeholderTextColor="#64748b"
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

          <TouchableOpacity style={styles.forgot}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && { opacity: 0.7 }]}
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
              <MaterialIcons name="email" size={20} color="#0f172a" />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <MaterialIcons name="apple" size={20} color="#0f172a" />
              <Text style={styles.socialText}>Apple</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>
            ¿No tienes cuenta?{" "}
            
          </Text>
          <View style={styles.footerContainer}>
  <Text style={styles.footerText}>
    ¿No tienes cuenta?{" "}
  </Text>
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
    backgroundColor: "rgba(19, 236, 91, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoCircleInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#f9fafb",
    textAlign: "center",
    marginBottom: 24,
  },
  form: { gap: 8 },
  label: {
    color: "#e2e8f0",
    fontSize: 14,
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
  loginText: { color: "#052e16", fontSize: 16, fontWeight: "700" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 8,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#1f2937" },
  dividerText: { color: "#9ca3af", fontSize: 12 },
  socialRow: { flexDirection: "row", gap: 12 },
  socialButton: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  socialText: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  footerText: {
    marginTop: 24,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 12,
  },
  footerLink: { color: PRIMARY, fontWeight: "700" },
});
