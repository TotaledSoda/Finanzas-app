import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { api } from "../src/api/client";

const PRIMARY = "#084D6E";
const BG_DARK = "#d9e1e9ff";
const SURFACE = "#FFFFFF";
const TEXT_PRIMARY = "#072A4A";
const TEXT_MUTED = "#59708B";
const BORDER_SOFT = "#E6EEF7";
const INPUT_BG = "#F0F5FB";
const BUTTON_TEXT = "#FFFFFF";
const PROGRESS_BG = "#EAF2FF";
const ICON_BG = "#0B2740";

type BudgetEnvelope = {
  id: number;
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
};

type DashboardResponse = {
  envelopes?: BudgetEnvelope[];
};

function formatAmount(n?: number | null) {
  const v = typeof n === "number" && !isNaN(n) ? n : 0;
  return v.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function EnvelopesScreen() {
  const router = useRouter();

  const [envelopes, setEnvelopes] = useState<BudgetEnvelope[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEnvelope, setSelectedEnvelope] =
    useState<BudgetEnvelope | null>(null);
  const [spendAmount, setSpendAmount] = useState("");
  const [spendDesc, setSpendDesc] = useState("");
  const [savingSpend, setSavingSpend] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadEnvelopes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<DashboardResponse>("/dashboard");
      setEnvelopes(res.data.envelopes ?? []);
    } catch (e: any) {
      console.log("Error cargando apartados:", e?.response?.data || e);
      setError("No se pudieron cargar los apartados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnvelopes();
  }, []);

  const openSpendModal = (env: BudgetEnvelope) => {
    setSelectedEnvelope(env);
    setSpendAmount("");
    setSpendDesc("");
    setModalVisible(true);
  };

  const closeSpendModal = () => {
    setModalVisible(false);
  };

  const handleSpend = async () => {
    if (!selectedEnvelope) return;

    const parsed = parseFloat(spendAmount.replace(/,/g, "").trim());
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert("Monto inválido", "Ingresa un monto numérico válido.");
      return;
    }

    try {
      setSavingSpend(true);

      await api.post(`/dashboard/envelopes/${selectedEnvelope.id}/spend`, {
        amount: parsed,
        description: spendDesc || undefined,
      });

      setModalVisible(false);
      setSelectedEnvelope(null);
      await loadEnvelopes();
    } catch (e: any) {
      console.log("Error registrando gasto en sobre:", e?.response?.data || e);
      Alert.alert(
        "Error",
        e?.response?.data?.message || "No se pudo registrar el gasto."
      );
    } finally {
      setSavingSpend(false);
    }
  };

  // 🔴 NUEVA LÓGICA: preguntar si quiere reembolso o solo eliminar
  const handleDeleteEnvelope = (env: BudgetEnvelope) => {
    Alert.alert(
      "Eliminar apartado",
      `¿Qué deseas hacer con el dinero restante de "${env.name}"?\n\nRestante: $${formatAmount(
        env.remaining
      )}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar sin reembolso",
          style: "destructive",
          onPress: () => deleteEnvelopeNoRefund(env.id),
        },
        {
          text: "Reembolsar y eliminar",
          onPress: () => deleteEnvelopeRefund(env.id),
        },
      ]
    );
  };

  const deleteEnvelopeRefund = async (id: number) => {
    try {
      setDeletingId(id);
      await api.delete(`/dashboard/envelopes/${id}/refund`);
      await loadEnvelopes();
    } catch (e: any) {
      console.log("Error eliminando apartado (refund):", e?.response?.data || e);
      Alert.alert(
        "Error",
        e?.response?.data?.message ||
          "No se pudo eliminar el apartado con reembolso."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const deleteEnvelopeNoRefund = async (id: number) => {
    try {
      setDeletingId(id);
      await api.delete(`/dashboard/envelopes/${id}/delete`);
      await loadEnvelopes();
    } catch (e: any) {
      console.log(
        "Error eliminando apartado (no refund):",
        e?.response?.data || e
      );
      Alert.alert(
        "Error",
        e?.response?.data?.message ||
          "No se pudo eliminar el apartado sin reembolso."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header simple con back */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back-ios" size={18} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Todos los apartados</Text>
          <View style={{ width: 32 }} />
        </View>

        {loading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>Cargando apartados...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerFill}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadEnvelopes}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : envelopes.length === 0 ? (
          <View style={styles.centerFill}>
            <Text style={styles.emptyText}>
              No tienes apartados creados esta semana.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {envelopes.map((env) => {
              const progress =
                env.allocated > 0
                  ? Math.min(100, Math.max(0, (env.spent / env.allocated) * 100))
                  : 0;

              return (
                <View key={env.id} style={styles.envelopeCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.envelopeName}>{env.name}</Text>
                    <Text style={styles.envelopeSubtitle}>
                      Asignado: ${formatAmount(env.allocated)} · Gastado: $
                      {formatAmount(env.spent)} · Restante: $
                      {formatAmount(env.remaining)}
                    </Text>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${progress}%` },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.envelopeActions}>
                    <TouchableOpacity
                      style={styles.smallButton}
                      onPress={() => openSpendModal(env)}
                    >
                      <MaterialIcons
                        name="payments"
                        size={18}
                        color={BUTTON_TEXT}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.smallButton,
                        { backgroundColor: "#fee2e2" },
                      ]}
                      onPress={() => handleDeleteEnvelope(env)}
                      disabled={deletingId === env.id}
                    >
                      {deletingId === env.id ? (
                        <ActivityIndicator size="small" color="#b91c1c" />
                      ) : (
                        <MaterialIcons
                          name="delete-outline"
                          size={18}
                          color="#b91c1c"
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Modal para gasto */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={closeSpendModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedEnvelope ? selectedEnvelope.name : "Apartado"}
                </Text>
                <TouchableOpacity onPress={closeSpendModal}>
                  <MaterialIcons name="close" size={22} color={TEXT_MUTED} />
                </TouchableOpacity>
              </View>

              {selectedEnvelope && (
                <Text style={styles.modalSubtitle}>
                  Restante: ${formatAmount(selectedEnvelope.remaining)}
                </Text>
              )}

              <View style={{ marginTop: 12 }}>
                <Text style={styles.label}>Monto del gasto</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 250"
                  placeholderTextColor={TEXT_MUTED}
                  keyboardType="numeric"
                  value={spendAmount}
                  onChangeText={setSpendAmount}
                />
              </View>

              <View style={{ marginTop: 10 }}>
                <Text style={styles.label}>Descripción (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Super, gasolina..."
                  placeholderTextColor={TEXT_MUTED}
                  value={spendDesc}
                  onChangeText={setSpendDesc}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, savingSpend && { opacity: 0.7 }]}
                onPress={handleSpend}
                disabled={savingSpend}
              >
                <Text style={styles.saveButtonText}>
                  {savingSpend ? "Guardando..." : "Registrar gasto"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    paddingTop: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },
  centerFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    color: TEXT_MUTED,
    fontSize: 12,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    marginBottom: 8,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  retryText: {
    color: PRIMARY,
    fontWeight: "600",
    fontSize: 13,
  },
  emptyText: {
    color: TEXT_MUTED,
    fontSize: 12,
  },
  envelopeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    backgroundColor: SURFACE,
    marginBottom: 8,
    gap: 10,
  },
  envelopeName: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: "700",
  },
  envelopeSubtitle: {
    color: TEXT_MUTED,
    fontSize: 11,
    marginTop: 2,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 999,
    backgroundColor: PROGRESS_BG,
    marginTop: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  envelopeActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  smallButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: ICON_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(7,42,74,0.1)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    borderTopWidth: 1,
    borderColor: BORDER_SOFT,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: "700",
  },
  modalSubtitle: {
    marginTop: 8,
    color: TEXT_MUTED,
    fontSize: 12,
  },
  label: {
    color: TEXT_MUTED,
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    backgroundColor: INPUT_BG,
    paddingHorizontal: 12,
    color: TEXT_PRIMARY,
    fontSize: 13,
  },
  saveButton: {
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: PRIMARY,
    borderRadius: 999,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: BUTTON_TEXT,
    fontSize: 15,
    fontWeight: "700",
  },
});
