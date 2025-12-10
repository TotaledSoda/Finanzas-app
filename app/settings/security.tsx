import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const PRIMARY = "#084D6E";
const BG_DARK = "#d9e1e9ff";
const SURFACE = "#FFFFFF";
const TEXT_PRIMARY = "#072A4A";
const TEXT_MUTED = "#59708B";
const BORDER_SOFT = "#E6EEF7";

export default function SecurityScreen() {
  const router = useRouter();

  return (
    <View style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={22} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seguridad y privacidad</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Protección de tu cuenta</Text>
          <Text style={styles.text}>
            • Tus contraseñas se almacenan usando algoritmos de cifrado seguros
            (hash, no texto plano).
          </Text>
          <Text style={styles.text}>
            • Te recomendamos no reutilizar la misma contraseña que usas en otros servicios.
          </Text>
          <Text style={styles.text}>
            • Puedes cambiar tu contraseña en cualquier momento desde la opción “Cambiar contraseña”.
          </Text>

          <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
            Uso de tu información
          </Text>
          <Text style={styles.text}>
            • Los datos que agregas (ingresos, pagos, metas, tandas) se utilizan
            únicamente para mostrarte información y estadísticas dentro de la app.
          </Text>
          <Text style={styles.text}>
            • No compartimos tu información financiera con terceros sin tu
            consentimiento, salvo cuando sea requerido por la ley.
          </Text>

          <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
            Eliminación de datos
          </Text>
          <Text style={styles.text}>
            • Tienes derecho a solicitar la eliminación de tu cuenta desde la sección
            “Eliminar cuenta”.
          </Text>
          <Text style={styles.text}>
            • Parte de la información puede permanecer de forma anonimizada para
            fines estadísticos o cumplimiento legal.
          </Text>

          <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
            Buenas prácticas recomendadas
          </Text>
          <Text style={styles.text}>
            • No compartas tu contraseña con nadie.
          </Text>
          <Text style={styles.text}>
            • Activa bloqueo por PIN, huella o rostro en tu teléfono.
          </Text>
          <Text style={styles.text}>
            • Si detectas actividad sospechosa, cambia tu contraseña de inmediato.
          </Text>

          <Text style={[styles.footer, { marginTop: 16 }]}>
            Si tienes dudas sobre el manejo de tus datos, contáctanos desde el
            soporte oficial dentro de la app.
          </Text>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    marginBottom: 6,
  },
  text: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 4,
  },
  footer: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
});
