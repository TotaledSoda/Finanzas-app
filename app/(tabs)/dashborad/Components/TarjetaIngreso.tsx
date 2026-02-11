import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { styles } from "../utils/estilos";
import { useIngresoSettings } from "./hooks/useIngresoSettings";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type Props = {
  income?: {
    base_amount?: number | null;
    frequency?: "weekly" | "biweekly" | "monthly" | null;
    payday_weekday?: string | null;
    payday_day_of_month?: number | null;
    spent_this_week?: number | null;
    available_this_week?: number | null;
  };
  onReload: () => void;
};

export function TarjetaIngreso({ income, onReload }: Props) {
  const {
    monto,
    setMonto,
    frecuencia,
    setFrecuencia,
    weekday,
    setWeekday,
    dayOfMonth,
    setDayOfMonth,
    weeklyPreview,
    guardando,
  } = useIngresoSettings({
    initialAmount: income?.base_amount,
    initialFrequency: income?.frequency,
    initialWeekday: income?.payday_weekday,
    initialDayOfMonth: income?.payday_day_of_month,
    onSaved: onReload,
  });

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Tu ingreso</Text>

      {/* Frecuencia */}
      <View style={styles.row}>
        {[
          { key: "weekly", label: "Semanal" },
          { key: "biweekly", label: "Quincenal" },
          { key: "monthly", label: "Mensual" },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.chip,
              frecuencia === f.key && styles.chipActive,
            ]}
            onPress={() => setFrecuencia(f.key as any)}
          >
            <Text
              style={[
                styles.chipText,
                frecuencia === f.key && styles.chipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Día de pago */}
      <Text style={styles.label}>Día de pago</Text>

      {frecuencia === "weekly" ? (
        <View style={styles.row}>
          {WEEKDAYS.map((d, i) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.chip,
                weekday === i + 1 && styles.chipActive,
              ]}
              onPress={() => setWeekday(i + 1)}
            >
              <Text
                style={[
                  styles.chipText,
                  weekday === i + 1 && styles.chipTextActive,
                ]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.rowWrap}>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.chip,
                dayOfMonth === d && styles.chipActive,
              ]}
              onPress={() => setDayOfMonth(d)}
            >
              <Text
                style={[
                  styles.chipText,
                  dayOfMonth === d && styles.chipTextActive,
                ]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Monto */}
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={monto}
        onChangeText={setMonto}
        placeholder="0.00"
      />

      <Text style={styles.helper}>
        Sueldo semanal estimado:{" "}
        <Text style={styles.helperBold}>
          ${weeklyPreview.toFixed(2)}
        </Text>
        {guardando && " · guardando…"}
      </Text>

      <View style={styles.row}>
        <MaterialIcons name="payments" size={18} />
        <Text style={styles.small}>
          Gastado esta semana: ${income?.spent_this_week ?? 0}
        </Text>
      </View>
    </View>
  );
}
