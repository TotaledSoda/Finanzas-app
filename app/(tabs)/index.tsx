import { SafeAreaView } from "react-native-safe-area-context";
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
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "../../src/api/client";
import { useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useState, useMemo, useCallback } from "react";

// Paleta que inspira confianza (azules profundos, acentos teal suaves)
const PRIMARY = "#084D6E"; // azul principal
const BG_DARK = "#d9e1e9ff"; // fondo claro y sereno
const SURFACE = "#FFFFFF"; // tarjetas
const TEXT_PRIMARY = "#072A4A"; // texto principal, azul oscuro
const TEXT_MUTED = "#59708B"; // texto secundario, gris azulado
const BORDER_SOFT = "#E6EEF7"; // bordes sutiles
const AVATAR_BG = PRIMARY;
const ICON_BG = "#0B2740"; // fondo de iconos redondos
const INPUT_BG = "#F0F5FB"; // fondo input suave
const BUTTON_TEXT = "#FFFFFF";
const PROGRESS_BG = "#EAF2FF"; // fondo barra de progreso
const ICON_ACCENT = "#2DD4BF"; // acento teal para algunos iconos
const CHANGE_POS = "#16A34A"; // verde positivo
const CHANGE_NEG = "#DC2626"; // rojo negativo

type IncomeFrequency = "weekly" | "biweekly" | "monthly";

// ====== Tipos alineados al backend ====== //
type SavingGoal = {
  id: number;
  name: string;
  current_amount?: number | null;
  target_amount?: number | null;
  deadline?: string | null;
  is_group?: boolean;
};

type Bill = {
  id: number;
  name: string;
  amount?: number | null;
  due_date?: string | null;
  status?: "pending" | "paid" | string;
};

type BudgetEnvelope = {
  id: number;
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
};

type DashboardResponse = {
  user?: { name?: string | null };
  savings?: { total?: number | null; monthly_change?: number | null };
  bills?: { pending_count?: number | null; paid_this_month?: number | null; next?: Bill[] };
  goals?: SavingGoal[];
  tandas?: {
    active_count?: number | null;
    next_payment?: {
      id: number;
      name: string;
      next_payment_date?: string | null;
      contribution_amount?: number | null;
    } | null;
  };
  calendar?: {
    upcoming_events?: { id: number; title: string; date: string; type: string; amount?: number | null }[];
    daily_expenses?: { date: string; total: number }[];
  };
  income?: {
    weekly_income?: number | null;
    spent_this_week?: number | null;
    available_this_week?: number | null; // puede venir negativo
    base_amount?: number | null;
    frequency?: IncomeFrequency | null;
    payday_weekday?: string | null; // "mon"..."sun"
    payday_day_of_month?: number | null; // recomendado
  };
  envelopes?: BudgetEnvelope[];
};

function formatAmount(raw?: number | null) {
  const amount = typeof raw === "number" && !isNaN(raw) ? raw : 0;
  return amount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "Sin fecha";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

// ====== Helpers de conversión a semanal (preview) ====== //
const WEEKS_PER_MONTH = 52 / 12; // 4.333333...
function toWeeklyAmount(baseAmount: number, freq: IncomeFrequency) {
  if (!isFinite(baseAmount) || baseAmount < 0) return 0;
  switch (freq) {
    case "weekly":
      return baseAmount;
    case "biweekly":
      return baseAmount / 2;
    case "monthly":
      return baseAmount / WEEKS_PER_MONTH;
    default:
      return baseAmount;
  }
}

const weekdayShort = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
function weekdayToBackendValue(idx1to7: number) {
  const map = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  return map[Math.min(7, Math.max(1, idx1to7)) - 1];
}

function backendWeekdayToIdx(v?: string | null) {
  if (!v) return null;
  const map: Record<string, number> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };
  return map[String(v).toLowerCase()] ?? null;
}

export default function DashboardScreen() {
  const router = useRouter();

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ingreso (input) y frecuencia
  const [incomeInput, setIncomeInput] = useState<string>("");
  const [incomeFrequency, setIncomeFrequency] = useState<IncomeFrequency>("weekly");
  const [savingIncome, setSavingIncome] = useState(false);

  // día de pago
  const [paydayWeekday, setPaydayWeekday] = useState<number>(5); // 1-7
  const [paydayDayOfMonth, setPaydayDayOfMonth] = useState<number>(15); // 1-31

  // auto save
  const [autoSavingIncome, setAutoSavingIncome] = useState(false);

  // botón cubrir déficit
  const [coveringDeficit, setCoveringDeficit] = useState(false);
  const [goalPickerVisible, setGoalPickerVisible] = useState(false);

  const goals = useMemo(() => data?.goals ?? [], [data]);

  const goalsWithBalance = useMemo(
    () =>
      goals.filter(
        (g) =>
          typeof g.current_amount === "number" &&
          !isNaN(g.current_amount) &&
          (g.current_amount ?? 0) > 0
      ),
    [goals]
  );

  const upcomingBills = useMemo(() => data?.bills?.next ?? [], [data]);

  const envelopes = useMemo(() => data?.envelopes ?? [], [data]);
  const envelopesToShow = useMemo(() => envelopes.slice(0, 2), [envelopes]);

  const totalSavings = data?.savings?.total ?? 0;
  const monthlyChange = data?.savings?.monthly_change ?? 0;

  const rawName = data?.user?.name ?? "";
  const userName = rawName.trim().length > 0 ? rawName : "";
  const firstName = userName.split(" ")[0];

  const spentThisWeek = data?.income?.spent_this_week ?? 0;
  const availableThisWeek = data?.income?.available_this_week ?? 0;

  const isDeficit = availableThisWeek < 0;
  const deficit = Math.abs(availableThisWeek);

  // formulario para crear sobre
  const [envelopeName, setEnvelopeName] = useState("");
  const [envelopeAmount, setEnvelopeAmount] = useState("");
  const [savingEnvelope, setSavingEnvelope] = useState(false);

  // registrar gasto en sobre
  const [envelopeModalVisible, setEnvelopeModalVisible] = useState(false);
  const [selectedEnvelope, setSelectedEnvelope] = useState<BudgetEnvelope | null>(null);
  const [envelopeSpendAmount, setEnvelopeSpendAmount] = useState("");
  const [envelopeSpendDesc, setEnvelopeSpendDesc] = useState("");
  const [savingEnvelopeSpend, setSavingEnvelopeSpend] = useState(false);

  // ingreso extra
  const [extraIncomeModalVisible, setExtraIncomeModalVisible] = useState(false);
  const [extraIncomeAmount, setExtraIncomeAmount] = useState("");
  const [savingExtraIncome, setSavingExtraIncome] = useState(false);

  // eliminar / reembolsar sobres
  const [deletingEnvelopeId, setDeletingEnvelopeId] = useState<number | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<DashboardResponse>("/dashboard");
      setData(res.data || {});
    } catch (e: any) {
      console.log("Error cargando dashboard:", e?.response?.data || e);
      setError("No se pudo cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  // precargar ingreso/frecuencia/día
  useEffect(() => {
    if (!data?.income) return;

    const inc = data.income;

    if (inc.base_amount != null) setIncomeInput(inc.base_amount.toFixed(2));
    else if (inc.weekly_income != null) setIncomeInput(inc.weekly_income.toFixed(2));

    if (inc.frequency) setIncomeFrequency(inc.frequency as IncomeFrequency);

    const wd = backendWeekdayToIdx(inc.payday_weekday);
    if (wd) setPaydayWeekday(wd);

    if (typeof inc.payday_day_of_month === "number" && inc.payday_day_of_month >= 1 && inc.payday_day_of_month <= 31) {
      setPaydayDayOfMonth(inc.payday_day_of_month);
    }
  }, [data?.income]);

  // preview semanal en vivo
  const parsedBase = useMemo(() => {
    const n = parseFloat(incomeInput.replace(/,/g, "").trim());
    return isNaN(n) ? 0 : n;
  }, [incomeInput]);

  const weeklyPreview = useMemo(() => {
    return toWeeklyAmount(parsedBase, incomeFrequency);
  }, [parsedBase, incomeFrequency]);

  const handleNewSaving = () => router.push("/(tabs)/goals");
  const handleNewBill = () => router.push("/(tabs)/bills");

  // guardado manual (backup)
  const handleSaveIncome = async () => {
    const parsed = parseFloat(incomeInput.replace(/,/g, "").trim());
    if (isNaN(parsed) || parsed < 0) {
      Alert.alert("Dato inválido", "Ingresa un sueldo válido.");
      return;
    }

    try {
      setSavingIncome(true);

      await api.post("/dashboard/income-settings", {
        amount: parsed,
        frequency: incomeFrequency,
        payday_weekday: incomeFrequency === "weekly" ? weekdayToBackendValue(paydayWeekday) : null,
        payday_day_of_month: incomeFrequency !== "weekly" ? paydayDayOfMonth : null,
      });

      await loadDashboard();
    } catch (e: any) {
      console.log("Error guardando ingreso:", e?.response?.data || e);
      Alert.alert("Error", "No se pudo guardar el sueldo. Inténtalo de nuevo.");
    } finally {
      setSavingIncome(false);
    }
  };

  // ✅ Auto-save: cuando cambie monto/frecuencia/día (debounce 700ms)
  useEffect(() => {
    const parsed = parseFloat(incomeInput.replace(/,/g, "").trim());
    if (isNaN(parsed) || parsed < 0) return;

    const t = setTimeout(async () => {
      try {
        setAutoSavingIncome(true);

        await api.post("/dashboard/income-settings", {
          amount: parsed,
          frequency: incomeFrequency,
          payday_weekday: incomeFrequency === "weekly" ? weekdayToBackendValue(paydayWeekday) : null,
          payday_day_of_month: incomeFrequency !== "weekly" ? paydayDayOfMonth : null,
        });

        await loadDashboard();
      } catch (e: any) {
        console.log("Auto-save income error:", e?.response?.data || e);
      } finally {
        setAutoSavingIncome(false);
      }
    }, 700);

    return () => clearTimeout(t);
  }, [incomeInput, incomeFrequency, paydayWeekday, paydayDayOfMonth]);

  // ingreso extra modal
  const openExtraIncomeModal = () => {
    setExtraIncomeAmount("");
    setExtraIncomeModalVisible(true);
  };
  const closeExtraIncomeModal = () => setExtraIncomeModalVisible(false);

  const handleSaveExtraIncome = async () => {
    const parsed = parseFloat(extraIncomeAmount.replace(/,/g, "").trim());
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert("Monto inválido", "Ingresa un monto de ingreso extra válido.");
      return;
    }

    try {
      setSavingExtraIncome(true);
      await api.post("/dashboard/extra-income", { amount: parsed });
      setExtraIncomeModalVisible(false);
      await loadDashboard();
    } catch (e: any) {
      console.log("Error agregando ingreso extra:", e?.response?.data || e);
      Alert.alert("Error", e?.response?.data?.message || "No se pudo registrar el ingreso extra.");
    } finally {
      setSavingExtraIncome(false);
    }
  };

  const handleCreateEnvelope = async () => {
    if (!envelopeName || !envelopeAmount) {
      Alert.alert("Faltan datos", "Escribe un nombre y un monto para el apartado.");
      return;
    }

    const parsed = parseFloat(envelopeAmount.replace(/,/g, "").trim());
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert("Monto inválido", "Ingresa un monto numérico válido.");
      return;
    }

    try {
      setSavingEnvelope(true);
      await api.post("/dashboard/envelopes", { name: envelopeName, allocated: parsed });
      setEnvelopeName("");
      setEnvelopeAmount("");
      await loadDashboard();
    } catch (e: any) {
      console.log("Error creando sobre:", e?.response?.data || e);
      Alert.alert("Error", e?.response?.data?.message || "No se pudo crear el apartado.");
    } finally {
      setSavingEnvelope(false);
    }
  };

  const openEnvelopeSpendModal = (env: BudgetEnvelope) => {
    setSelectedEnvelope(env);
    setEnvelopeSpendAmount("");
    setEnvelopeSpendDesc("");
    setEnvelopeModalVisible(true);
  };

  const closeEnvelopeSpendModal = () => setEnvelopeModalVisible(false);

  const handleEnvelopeSpend = async () => {
    if (!selectedEnvelope) return;

    const parsed = parseFloat(envelopeSpendAmount.replace(/,/g, "").trim());
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert("Monto inválido", "Ingresa un monto numérico válido.");
      return;
    }

    try {
      setSavingEnvelopeSpend(true);
      await api.post(`/dashboard/envelopes/${selectedEnvelope.id}/spend`, {
        amount: parsed,
        description: envelopeSpendDesc || undefined,
      });

      setEnvelopeModalVisible(false);
      setSelectedEnvelope(null);
      await loadDashboard();
    } catch (e: any) {
      console.log("Error registrando gasto en sobre:", e?.response?.data || e);
      Alert.alert("Error", e?.response?.data?.message || "No se pudo registrar el gasto.");
    } finally {
      setSavingEnvelopeSpend(false);
    }
  };

  const handleEnvelopeLongPress = (env: BudgetEnvelope) => {
    Alert.alert(
      "Opciones del apartado",
      `¿Qué deseas hacer con "${env.name}"?\n\nRestante: $${formatAmount(env.remaining)}`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar sin reembolso", style: "destructive", onPress: () => deleteEnvelopeNoRefund(env.id) },
        { text: "Reembolsar y eliminar", onPress: () => deleteEnvelopeRefund(env.id) },
      ]
    );
  };

  const deleteEnvelopeRefund = async (id: number) => {
    try {
      setDeletingEnvelopeId(id);
      await api.delete(`/dashboard/envelopes/${id}/refund`);
      await loadDashboard();
    } catch (e: any) {
      console.log("Error eliminando apartado (refund):", e?.response?.data || e);
      Alert.alert("Error", e?.response?.data?.message || "No se pudo eliminar el apartado con reembolso.");
    } finally {
      setDeletingEnvelopeId(null);
    }
  };

  const deleteEnvelopeNoRefund = async (id: number) => {
    try {
      setDeletingEnvelopeId(id);
      await api.delete(`/dashboard/envelopes/${id}/delete`);
      await loadDashboard();
    } catch (e: any) {
      console.log("Error eliminando apartado (no refund):", e?.response?.data || e);
      Alert.alert("Error", e?.response?.data?.message || "No se pudo eliminar el apartado sin reembolso.");
    } finally {
      setDeletingEnvelopeId(null);
    }
  };

  // cubrir déficit
  const handleCoverDeficit = () => {
    if (!isDeficit) return;

    if (goalsWithBalance.length === 0) {
      Alert.alert("Sin ahorro disponible", "No tienes metas con saldo disponible para cubrir el déficit.");
      return;
    }

    if (goalsWithBalance.length === 1) {
      confirmCoverWithGoal(goalsWithBalance[0]);
      return;
    }

    setGoalPickerVisible(true);
  };

  const confirmCoverWithGoal = (goal: SavingGoal) => {
    Alert.alert(
      "Usar ahorro",
      `Vas a usar hasta $${formatAmount(deficit)} de tu meta "${goal.name}" para cubrir el déficit de esta semana (si el saldo alcanza).`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", style: "destructive", onPress: () => doCoverDeficit(goal.id) },
      ]
    );
  };

  const doCoverDeficit = async (goalId?: number) => {
    if (!isDeficit) return;

    try {
      setCoveringDeficit(true);

      const payload: any = {};
      if (goalId) payload.saving_goal_id = goalId;

      await api.post("/dashboard/cover-deficit-from-savings", payload);
      setGoalPickerVisible(false);
      await loadDashboard();
    } catch (e: any) {
      console.log("Error cubriendo déficit:", e?.response?.data || e);
      Alert.alert("Error", e?.response?.data?.message || "No se pudo cubrir el déficit con tu ahorro.");
    } finally {
      setCoveringDeficit(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerLeft}
            activeOpacity={0.8}
            onPress={() => router.push("/account")}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.helloText}>Hola, {firstName}!</Text>
              <Text style={styles.subHelloText}>Toca aquí para ver tu cuenta</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons name="notifications" size={20} color={BUTTON_TEXT} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/settings")}>
              <MaterialIcons name="settings" size={20} color={BUTTON_TEXT} />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>Cargando dashboard...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerFill}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadDashboard}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 96 }}>
              {/* Tarjeta de ingreso */}
              <View style={styles.incomeCard}>
                <Text style={styles.sectionTitle}>Tu ingreso</Text>

                {/* Chips de frecuencia */}
                <View style={styles.freqRow}>
                  {[
                    { key: "weekly", label: "Semanal" },
                    { key: "biweekly", label: "Quincenal" },
                    { key: "monthly", label: "Mensual" },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => setIncomeFrequency(opt.key as IncomeFrequency)}
                      style={[styles.freqChip, incomeFrequency === opt.key && styles.freqChipActive]}
                    >
                      <Text style={[styles.freqChipText, incomeFrequency === opt.key && styles.freqChipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Selector de día de pago */}
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.label}>Día de pago</Text>

                  {incomeFrequency === "weekly" ? (
                    <View style={styles.freqRow}>
                      {weekdayShort.map((d, idx) => {
                        const dayNum = idx + 1;
                        const active = paydayWeekday === dayNum;
                        return (
                          <TouchableOpacity
                            key={d}
                            onPress={() => setPaydayWeekday(dayNum)}
                            style={[styles.freqChip, active && styles.freqChipActive]}
                          >
                            <Text style={[styles.freqChipText, active && styles.freqChipTextActive]}>
                              {d}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                      <View style={{ flexDirection: "row" }}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                          const active = paydayDayOfMonth === day;
                          return (
                            <TouchableOpacity
                              key={day}
                              onPress={() => setPaydayDayOfMonth(day)}
                              style={[
                                styles.freqChip,
                                active && styles.freqChipActive,
                                { marginRight: 6 },
                              ]}
                            >
                              <Text style={[styles.freqChipText, active && styles.freqChipTextActive]}>
                                {day}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  )}

                  <Text style={[styles.incomeAvailable, { marginTop: 6 }]}>
                    Sueldo semanal estimado:{" "}
                    <Text style={styles.incomeAvailableAmount}>${formatAmount(weeklyPreview)}</Text>
                    {autoSavingIncome ? <Text style={{ color: TEXT_MUTED }}> · guardando...</Text> : null}
                  </Text>
                </View>

                <View style={styles.incomeRow}>
                  <TextInput
                    style={styles.incomeInput}
                    keyboardType="numeric"
                    value={incomeInput}
                    onChangeText={setIncomeInput}
                    placeholder="0.00"
                    placeholderTextColor={TEXT_MUTED}
                  />

                  {/* Botón ingreso extra */}
                  <TouchableOpacity
                    style={styles.incomeExtraButton}
                    onPress={openExtraIncomeModal}
                    disabled={savingExtraIncome}
                  >
                    <MaterialIcons name="add-circle-outline" size={18} color={PRIMARY} />
                    <Text style={styles.incomeExtraText}>Ingreso extra</Text>
                  </TouchableOpacity>

                  {/* Guardar manual (opcional) */}
                  <TouchableOpacity
                    style={styles.incomeSaveButton}
                    onPress={handleSaveIncome}
                    disabled={savingIncome}
                  >
                    {savingIncome ? (
                      <ActivityIndicator size="small" color={BUTTON_TEXT} />
                    ) : (
                      <Text style={styles.incomeSaveText}>Guardar</Text>
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.incomeAvailable}>
                  Gastado esta semana:{" "}
                  <Text style={styles.incomeAvailableAmount}>${formatAmount(spentThisWeek)}</Text>
                </Text>
                <Text style={styles.incomeAvailable}>
                  Disponible esta semana:{" "}
                  <Text style={[styles.incomeAvailableAmount, isDeficit && { color: CHANGE_NEG }]}>
                    ${formatAmount(availableThisWeek)}
                  </Text>
                </Text>

                {/* Botón para cubrir déficit con ahorro */}
                {isDeficit && totalSavings > 0 && (
                  <TouchableOpacity
                    style={styles.deficitButton}
                    onPress={handleCoverDeficit}
                    activeOpacity={0.8}
                    disabled={coveringDeficit}
                  >
                    {coveringDeficit ? (
                      <ActivityIndicator size="small" color={BUTTON_TEXT} />
                    ) : (
                      <>
                        <MaterialIcons name="savings" size={18} color={BUTTON_TEXT} />
                        <Text style={styles.deficitButtonText}>Usar ${formatAmount(deficit)} de mi ahorro</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {isDeficit && totalSavings <= 0 && (
                  <Text style={styles.deficitWarning}>
                    Estás en números rojos y no tienes ahorro disponible para cubrirlo.
                  </Text>
                )}
              </View>

              {/* Apartados / sobres */}
              <View style={styles.envelopesCard}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <Text style={styles.sectionTitle}>Apartados de la semana</Text>
                    {envelopes.length > 0 && (
                      <Text style={styles.envelopesCountText}>{envelopes.length} apartado(s)</Text>
                    )}
                  </View>

                  {envelopes.length > 2 && (
                    <TouchableOpacity
                      onPress={() => router.push("/envelopes")}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.viewAllText}>Ver todos</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.envelopeFormRow}>
                  <TextInput
                    style={[styles.envelopeInput, { flex: 1 }]}
                    placeholder="Ej. Comida"
                    placeholderTextColor={TEXT_MUTED}
                    value={envelopeName}
                    onChangeText={setEnvelopeName}
                  />
                  <TextInput
                    style={[styles.envelopeInput, { width: 90, marginLeft: 6 }]}
                    placeholder="1000"
                    placeholderTextColor={TEXT_MUTED}
                    keyboardType="numeric"
                    value={envelopeAmount}
                    onChangeText={setEnvelopeAmount}
                  />
                  <TouchableOpacity
                    style={styles.envelopeAddButton}
                    onPress={handleCreateEnvelope}
                    disabled={savingEnvelope}
                  >
                    {savingEnvelope ? (
                      <ActivityIndicator size="small" color={BUTTON_TEXT} />
                    ) : (
                      <MaterialIcons name="add" size={20} color={BUTTON_TEXT} />
                    )}
                  </TouchableOpacity>
                </View>

                {envelopes.length === 0 ? (
                  <Text style={styles.emptyText}>
                    Crea apartados para repartir tu sueldo (ej. comida, transporte, ocio).
                  </Text>
                ) : (
                  envelopesToShow.map((env) => {
                    const progress =
                      env.allocated > 0 ? Math.min(100, Math.max(0, (env.spent / env.allocated) * 100)) : 0;

                    const isDeleting = deletingEnvelopeId === env.id;

                    return (
                      <TouchableOpacity
                        key={env.id}
                        style={styles.envelopeRow}
                        activeOpacity={1}
                        onLongPress={() => handleEnvelopeLongPress(env)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.envelopeTitle}>{env.name}</Text>
                          <Text style={styles.envelopeSubtitle}>
                            Gastado: ${formatAmount(env.spent)} / ${formatAmount(env.allocated)} · Restante: $
                            {formatAmount(env.remaining)}
                          </Text>
                          <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                          </View>
                        </View>

                        <TouchableOpacity
                          style={styles.envelopeSpendButton}
                          onPress={() => openEnvelopeSpendModal(env)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <ActivityIndicator size="small" color={BUTTON_TEXT} />
                          ) : (
                            <MaterialIcons name="payments" size={18} color={BUTTON_TEXT} />
                          )}
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>

              {/* Ahorro total */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Ahorro total</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryAmount}>${formatAmount(totalSavings)}</Text>
                  <View style={styles.changeBadge}>
                    <MaterialIcons
                      name={monthlyChange >= 0 ? "trending-up" : "trending-down"}
                      size={18}
                      color={monthlyChange >= 0 ? CHANGE_POS : CHANGE_NEG}
                    />
                    <Text style={[styles.changeText, { color: monthlyChange >= 0 ? CHANGE_POS : CHANGE_NEG }]}>
                      ${formatAmount(monthlyChange)} este mes
                    </Text>
                  </View>
                </View>
                <Text style={styles.summaryNote}>Sigue aportando de forma constante para alcanzar tus metas.</Text>
              </View>

              {/* Acciones rápidas */}
              <Text style={styles.sectionTitle}>Acciones rápidas</Text>
              <View style={styles.quickRow}>
                <TouchableOpacity style={styles.quickButtonPrimary} onPress={handleNewSaving}>
                  <MaterialIcons name="savings" size={20} color={BUTTON_TEXT} />
                  <Text style={styles.quickPrimaryText}>Nueva meta</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.quickButtonSecondary} onPress={handleNewBill}>
                  <MaterialIcons name="receipt-long" size={20} color={TEXT_MUTED} />
                  <Text style={styles.quickSecondaryText}>Nuevo pago</Text>
                </TouchableOpacity>
              </View>

              {/* Metas */}
              <Text style={styles.sectionTitle}>Mis metas</Text>
              {goals.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>Aún no tienes metas creadas.</Text>
                </View>
              ) : (
                goals.slice(0, 3).map((goal) => {
                  const current = typeof goal.current_amount === "number" ? goal.current_amount : 0;
                  const target = typeof goal.target_amount === "number" ? goal.target_amount : 0;
                  const progress = target > 0 ? Math.min(100, Math.max(0, (current / target) * 100)) : 0;

                  return (
                    <View key={goal.id} style={styles.goalCard}>
                      <View style={styles.goalRow}>
                        <View>
                          <Text style={styles.goalTitle}>{goal.name}</Text>
                          <Text style={styles.goalSubtitle} numberOfLines={1}>
                            {goal.deadline ? `Fecha límite: ${formatDate(goal.deadline)}` : "Sin fecha límite"}
                          </Text>
                        </View>
                        <Text style={styles.goalAmount}>
                          ${formatAmount(current)} <Text style={styles.goalAmountSub}>/ ${formatAmount(target)}</Text>
                        </Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                      </View>
                    </View>
                  );
                })
              )}

              {/* Próximos vencimientos */}
              <Text style={styles.sectionTitle}>Próximos vencimientos</Text>
              {upcomingBills.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>No tienes pagos próximos.</Text>
                </View>
              ) : (
                upcomingBills.slice(0, 4).map((bill) => (
                  <View key={bill.id} style={styles.billRow}>
                    <View style={styles.billLeft}>
                      <View style={styles.billIconWrapper}>
                        <MaterialIcons name="receipt-long" size={18} color={ICON_ACCENT} />
                      </View>
                      <View>
                        <Text style={styles.billName}>{bill.name}</Text>
                        <Text style={styles.billSubtitle}>
                          {formatDate(bill.due_date)} · {bill.status === "paid" ? "Pagado" : "Pendiente"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.billAmount}>${formatAmount(bill.amount)}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Modal para elegir meta cuando hay varias */}
            <Modal visible={goalPickerVisible} animationType="slide" transparent onRequestClose={() => setGoalPickerVisible(false)}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Elige una meta para usar ahorro</Text>
                    <TouchableOpacity onPress={() => setGoalPickerVisible(false)}>
                      <MaterialIcons name="close" size={22} color={TEXT_MUTED} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.modalSubtitle}>
                    Déficit actual: ${formatAmount(deficit)}{"\n"}Selecciona de cuál meta quieres descontar.
                  </Text>

                  <ScrollView style={{ maxHeight: 260, marginTop: 8 }} contentContainerStyle={{ paddingBottom: 12 }}>
                    {goalsWithBalance.map((goal) => (
                      <TouchableOpacity
                        key={goal.id}
                        style={styles.goalRowModal}
                        onPress={() => confirmCoverWithGoal(goal)}
                        disabled={coveringDeficit}
                      >
                        <View>
                          <Text style={styles.goalTitle}>{goal.name}</Text>
                          <Text style={styles.goalSubtitle}>Saldo disponible: ${formatAmount(goal.current_amount ?? 0)}</Text>
                        </View>
                        <MaterialIcons name="arrow-forward-ios" size={16} color={TEXT_MUTED} />
                      </TouchableOpacity>
                    ))}
                    {goalsWithBalance.length === 0 && <Text style={styles.emptyText}>No tienes metas con saldo disponible.</Text>}
                  </ScrollView>
                </View>
              </View>
            </Modal>

            {/* Modal registrar gasto en apartado */}
            <Modal visible={envelopeModalVisible} animationType="slide" transparent onRequestClose={closeEnvelopeSpendModal}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedEnvelope ? selectedEnvelope.name : "Apartado"}</Text>
                    <TouchableOpacity onPress={closeEnvelopeSpendModal}>
                      <MaterialIcons name="close" size={22} color={TEXT_MUTED} />
                    </TouchableOpacity>
                  </View>

                  {selectedEnvelope && <Text style={styles.modalSubtitle}>Restante: ${formatAmount(selectedEnvelope.remaining)}</Text>}

                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.label}>Monto del gasto</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ej. 250"
                      placeholderTextColor={TEXT_MUTED}
                      keyboardType="numeric"
                      value={envelopeSpendAmount}
                      onChangeText={setEnvelopeSpendAmount}
                    />
                  </View>

                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.label}>Descripción (opcional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ej. Súper de la semana"
                      placeholderTextColor={TEXT_MUTED}
                      value={envelopeSpendDesc}
                      onChangeText={setEnvelopeSpendDesc}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.saveButton, savingEnvelopeSpend && { opacity: 0.7 }]}
                    onPress={handleEnvelopeSpend}
                    disabled={savingEnvelopeSpend}
                  >
                    <Text style={styles.saveButtonText}>
                      {savingEnvelopeSpend ? "Guardando..." : "Registrar gasto"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Modal ingreso extra */}
            <Modal visible={extraIncomeModalVisible} animationType="slide" transparent onRequestClose={closeExtraIncomeModal}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Ingreso extra</Text>
                    <TouchableOpacity onPress={closeExtraIncomeModal}>
                      <MaterialIcons name="close" size={22} color={TEXT_MUTED} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.modalSubtitle}>Este monto se sumará a tu sueldo de la semana actual.</Text>

                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.label}>Monto</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ej. 500"
                      placeholderTextColor={TEXT_MUTED}
                      keyboardType="numeric"
                      value={extraIncomeAmount}
                      onChangeText={setExtraIncomeAmount}
                    />
                  </View>

                  <TouchableOpacity style={[styles.saveButton, savingExtraIncome && { opacity: 0.7 }]} onPress={handleSaveExtraIncome} disabled={savingExtraIncome}>
                    <Text style={styles.saveButtonText}>
                      {savingExtraIncome ? "Guardando..." : "Agregar ingreso extra"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG_DARK },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 30 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerRight: { flexDirection: "row", gap: 8 },
  avatar: {
    width: 36, height: 36, borderRadius: 999, backgroundColor: AVATAR_BG,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BORDER_SOFT,
  },
  avatarInitial: { color: SURFACE, fontWeight: "700", fontSize: 15 },
  helloText: { color: TEXT_PRIMARY, fontSize: 15, fontWeight: "700" },
  subHelloText: { color: TEXT_MUTED, fontSize: 12 },
  iconButton: {
    width: 34, height: 34, borderRadius: 999, backgroundColor: ICON_BG,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BORDER_SOFT,
  },

  centerFill: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8, color: TEXT_MUTED, fontSize: 12 },
  errorText: { color: CHANGE_NEG, fontSize: 14, marginBottom: 8 },
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: PRIMARY },
  retryText: { color: PRIMARY, fontWeight: "600", fontSize: 13 },

  incomeCard: { backgroundColor: SURFACE, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: BORDER_SOFT, marginBottom: 10 },
  incomeRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 8 },
  incomeInput: {
    flex: 1, backgroundColor: INPUT_BG, borderRadius: 10, borderWidth: 1, borderColor: BORDER_SOFT,
    paddingHorizontal: 10, paddingVertical: 6, color: TEXT_PRIMARY, fontSize: 14,
  },
  incomeSaveButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center" },
  incomeSaveText: { color: BUTTON_TEXT, fontSize: 13, fontWeight: "700" },

  incomeExtraButton: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: BORDER_SOFT, backgroundColor: SURFACE, gap: 4,
  },
  incomeExtraText: { color: TEXT_PRIMARY, fontSize: 11, fontWeight: "600" },

  freqRow: { flexDirection: "row", gap: 6, marginTop: 4, flexWrap: "wrap" },
  freqChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: BORDER_SOFT, backgroundColor: SURFACE },
  freqChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  freqChipText: { fontSize: 11, color: TEXT_PRIMARY, fontWeight: "600" },
  freqChipTextActive: { color: BUTTON_TEXT },

  incomeAvailable: { marginTop: 4, color: TEXT_MUTED, fontSize: 12 },
  incomeAvailableAmount: { color: TEXT_PRIMARY, fontWeight: "700" },

  deficitButton: { marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: CHANGE_NEG, borderRadius: 10, paddingVertical: 8 },
  deficitButtonText: { color: BUTTON_TEXT, fontSize: 13, fontWeight: "700" },
  deficitWarning: { marginTop: 6, color: CHANGE_NEG, fontSize: 11 },

  summaryCard: { backgroundColor: SURFACE, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: BORDER_SOFT, marginBottom: 10 },
  summaryLabel: { color: TEXT_MUTED, fontSize: 12, marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 },
  summaryAmount: { color: TEXT_PRIMARY, fontSize: 22, fontWeight: "800" },
  changeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 999, backgroundColor: "rgba(11,110,246,0.06)", borderWidth: 1, borderColor: "rgba(11,110,246,0.15)",
  },
  changeText: { fontSize: 11, fontWeight: "600", color: TEXT_PRIMARY },
  summaryNote: { color: TEXT_MUTED, fontSize: 11, marginTop: 4 },

  sectionTitle: { color: TEXT_PRIMARY, fontSize: 14, fontWeight: "700", marginTop: 10, marginBottom: 2 },

  quickRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  quickButtonPrimary: {
    flex: 1, backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
  },
  quickPrimaryText: { color: BUTTON_TEXT, fontSize: 13, fontWeight: "700" },
  quickButtonSecondary: {
    flex: 1, backgroundColor: "transparent", borderRadius: 12, paddingVertical: 9, paddingHorizontal: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: BORDER_SOFT,
  },
  quickSecondaryText: { color: TEXT_PRIMARY, fontSize: 13, fontWeight: "600" },

  goalCard: { backgroundColor: SURFACE, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: BORDER_SOFT, marginBottom: 8 },
  goalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  goalTitle: { color: TEXT_PRIMARY, fontSize: 13, fontWeight: "700" },
  goalSubtitle: { color: TEXT_MUTED, fontSize: 11, marginTop: 2, maxWidth: 220 },
  goalAmount: { color: TEXT_PRIMARY, fontSize: 13, fontWeight: "700", textAlign: "right" },
  goalAmountSub: { color: TEXT_MUTED, fontSize: 11, fontWeight: "400" },
  progressBarBg: { height: 6, borderRadius: 999, backgroundColor: PROGRESS_BG, marginTop: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 999, backgroundColor: PRIMARY },

  emptyRow: { paddingVertical: 6 },
  emptyText: { color: TEXT_MUTED, fontSize: 12 },

  billRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: SURFACE, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 10,
    borderWidth: 1, borderColor: BORDER_SOFT, marginBottom: 6,
  },
  billLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  billIconWrapper: { width: 30, height: 30, borderRadius: 999, backgroundColor: "rgba(45,212,191,0.08)", alignItems: "center", justifyContent: "center" },
  billName: { color: TEXT_PRIMARY, fontSize: 13, fontWeight: "600" },
  billSubtitle: { color: TEXT_MUTED, fontSize: 11, marginTop: 1 },
  billAmount: { color: TEXT_PRIMARY, fontSize: 13, fontWeight: "700", marginLeft: 8 },

  envelopesCard: { backgroundColor: SURFACE, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: BORDER_SOFT, marginBottom: 10 },
  envelopesCountText: { color: TEXT_MUTED, fontSize: 11, marginTop: 2 },
  viewAllText: { color: PRIMARY, fontSize: 12, fontWeight: "600", textDecorationLine: "underline" },
  envelopeFormRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  envelopeInput: {
    height: 40, borderRadius: 10, borderWidth: 1, borderColor: BORDER_SOFT, backgroundColor: INPUT_BG,
    paddingHorizontal: 10, color: TEXT_PRIMARY, fontSize: 13,
  },
  envelopeAddButton: { marginLeft: 6, width: 40, height: 40, borderRadius: 10, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center" },
  envelopeRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8, paddingVertical: 4 },
  envelopeTitle: { color: TEXT_PRIMARY, fontSize: 13, fontWeight: "700" },
  envelopeSubtitle: { color: TEXT_MUTED, fontSize: 11, marginTop: 2 },
  envelopeSpendButton: { width: 38, height: 38, borderRadius: 999, backgroundColor: ICON_BG, alignItems: "center", justifyContent: "center" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(7,42,74,0.1)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, borderTopWidth: 1, borderColor: BORDER_SOFT },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { color: TEXT_PRIMARY, fontSize: 16, fontWeight: "700" },
  modalSubtitle: { marginTop: 8, color: TEXT_MUTED, fontSize: 12 },
  goalRowModal: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER_SOFT,
  },

  label: { color: TEXT_MUTED, fontSize: 12, marginBottom: 4 },
  input: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: BORDER_SOFT, backgroundColor: INPUT_BG, paddingHorizontal: 12, color: TEXT_PRIMARY, fontSize: 13 },
  saveButton: { marginTop: 16, marginBottom: 8, backgroundColor: PRIMARY, borderRadius: 999, height: 46, alignItems: "center", justifyContent: "center" },
  saveButtonText: { color: BUTTON_TEXT, fontSize: 15, fontWeight: "700" },
});
