import { useEffect, useMemo, useState } from "react";
import { api } from "../../../../../../src/api/client";

export type FrecuenciaIngreso = "weekly" | "biweekly" | "monthly";

const WEEKS_PER_MONTH = 52 / 12;

function toWeeklyAmount(amount: number, freq: FrecuenciaIngreso) {
  if (!amount || amount < 0) return 0;
  if (freq === "weekly") return amount;
  if (freq === "biweekly") return amount / 2;
  return amount / WEEKS_PER_MONTH;
}

const weekdayMap = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

type Params = {
  initialAmount?: number | null;
  initialFrequency?: FrecuenciaIngreso | null;
  initialWeekday?: string | null;
  initialDayOfMonth?: number | null;
  onSaved?: () => void;
};

export function useIngresoSettings({
  initialAmount,
  initialFrequency,
  initialWeekday,
  initialDayOfMonth,
  onSaved,
}: Params) {
  const [monto, setMonto] = useState(
    initialAmount ? initialAmount.toFixed(2) : ""
  );
  const [frecuencia, setFrecuencia] =
    useState<FrecuenciaIngreso>(initialFrequency || "weekly");

  const [weekday, setWeekday] = useState<number>(
    initialWeekday
      ? weekdayMap.indexOf(initialWeekday) + 1
      : 5
  );

  const [dayOfMonth, setDayOfMonth] = useState<number>(
    initialDayOfMonth || 15
  );

  const [guardando, setGuardando] = useState(false);

  const parsedMonto = useMemo(() => {
    const n = parseFloat(monto.replace(/,/g, ""));
    return isNaN(n) ? 0 : n;
  }, [monto]);

  const weeklyPreview = useMemo(
    () => toWeeklyAmount(parsedMonto, frecuencia),
    [parsedMonto, frecuencia]
  );

  // 🔵 Auto-save con debounce
  useEffect(() => {
    if (!parsedMonto) return;

    const t = setTimeout(async () => {
      try {
        setGuardando(true);

        await api.post("/dashboard/income-settings", {
          amount: parsedMonto,
          frequency: frecuencia,
          payday_weekday:
            frecuencia === "weekly" ? weekdayMap[weekday - 1] : null,
          payday_day_of_month:
            frecuencia !== "weekly" ? dayOfMonth : null,
        });

        onSaved?.();
      } catch (e) {
        console.log("Error autosave ingreso", e);
      } finally {
        setGuardando(false);
      }
    }, 700);

    return () => clearTimeout(t);
  }, [parsedMonto, frecuencia, weekday, dayOfMonth]);

  return {
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
  };
}
