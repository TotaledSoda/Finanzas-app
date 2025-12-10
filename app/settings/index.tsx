import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const PRIMARY = "#084D6E";
const BG_DARK = "#d9e1e9ff";
const SURFACE = "#FFFFFF";
const TEXT_PRIMARY = "#072A4A";
const TEXT_MUTED = "#59708B";
const BORDER_SOFT = "#E6EEF7";
const ICON_BG = "#0B2740";

export default function SettingsScreen() {
  const router = useRouter();

  const Item = ({ icon, label, route }: any) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => route && router.push(route)}
    >
      <View style={styles.itemLeft}>
        <View style={styles.iconWrapper}>
          <MaterialIcons name={icon} size={22} color="#fff" />
        </View>
        <Text style={styles.itemLabel}>{label}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={TEXT_MUTED} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ajustes</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>

        <View style={styles.section}>
          <Item icon="person" label="Editar perfil" route="/account/edit" />
          <Item icon="lock" label="Cambiar contraseña" route="/account/change-password" />
          <Item icon="notifications" label="Notificaciones" route="/settings/notifications" />
          <Item icon="shield" label="Privacidad y seguridad" route="/settings/security" />
        </View>

        <View style={styles.section}>
          <Item icon="policy" label="Términos y condiciones" route="/settings/terms" />
          <Item icon="info" label="Política de privacidad" route="/settings/privacy" />
        </View>

        <View style={styles.section}>
          <Item icon="delete" label="Eliminar cuenta" route="/account/delete" />
          <Item icon="logout" label="Cerrar sesión" route="/logout" />
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
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: TEXT_PRIMARY,
  },

  section: {
    backgroundColor: SURFACE,
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    paddingVertical: 6,
  },

  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_SOFT,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT_PRIMARY,
  },
});
