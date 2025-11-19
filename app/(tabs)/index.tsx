// app/(tabs)/index.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "../../src/api/client";

const PRIMARY = "#13ec5b";
const BG_DARK = "#020617";
const SURFACE = "#020617";

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

type DashboardResponse = {
  user?: {
    name?: string | null;
  };
  totals?: {
    total_savings?: number | null;
    monthly_change_percent?: number | null;
  };
  goals?: SavingGoal[];
  upcoming_bills?: Bill[];
};

function formatAmount(raw?: number | null) {
  const amount =
    typeof raw === "number" && !isNaN(raw) ? raw : 0;

  return amount.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(raw?: number | null) {
  const n =
    typeof raw === "number" && !isNaN(raw) ? raw : 0;
  return `${n.toFixed(1)}%`;
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "Sin fecha";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });
}

export default function DashboardScreen() {
  const router = useRouter();

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const goals = useMemo(
    () => data?.goals ?? [],
    [data]
  );
  const upcomingBills = useMemo(
    () => data?.upcoming_bills ?? [],
    [data]
  );

  const totalSavings = data?.totals?.total_savings ?? 0;
  const monthlyChange =
    data?.totals?.monthly_change_percent ?? 0;
  const userName = data?.user?.name ?? "Usuario";

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ajusta si tu endpoint es otro
      const res = await api.get<DashboardResponse>("/dashboard");

      setData(res.data || {});
    } catch (e: any) {
      console.log("Error cargando dashboard:", e?.response?.data || e);
      setError("No se pudo cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleNewSaving = () => {
    router.push("/(tabs)/goals");
  };

  const handleNewBill = () => {
    router.push("/(tabs)/bills");
  };

  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.helloText}>
                Hola, {userName.split(" ")[0]}!
              </Text>
              <Text style={styles.subHelloText}>
                Resumen financiero
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons
                name="notifications"
                size={20}
                color="#e5e7eb"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons
                name="settings"
                size={20}
                color="#e5e7eb"
              />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>
              Cargando dashboard...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerFill}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadDashboard}
            >
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingBottom: 96,
            }}
          >
            {/* Tarjeta de Ahorro Total */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>
                Ahorro total
              </Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryAmount}>
                  ${formatAmount(totalSavings)}
                </Text>
                <View style={styles.changeBadge}>
                  <MaterialIcons
                    name={
                      monthlyChange >= 0
                        ? "trending-up"
                        : "trending-down"
                    }
                    size={18}
                    color={
                      monthlyChange >= 0
                        ? "#22c55e"
                        : "#ef4444"
                    }
                  />
                  <Text
                    style={[
                      styles.changeText,
                      monthlyChange >= 0
                        ? { color: "#22c55e" }
                        : { color: "#f97373" },
                    ]}
                  >
                    {formatPercent(monthlyChange)} este mes
                  </Text>
                </View>
              </View>
              <Text style={styles.summaryNote}>
                Sigue aportando de forma constante para
                alcanzar tus metas.
              </Text>
            </View>

            {/* Acciones rápidas */}
            <Text style={styles.sectionTitle}>
              Acciones rápidas
            </Text>
            <View style={styles.quickRow}>
              <TouchableOpacity
                style={styles.quickButtonPrimary}
                onPress={handleNewSaving}
              >
                <MaterialIcons
                  name="savings"
                  size={20}
                  color="#020617"
                />
                <Text style={styles.quickPrimaryText}>
                  Nueva meta
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickButtonSecondary}
                onPress={handleNewBill}
              >
                <MaterialIcons
                  name="receipt-long"
                  size={20}
                  color="#e5e7eb"
                />
                <Text style={styles.quickSecondaryText}>
                  Nuevo pago
                </Text>
              </TouchableOpacity>
            </View>

            {/* Mis metas */}
            <Text style={styles.sectionTitle}>Mis metas</Text>
            {goals.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>
                  Aún no tienes metas creadas.
                </Text>
              </View>
            ) : (
              goals.slice(0, 3).map((goal) => {
                const current =
                  typeof goal.current_amount === "number"
                    ? goal.current_amount
                    : 0;
                const target =
                  typeof goal.target_amount === "number"
                    ? goal.target_amount
                    : 0;
                const progress =
                  target > 0
                    ? Math.min(
                        100,
                        Math.max(0, (current / target) * 100)
                      )
                    : 0;

                return (
                  <View
                    key={goal.id}
                    style={styles.goalCard}
                  >
                    <View style={styles.goalRow}>
                      <View>
                        <Text style={styles.goalTitle}>
                          {goal.name}
                        </Text>
                        <Text
                          style={styles.goalSubtitle}
                          numberOfLines={1}
                        >
                          {goal.deadline
                            ? `Fecha límite: ${formatDate(
                                goal.deadline
                              )}`
                            : "Sin fecha límite"}
                        </Text>
                      </View>
                      <Text style={styles.goalAmount}>
                        ${formatAmount(current)}{" "}
                        <Text style={styles.goalAmountSub}>
                          / ${formatAmount(target)}
                        </Text>
                      </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${progress}%` },
                        ]}
                      />
                    </View>
                  </View>
                );
              })
            )}

            {/* Próximos vencimientos */}
            <Text style={styles.sectionTitle}>
              Próximos vencimientos
            </Text>
            {upcomingBills.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>
                  No tienes pagos próximos.
                </Text>
              </View>
            ) : (
              upcomingBills.slice(0, 4).map((bill) => (
                <View
                  key={bill.id}
                  style={styles.billRow}
                >
                  <View style={styles.billLeft}>
                    <View style={styles.billIconWrapper}>
                      <MaterialIcons
                        name="receipt-long"
                        size={18}
                        color="#facc15"
                      />
                    </View>
                    <View>
                      <Text style={styles.billName}>
                        {bill.name}
                      </Text>
                      <Text style={styles.billSubtitle}>
                        {formatDate(bill.due_date)} ·{" "}
                        {bill.status === "paid"
                          ? "Pagado"
                          : "Pendiente"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.billAmount}>
                    ${formatAmount(bill.amount)}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </View>
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
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerRight: {
    flexDirection: "row",
    gap: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  avatarInitial: {
    color: "#e5e7eb",
    fontWeight: "700",
    fontSize: 16,
  },
  helloText: {
    color: "#f9fafb",
    fontSize: 16,
    fontWeight: "700",
  },
  subHelloText: {
    color: "#9ca3af",
    fontSize: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  centerFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#9ca3af",
    fontSize: 12,
  },
  errorText: {
    color: "#f97373",
    fontSize: 14,
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

  summaryCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 12,
  },
  summaryLabel: {
    color: "#9ca3af",
    fontSize: 12,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  summaryAmount: {
    color: "#f9fafb",
    fontSize: 24,
    fontWeight: "800",
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  changeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  summaryNote: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 4,
  },

  sectionTitle: {
    color: "#e5e7eb",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 6,
  },

  quickRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  quickButtonPrimary: {
    flex: 1,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  quickPrimaryText: {
    color: "#020617",
    fontSize: 13,
    fontWeight: "700",
  },
  quickButtonSecondary: {
    flex: 1,
    backgroundColor: "#020617",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  quickSecondaryText: {
    color: "#e5e7eb",
    fontSize: 13,
    fontWeight: "600",
  },

  goalCard: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 8,
  },
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  goalTitle: {
    color: "#f9fafb",
    fontSize: 14,
    fontWeight: "700",
  },
  goalSubtitle: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 2,
    maxWidth: 180,
  },
  goalAmount: {
    color: "#f9fafb",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
  goalAmountSub: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "400",
  },
  progressBarBg: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#020617",
    marginTop: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },

  emptyRow: {
    paddingVertical: 6,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 12,
  },

  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: SURFACE,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 6,
  },
  billLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  billIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
  },
  billName: {
    color: "#f9fafb",
    fontSize: 13,
    fontWeight: "600",
  },
  billSubtitle: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 1,
  },
  billAmount: {
    color: "#f9fafb",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 8,
  },
});
