// app/(tabs)/goals.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  Switch,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { api } from "../../src/api/client";

const PRIMARY = "#13ec5b";
const BG_DARK = "#020617";
const SURFACE = "#0b1120";

type FilterType = "active" | "completed" | "shared";

type ParticipantPivot = {
  role?: string;
  expected_contribution?: string | null;
};

type Participant = {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  pivot?: ParticipantPivot;
};

type SavingGoal = {
  id: number;
  name: string;
  description?: string | null;
  target_amount: number;
  current_amount: number;
  deadline?: string | null; // "2025-12-31"
  category?: string | null;
  is_group?: boolean;
  status?: "active" | "completed" | "archived";
  participants?: Participant[];
};

type GoalsIndexResponse =
  | SavingGoal[]
  | {
      data: SavingGoal[];
      [key: string]: any;
    };

function formatAmount(amount: number) {
  return amount.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getProgress(goal: SavingGoal): number {
  const target = goal.target_amount || 0;
  const current = goal.current_amount || 0;
  if (target <= 0) return 0;
  const p = (current / target) * 100;
  return Math.max(0, Math.min(100, p));
}

function isGoalCompleted(goal: SavingGoal): boolean {
  if (goal.status === "completed") return true;
  return goal.current_amount >= goal.target_amount && goal.target_amount > 0;
}

function formatDeadline(deadline?: string | null) {
  if (!deadline) return "Sin fecha límite";
  try {
    const date = new Date(deadline);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return deadline;
  }
}

function getInitials(name?: string, email?: string) {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

export default function GoalsScreen() {
  const [filter, setFilter] = useState<FilterType>("active");
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Crear meta
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalInitial, setGoalInitial] = useState("");
  const [goalDeadline, setGoalDeadline] = useState<Date>(new Date());
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [isGroup, setIsGroup] = useState(false);

  // Depósito
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState("");

  // ➕ Agregar persona a meta grupal
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [selectedGoalForMember, setSelectedGoalForMember] =
    useState<SavingGoal | null>(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberExpected, setMemberExpected] = useState("");

  const resetCreateForm = () => {
    setGoalName("");
    setGoalTarget("");
    setGoalInitial("");
    setGoalDeadline(new Date());
    setIsGroup(false);
  };

  const openCreateModal = () => {
    resetCreateForm();
    setCreateModalVisible(true);
  };

  const closeCreateModal = () => {
    setCreateModalVisible(false);
  };

  const openDepositModal = (goal: SavingGoal) => {
    setSelectedGoal(goal);
    setDepositAmount("");
    setDepositModalVisible(true);
  };

  const closeDepositModal = () => {
    setDepositModalVisible(false);
    setSelectedGoal(null);
    setDepositAmount("");
  };

  const openAddMemberModal = (goal: SavingGoal) => {
    setSelectedGoalForMember(goal);
    setMemberEmail("");
    setMemberExpected("");
    setAddMemberModalVisible(true);
  };

  const closeAddMemberModal = () => {
    setAddMemberModalVisible(false);
    setSelectedGoalForMember(null);
    setMemberEmail("");
    setMemberExpected("");
  };

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<GoalsIndexResponse>("/goals");
      const list = Array.isArray(res.data) ? res.data : res.data.data;
      setGoals(list || []);
    } catch (e: any) {
      console.log("Error loading goals:", e?.response?.data || e);
      setError("No se pudieron cargar las metas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const filteredGoals = useMemo(() => {
    if (filter === "shared") {
      return goals.filter((g) => g.is_group);
    }
    if (filter === "completed") {
      return goals.filter((g) => isGoalCompleted(g));
    }
    // active
    return goals.filter((g) => !isGoalCompleted(g));
  }, [goals, filter]);

  const handleCreateGoal = async () => {
    if (!goalName || !goalTarget) {
      Alert.alert("Campos incompletos", "Ingresa al menos nombre y objetivo.");
      return;
    }

    const target = parseFloat(goalTarget);
    const initial = goalInitial ? parseFloat(goalInitial) : 0;

    if (isNaN(target) || target <= 0) {
      Alert.alert("Monto objetivo inválido", "Ingresa un monto positivo.");
      return;
    }
    if (isNaN(initial) || initial < 0) {
      Alert.alert("Monto inicial inválido", "Ingresa un monto válido.");
      return;
    }

    const deadlineString = goalDeadline.toISOString().substring(0, 10);

    const payload: any = {
      name: goalName,
      target_amount: target,
      current_amount: initial,
      deadline: deadlineString,
      is_group: isGroup, // 👈 coincide con tu modelo
    };

    try {
      setLoadingAction(true);
      await api.post("/goals", payload);
      await fetchGoals();
      closeCreateModal();
      resetCreateForm();
    } catch (e: any) {
      console.log("Error creating goal:", e?.response?.data || e);
      const msg =
        e?.response?.data?.message ||
        "No se pudo crear la meta. Revisa los datos.";
      Alert.alert("Error", msg);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeposit = async () => {
    if (!selectedGoal) return;

    if (!depositAmount) {
      Alert.alert("Monto requerido", "Ingresa el monto a agregar.");
      return;
    }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Monto inválido", "Ingresa un monto positivo.");
      return;
    }

    try {
      setLoadingAction(true);

      // Intento 1: endpoint dedicado de depósito
      try {
        await api.post(`/goals/${selectedGoal.id}/deposit`, { amount });
      } catch (e: any) {
        const status = e?.response?.status;
        // Si no existe /deposit, actualizamos current_amount directamente
        if (status === 404 || status === 405) {
          const newCurrent =
            (selectedGoal.current_amount || 0) + parseFloat(depositAmount);
          await api.put(`/goals/${selectedGoal.id}`, {
            current_amount: newCurrent,
          });
        } else {
          throw e;
        }
      }

      await fetchGoals();
      closeDepositModal();
    } catch (e: any) {
      console.log("Error depositing to goal:", e?.response?.data || e);
      const msg =
        e?.response?.data?.message ||
        "No se pudo registrar el ahorro. Intenta de nuevo.";
      Alert.alert("Error", msg);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedGoalForMember) return;

    if (!memberEmail.trim()) {
      Alert.alert("Correo requerido", "Ingresa el correo de la persona.");
      return;
    }

    let expected: number | null = null;
    if (memberExpected.trim()) {
      const parsed = parseFloat(memberExpected);
      if (isNaN(parsed) || parsed < 0) {
        Alert.alert(
          "Monto inválido",
          "La aportación esperada debe ser un número válido."
        );
        return;
      }
      expected = parsed;
    }

    const payload: any = {
      email: memberEmail.trim(),
    };
    if (expected !== null) {
      payload.expected_contribution = expected;
    }

    try {
      setLoadingAction(true);
      await api.post(`/goals/${selectedGoalForMember.id}/members`, payload);
      await fetchGoals();
      closeAddMemberModal();
      Alert.alert(
        "Listo",
        "La persona fue agregada (o invitada) a la meta grupal."
      );
    } catch (e: any) {
      console.log("Error adding member:", e?.response?.data || e);
      const msg =
        e?.response?.data?.message ||
        "No se pudo agregar a la persona. Revisa el correo.";
      Alert.alert("Error", msg);
    } finally {
      setLoadingAction(false);
    }
  };

  const renderGoalCard = (goal: SavingGoal) => {
    const progress = getProgress(goal);
    const completed = isGoalCompleted(goal);

    let barColor = PRIMARY;
    if (progress < 40) barColor = "#f97316"; // naranja
    if (progress >= 80) barColor = "#a855f7"; // morado

    const iconName = (() => {
      const n = goal.name.toLowerCase();
      if (n.includes("coche") || n.includes("carro") || n.includes("auto"))
        return "directions-car";
      if (n.includes("viaje") || n.includes("vacaciones")) return "flight";
      if (n.includes("casa") || n.includes("departamento")) return "home";
      if (n.includes("macbook") || n.includes("laptop")) return "laptop-mac";
      return "savings";
    })() as keyof typeof MaterialIcons.glyphMap;

    const participants = goal.participants || [];
    const showParticipants = goal.is_group && participants.length > 0;

    return (
      <TouchableOpacity
        key={goal.id}
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => openDepositModal(goal)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardIconWrapper}>
              <MaterialIcons name={iconName} size={24} color="#3b82f6" />
            </View>
            <View>
              <Text style={styles.cardTitle}>{goal.name}</Text>
              <Text style={styles.cardSubtitle}>
                {goal.deadline
                  ? `Fecha límite: ${formatDeadline(goal.deadline)}`
                  : "Sin fecha límite"}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            {/* Botón agregar persona solo si es grupal */}
            {goal.is_group && (
              <TouchableOpacity
                onPress={() => openAddMemberModal(goal)}
                style={styles.iconSmallButton}
              >
                <MaterialIcons
                  name="person-add-alt"
                  size={18}
                  color="#22c55e"
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity>
              <MaterialIcons name="more-vert" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginTop: 6 }}>
          <View style={styles.cardAmountsRow}>
            <Text style={styles.cardAmountText}>
              ${formatAmount(goal.current_amount || 0)}{" "}
              <Text style={styles.cardAmountSub}>
                / ${formatAmount(goal.target_amount || 0)}
              </Text>
            </Text>
            <Text
              style={[
                styles.cardPercent,
                completed && { color: "#a855f7" },
              ]}
            >
              {Math.round(progress)}%
            </Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progress}%`, backgroundColor: barColor },
              ]}
            />
          </View>
        </View>

        {/* Badges */}
        <View style={{ marginTop: 6, flexDirection: "row", gap: 8 }}>
          {goal.is_group && (
            <View style={styles.sharedBadge}>
              <MaterialIcons name="groups" color="#22c55e" size={14} />
              <Text style={styles.sharedBadgeText}>Meta grupal</Text>
            </View>
          )}

          {completed && (
            <View style={styles.completedBadge}>
              <MaterialIcons name="check-circle" color="#22c55e" size={14} />
              <Text style={styles.completedBadgeText}>Completada</Text>
            </View>
          )}
        </View>

        {/* Participantes */}
        {showParticipants && (
          <View style={styles.participantsContainer}>
            <Text style={styles.participantsTitle}>Participantes</Text>
            <View style={styles.participantsRow}>
              {participants.slice(0, 4).map((p) => (
                <View key={p.id} style={styles.participantChip}>
                  <View style={styles.participantAvatar}>
                    <Text style={styles.participantInitials}>
                      {getInitials(p.name, p.email)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.participantName} numberOfLines={1}>
                      {p.name || p.email}
                    </Text>
                    {p.pivot?.expected_contribution && (
                      <Text style={styles.participantSub}>
                        Aporta: $
                        {formatAmount(
                          parseFloat(p.pivot.expected_contribution || "0")
                        )}
                      </Text>
                    )}
                  </View>
                </View>
              ))}

              {participants.length > 4 && (
                <View style={styles.moreParticipantsBadge}>
                  <Text style={styles.moreParticipantsText}>
                    +{participants.length - 4}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color="#e5e7eb" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Metas de Ahorro</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Segmented control */}
        <View style={styles.segmentWrapper}>
          <View style={styles.segmentBackground}>
            <TouchableOpacity
              style={[
                styles.segmentItem,
                filter === "active" && styles.segmentItemActive,
              ]}
              onPress={() => setFilter("active")}
            >
              <Text
                style={[
                  styles.segmentText,
                  filter === "active" && styles.segmentTextActive,
                ]}
              >
                Activas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentItem,
                filter === "completed" && styles.segmentItemActive,
              ]}
              onPress={() => setFilter("completed")}
            >
              <Text
                style={[
                  styles.segmentText,
                  filter === "completed" && styles.segmentTextActive,
                ]}
              >
                Completadas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentItem,
                filter === "shared" && styles.segmentItemActive,
              ]}
              onPress={() => setFilter("shared")}
            >
              <Text
                style={[
                  styles.segmentText,
                  filter === "shared" && styles.segmentTextActive,
                ]}
              >
                Grupales
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contenido */}
        {loading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>Cargando metas...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerFill}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchGoals}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: 96, paddingTop: 4 }}
          >
            {filteredGoals.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialIcons
                  name="savings"
                  size={40}
                  color="rgba(148,163,184,0.8)"
                />
                <Text style={styles.emptyTitle}>Sin metas aún</Text>
                <Text style={styles.emptyText}>
                  Crea tu primera meta con el botón verde de abajo.
                </Text>
              </View>
            ) : (
              filteredGoals.map(renderGoalCard)
            )}
          </ScrollView>
        )}

        {/* FAB Crear meta */}
        <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
          <MaterialIcons name="add" size={30} color="#020617" />
        </TouchableOpacity>

        {/* Modal Crear Meta */}
        <Modal
          visible={createModalVisible}
          animationType="slide"
          transparent
          onRequestClose={closeCreateModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nueva meta de ahorro</Text>
                <TouchableOpacity onPress={closeCreateModal}>
                  <MaterialIcons name="close" size={22} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Viaje a Cancún"
                  placeholderTextColor="#6b7280"
                  value={goalName}
                  onChangeText={setGoalName}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Monto objetivo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 20000"
                  placeholderTextColor="#6b7280"
                  keyboardType="decimal-pad"
                  value={goalTarget}
                  onChangeText={setGoalTarget}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Monto inicial (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 1000"
                  placeholderTextColor="#6b7280"
                  keyboardType="decimal-pad"
                  value={goalInitial}
                  onChangeText={setGoalInitial}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Fecha límite (opcional)</Text>

                <TouchableOpacity
                  onPress={() => setShowDeadlinePicker(true)}
                  style={[styles.input, { justifyContent: "center" }]}
                >
                  <Text style={{ color: "#f9fafb", fontSize: 13 }}>
                    {goalDeadline.toISOString().substring(0, 10)}
                  </Text>
                </TouchableOpacity>

                {showDeadlinePicker && (
                  <DateTimePicker
                    value={goalDeadline}
                    mode="date"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      setShowDeadlinePicker(false);
                      if (selectedDate) {
                        setGoalDeadline(selectedDate);
                      }
                    }}
                  />
                )}
              </View>

              <View
                style={[
                  styles.formField,
                  { flexDirection: "row", alignItems: "center" },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Meta grupal</Text>
                  <Text style={styles.helperText}>
                    Activa esta opción si ahorrarás con más personas.
                  </Text>
                </View>
                <Switch
                  value={isGroup}
                  onValueChange={setIsGroup}
                  trackColor={{ false: "#374151", true: PRIMARY }}
                  thumbColor={isGroup ? "#022c22" : "#111827"}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  loadingAction && { opacity: 0.7 },
                ]}
                onPress={handleCreateGoal}
                disabled={loadingAction}
              >
                <Text style={styles.saveButtonText}>
                  {loadingAction ? "Guardando..." : "Crear meta"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal Depósito */}
        <Modal
          visible={depositModalVisible}
          animationType="slide"
          transparent
          onRequestClose={closeDepositModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Añadir ahorro
                  {selectedGoal ? ` - ${selectedGoal.name}` : ""}
                </Text>
                <TouchableOpacity onPress={closeDepositModal}>
                  <MaterialIcons name="close" size={22} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {selectedGoal && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.label}>
                    Progreso actual:{" "}
                    <Text style={{ fontWeight: "700", color: "#e5e7eb" }}>
                      $
                      {formatAmount(selectedGoal.current_amount || 0)} / $
                      {formatAmount(selectedGoal.target_amount || 0)}
                    </Text>
                  </Text>
                </View>
              )}

              <View style={styles.formField}>
                <Text style={styles.label}>Monto a agregar</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 500"
                  placeholderTextColor="#6b7280"
                  keyboardType="decimal-pad"
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  loadingAction && { opacity: 0.7 },
                ]}
                onPress={handleDeposit}
                disabled={loadingAction}
              >
                <Text style={styles.saveButtonText}>
                  {loadingAction ? "Guardando..." : "Registrar ahorro"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal Agregar persona a meta */}
        <Modal
          visible={addMemberModalVisible}
          animationType="slide"
          transparent
          onRequestClose={closeAddMemberModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View className="modal-header" style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Agregar persona
                  {selectedGoalForMember
                    ? ` a "${selectedGoalForMember.name}"`
                    : ""}
                </Text>
                <TouchableOpacity onPress={closeAddMemberModal}>
                  <MaterialIcons name="close" size={22} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Correo electrónico</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor="#6b7280"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={memberEmail}
                  onChangeText={setMemberEmail}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>
                  Aportación esperada (opcional)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 500"
                  placeholderTextColor="#6b7280"
                  keyboardType="decimal-pad"
                  value={memberExpected}
                  onChangeText={setMemberExpected}
                />
              </View>

              <Text style={styles.helperText}>
                Si la persona no tiene cuenta, puedes manejar en el backend que
                se le envíe una invitación.
              </Text>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  loadingAction && { opacity: 0.7 },
                ]}
                onPress={handleAddMember}
                disabled={loadingAction}
              >
                <Text style={styles.saveButtonText}>
                  {loadingAction ? "Guardando..." : "Agregar a la meta"}
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
  safe: { flex: 1, backgroundColor: BG_DARK },
  container: { flex: 1, backgroundColor: BG_DARK, paddingHorizontal: 16 },
  header: {
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "700",
  },
  segmentWrapper: { marginTop: 8, marginBottom: 4 },
  segmentBackground: {
    flexDirection: "row",
    backgroundColor: "#020617",
    borderRadius: 999,
    padding: 2,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentItemActive: { backgroundColor: SURFACE },
  segmentText: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "500",
  },
  segmentTextActive: { color: "#f9fafb", fontWeight: "700" },
  scroll: { flex: 1, marginTop: 8 },
  centerFill: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8, color: "#9ca3af", fontSize: 12 },
  errorText: { color: "#f97373", fontSize: 14, marginBottom: 8 },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  retryText: { color: PRIMARY, fontWeight: "600", fontSize: 13 },

  // Cards
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "#1d283a",
    alignItems: "center",
    justifyContent: "center",
  },
  iconSmallButton: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#14532d",
    backgroundColor: "#022c22",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { color: "#f9fafb", fontSize: 15, fontWeight: "700" },
  cardSubtitle: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },
  cardAmountsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 4,
    marginBottom: 4,
  },
  cardAmountText: {
    color: "#f9fafb",
    fontSize: 15,
    fontWeight: "700",
  },
  cardAmountSub: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "400",
  },
  cardPercent: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: "600",
  },
  progressBarBackground: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#020617",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 999,
  },
  sharedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sharedBadgeText: {
    color: "#22c55e",
    fontSize: 11,
    fontWeight: "500",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  completedBadgeText: {
    color: "#22c55e",
    fontSize: 11,
    fontWeight: "500",
  },

  // Participantes
  participantsContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    paddingTop: 8,
  },
  participantsTitle: {
    color: "#9ca3af",
    fontSize: 11,
    marginBottom: 6,
    fontWeight: "500",
  },
  participantsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  participantChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#1f2937",
    maxWidth: "48%",
    gap: 6,
  },
  participantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  participantInitials: {
    color: "#e5e7eb",
    fontSize: 11,
    fontWeight: "700",
  },
  participantName: {
    color: "#f9fafb",
    fontSize: 12,
    fontWeight: "500",
  },
  participantSub: {
    color: "#9ca3af",
    fontSize: 11,
  },
  moreParticipantsBadge: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  moreParticipantsText: {
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: "600",
  },

  emptyBox: {
    marginTop: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  emptyTitle: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },

  // Modal & form
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.85)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: BG_DARK,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#1f2937",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    color: "#f9fafb",
    fontSize: 16,
    fontWeight: "700",
  },
  formField: { marginTop: 10 },
  label: {
    color: "#cbd5f5",
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "#020617",
    paddingHorizontal: 12,
    color: "#f9fafb",
    fontSize: 13,
    justifyContent: "center",
  },
  helperText: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 4,
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
    color: "#052e16",
    fontSize: 15,
    fontWeight: "700",
  },
});
