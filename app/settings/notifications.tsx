import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
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

export default function NotificationsSettingsScreen() {
  const router = useRouter();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  return (
    <View style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={22} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      >
        <View style={styles.card}>
          <Text style={styles.description}>
            Configura cómo quieres recibir recordatorios de pagos, tandas y metas de ahorro.
          </Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Notificaciones push</Text>
              <Text style={styles.rowSub}>
                Alertas en tu dispositivo cuando haya eventos importantes.
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: "#CBD5E1", true: PRIMARY }}
            />
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Correo electrónico</Text>
              <Text style={styles.rowSub}>
                Resúmenes y avisos de pagos o vencimientos a tu email.
              </Text>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={setEmailEnabled}
              trackColor={{ false: "#CBD5E1", true: PRIMARY }}
            />
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Recordatorios diarios</Text>
              <Text style={styles.rowSub}>
                Un pequeño resumen de tu día financiero y movimientos.
              </Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={setRemindersEnabled}
              trackColor={{ false: "#CBD5E1", true: PRIMARY }}
            />
          </View>

          <Text style={styles.helper}>
            Estos ajustes son locales por ahora. Más adelante puedes conectarlos
            con preferencias en el backend.
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
  description: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_PRIMARY,
  },
  rowSub: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  helper: {
    marginTop: 16,
    fontSize: 11,
    color: TEXT_MUTED,
  },
});
