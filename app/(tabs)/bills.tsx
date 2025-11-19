// app/(tabs)/bills.tsx
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
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { api } from "../../src/api/client";

const PRIMARY = "#13ec5b";
const BG_DARK = "#020617";
const SURFACE = "#0b1120";

type BillStatus = "pending" | "paid" | "all";

type Bill = {
  id: number;
  name: string;
  amount: number;
  status: "pending" | "paid";
  due_date: string; // ISO yyyy-mm-dd
  category?: string | null;
  paid_at?: string | null;
};

type BillsIndexResponse =
  | Bill[]
  | {
      data: Bill[];
      [key: string]: any;
    };

function getDaysDiff(dueDate: string) {
  const today = new Date();
  const date = new Date(dueDate);
  const diffMs = date.getTime() - today.setHours(0, 0, 0, 0);
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

function formatAmount(amount: number) {
  return amount.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BillsScreen() {
  const [filter, setFilter] = useState<BillStatus>("pending");
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form estado
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [statusForm, setStatusForm] = useState<"pending" | "paid">("pending");

  // Date picker
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const resetForm = () => {
    setEditingBill(null);
    setLabel("");
    setAmount("");
    setStatusForm("pending");
    setDueDate(new Date());
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (bill: Bill) => {
    setEditingBill(bill);
    setLabel(bill.name);
    setAmount(String(bill.amount));
    setStatusForm(bill.status);
    setDueDate(new Date(bill.due_date));
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const fetchBills = async (status: BillStatus = filter) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<BillsIndexResponse>("/bills", {
        params: { status },
      });

      const list = Array.isArray(res.data) ? res.data : res.data.data;
      setBills(list || []);
    } catch (e: any) {
      console.log("Error loading bills:", e?.response?.data || e);
      setError("No se pudieron cargar los recibos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills(filter);
  }, [filter]);

  const handleSave = async () => {
    if (!label || !amount) {
      Alert.alert("Campos incompletos", "Completa todos los campos.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      Alert.alert("Monto inválido", "Ingresa un monto numérico válido.");
      return;
    }

    const dueDateString = dueDate.toISOString().substring(0, 10); // yyyy-mm-dd

    const payload = {
      name: label,
      amount: parsedAmount,
      due_date: dueDateString,
      status: statusForm,
    };

    try {
      setLoadingAction(true);
      if (editingBill) {
        await api.put(`/bills/${editingBill.id}`, payload);
      } else {
        await api.post("/bills", payload);
      }
      await fetchBills(filter);
      closeModal();
      resetForm();
    } catch (e: any) {
      console.log("Error saving bill:", e?.response?.data || e);
      const msg =
        e?.response?.data?.message ||
        "No se pudo guardar el recibo. Revisa los datos.";
      Alert.alert("Error", msg);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = (bill: Bill) => {
    Alert.alert(
      "Eliminar recibo",
      `¿Seguro que quieres eliminar "${bill.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              setLoadingAction(true);
              await api.delete(`/bills/${bill.id}`);
              await fetchBills(filter);
            } catch (e: any) {
              console.log("Error deleting bill:", e?.response?.data || e);
              Alert.alert("Error", "No se pudo eliminar el recibo.");
            } finally {
              setLoadingAction(false);
            }
          },
        },
      ]
    );
  };

  const groupedBills = useMemo(() => {
    const overdue: Bill[] = [];
    const upcoming: Bill[] = [];
    const others: Bill[] = [];

    bills.forEach((bill) => {
      const days = getDaysDiff(bill.due_date);
      if (days < 0 && bill.status === "pending") {
        overdue.push(bill);
      } else if (days >= 0 && days <= 7 && bill.status === "pending") {
        upcoming.push(bill);
      } else {
        others.push(bill);
      }
    });

    return { overdue, upcoming, others };
  }, [bills]);

  const renderBillRow = (bill: Bill) => {
    const days = getDaysDiff(bill.due_date);
    let chipColor = "#9ca3af";
    let chipText = `Vence en ${days} días`;

    if (bill.status === "paid") {
      chipColor = "#22c55e";
      chipText = "Pagado";
    } else if (days < 0) {
      chipColor = "#f97373";
      chipText = "Vencido";
    } else if (days <= 3) {
      chipColor = "#fbbf24";
    }

    let icon: keyof typeof MaterialIcons.glyphMap = "credit-card";
    const name = bill.name.toLowerCase();
    if (name.includes("luz") || name.includes("cfe")) icon = "bolt";
    else if (name.includes("renta")) icon = "house";
    else if (name.includes("internet") || name.includes("wifi"))
      icon = "wifi";
    else if (name.includes("netflix") || name.includes("spotify"))
      icon = "subscriptions";

    return (
      <TouchableOpacity
        key={bill.id}
        style={styles.billRow}
        onPress={() => openEditModal(bill)}
        onLongPress={() => handleDelete(bill)}
      >
        <View style={styles.billLeft}>
          <View style={styles.billIconWrapper}>
            <MaterialIcons name={icon} size={22} color="#e5e7eb" />
          </View>
          <View>
            <Text style={styles.billLabel}>{bill.name}</Text>
            <Text style={[styles.billChip, { color: chipColor }]}>
              {chipText}
            </Text>
          </View>
        </View>
        <View style={styles.billRight}>
          <Text style={styles.billAmount}>${formatAmount(bill.amount)}</Text>
        </View>
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
          <Text style={styles.headerTitle}>Recibos y Pagos</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <MaterialIcons name="search" size={24} color="#e5e7eb" />
          </TouchableOpacity>
        </View>

        {/* Segmented control */}
        <View style={styles.segmentWrapper}>
          <View style={styles.segmentBackground}>
            <TouchableOpacity
              style={[
                styles.segmentItem,
                filter === "pending" && styles.segmentItemActive,
              ]}
              onPress={() => setFilter("pending")}
            >
              <Text
                style={[
                  styles.segmentText,
                  filter === "pending" && styles.segmentTextActive,
                ]}
              >
                Pendientes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentItem,
                filter === "paid" && styles.segmentItemActive,
              ]}
              onPress={() => setFilter("paid")}
            >
              <Text
                style={[
                  styles.segmentText,
                  filter === "paid" && styles.segmentTextActive,
                ]}
              >
                Pagados
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentItem,
                filter === "all" && styles.segmentItemActive,
              ]}
              onPress={() => setFilter("all")}
            >
              <Text
                style={[
                  styles.segmentText,
                  filter === "all" && styles.segmentTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contenido */}
        {loading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>Cargando recibos...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerFill}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchBills(filter)}
            >
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: 96 }}
          >
            {/* Vencidos */}
            {groupedBills.overdue.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: "#f97373" }]}>
                  Vencidos
                </Text>
                {groupedBills.overdue.map(renderBillRow)}
              </>
            )}

            {/* Próximos a vencer */}
            {groupedBills.upcoming.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Próximos a vencer</Text>
                {groupedBills.upcoming.map(renderBillRow)}
              </>
            )}

            {/* Otros */}
            {groupedBills.others.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Otros</Text>
                {groupedBills.others.map(renderBillRow)}
              </>
            )}

            {bills.length === 0 && (
              <View style={styles.emptyBox}>
                <MaterialIcons
                  name="receipt-long"
                  size={40}
                  color="rgba(148,163,184,0.8)"
                />
                <Text style={styles.emptyTitle}>Sin recibos aún</Text>
                <Text style={styles.emptyText}>
                  Registra tu primer pago con el botón verde de abajo.
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* FAB */}
        <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
          <MaterialIcons name="add" size={30} color="#020617" />
        </TouchableOpacity>

        {/* Modal de crear/editar */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingBill ? "Editar recibo" : "Nuevo recibo"}
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <MaterialIcons name="close" size={22} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Recibo de luz"
                  placeholderTextColor="#6b7280"
                  value={label}
                  onChangeText={setLabel}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Monto</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 450.00"
                  placeholderTextColor="#6b7280"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Fecha de vencimiento</Text>

                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={[styles.input, { justifyContent: "center" }]}
                >
                  <Text style={{ color: "#f9fafb", fontSize: 13 }}>
                    {dueDate.toISOString().substring(0, 10)}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={dueDate}
                    mode="date"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setDueDate(selectedDate);
                      }
                    }}
                  />
                )}
              </View>

              <View style={[styles.formField, { marginTop: 4 }]}>
                <Text style={styles.label}>Estado</Text>
                <View style={styles.segmentBackgroundSmall}>
                  <TouchableOpacity
                    style={[
                      styles.segmentItemSmall,
                      statusForm === "pending" && styles.segmentItemActiveSmall,
                    ]}
                    onPress={() => setStatusForm("pending")}
                  >
                    <Text
                      style={[
                        styles.segmentTextSmall,
                        statusForm === "pending" && styles.segmentTextActive,
                      ]}
                    >
                      Pendiente
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.segmentItemSmall,
                      statusForm === "paid" && styles.segmentItemActiveSmall,
                    ]}
                    onPress={() => setStatusForm("paid")}
                  >
                    <Text
                      style={[
                        styles.segmentTextSmall,
                        statusForm === "paid" && styles.segmentTextActive,
                      ]}
                    >
                      Pagado
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  loadingAction && { opacity: 0.7 },
                ]}
                onPress={handleSave}
                disabled={loadingAction}
              >
                <Text style={styles.saveButtonText}>
                  {loadingAction
                    ? "Guardando..."
                    : editingBill
                    ? "Guardar cambios"
                    : "Crear recibo"}
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
  sectionTitle: {
    color: "#e5e7eb",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 14,
    marginBottom: 4,
  },
  billRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: SURFACE,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  billLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  billIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
  },
  billLabel: { color: "#f9fafb", fontSize: 14, fontWeight: "500" },
  billChip: { fontSize: 11, marginTop: 2 },
  billRight: { alignItems: "flex-end" },
  billAmount: { color: "#f9fafb", fontSize: 14, fontWeight: "700" },
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
  },
  segmentBackgroundSmall: {
    flexDirection: "row",
    backgroundColor: "#020617",
    borderRadius: 999,
    padding: 2,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  segmentItemSmall: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentItemActiveSmall: { backgroundColor: SURFACE },
  segmentTextSmall: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "500",
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
