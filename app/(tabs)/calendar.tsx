import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { api } from "../../src/api/client";

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

type CalendarEvent = {
    source: "bill" | "tanda" | "saving_goal" | "manual" | "envelope" | string;
    source_id: number;
    date: string; // yyyy-mm-dd
    title: string;
    amount: number;
    status?: string | null;
    meta?: any;
};

type DailyExpense = {
    date: string; // yyyy-mm-dd
    total: number;
};

type CalendarResponse = {
    range: {
        start: string;
        end: string;
    };
    events: CalendarEvent[];
    daily_expenses: DailyExpense[];
};

const daysShort = ["L", "M", "X", "J", "V", "S", "D"];

function toDateString(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function getMonthRange(current: Date) {
    const start = new Date(current.getFullYear(), current.getMonth(), 1);
    const end = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    return {
        startDate: toDateString(start),
        endDate: toDateString(end),
    };
}

function formatAmount(n: number | undefined | null) {
    const value = typeof n === "number" && !isNaN(n) ? n : 0;
    return value.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDisplayDate(dateString: string) {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("es-MX", {
        weekday: "short",
        day: "2-digit",
        month: "short",
    });
}

export default function CalendarScreen() {
    const [currentMonth, setCurrentMonth] = useState<Date>(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const now = new Date();
        return toDateString(now);
    });

    const [data, setData] = useState<CalendarResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Mapas para acceso rápido
    const eventsByDate = useMemo(() => {
        const map: Record<string, CalendarEvent[]> = {};
        if (!data) return map;
        for (const ev of data.events) {
            if (!map[ev.date]) map[ev.date] = [];
            map[ev.date].push(ev);
        }
        return map;
    }, [data]);

    const expensesByDate = useMemo(() => {
        const map: Record<string, number> = {};
        if (!data) return map;
        for (const row of data.daily_expenses) {
            map[row.date] = row.total;
        }
        return map;
    }, [data]);

    const selectedEvents: CalendarEvent[] = useMemo(() => {
        if (!selectedDate) return [];
        return eventsByDate[selectedDate] ?? [];
    }, [selectedDate, eventsByDate]);

    const selectedExpensesTotal = useMemo(() => {
        if (!selectedDate) return 0;
        return expensesByDate[selectedDate] ?? 0;
    }, [selectedDate, expensesByDate]);

    const loadCalendar = async () => {
        try {
            setLoading(true);
            setError(null);

            const { startDate, endDate } = getMonthRange(currentMonth);

            const res = await api.get<CalendarResponse>("/calendar", {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                },
            });

            setData(res.data);
        } catch (e: any) {
            console.log("Error cargando calendario:", e?.response?.data || e);
            setError("No se pudo cargar el calendario.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCalendar();
    }, [currentMonth]);

    const goPrevMonth = () => {
        setCurrentMonth((prev) => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() - 1);
            return new Date(d.getFullYear(), d.getMonth(), 1);
        });
    };

    const goNextMonth = () => {
        setCurrentMonth((prev) => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() + 1);
            return new Date(d.getFullYear(), d.getMonth(), 1);
        });
    };

    // Construimos la grilla del mes (Lunes a Domingo)
    const monthYearLabel = useMemo(() => {
        return currentMonth.toLocaleDateString("es-MX", {
            month: "long",
            year: "numeric",
        });
    }, [currentMonth]);

    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = endOfMonth.getDate();

        // getDay() → 0 = Domingo ... 6 = Sábado
        // Queremos Lunes como primer día → convertimos:
        // Lunes:0, Martes:1, ..., Domingo:6
        const jsDay = startOfMonth.getDay(); // 0-6
        const offset = (jsDay + 6) % 7;

        const cells: { dateString: string | null; dayNumber: number | null }[] = [];

        // Relleno inicial (días vacíos antes del 1)
        for (let i = 0; i < offset; i++) {
            cells.push({ dateString: null, dayNumber: null });
        }

        // Días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            const d = new Date(year, month, day);
            cells.push({
                dateString: toDateString(d),
                dayNumber: day,
            });
        }

        return cells;
    }, [currentMonth]);

    const todayString = toDateString(new Date());

    return (
        <View style={styles.safe}>
            <View style={styles.container}>
                {/* Header superior */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Calendario</Text>
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            style={styles.monthButton}
                            onPress={goPrevMonth}
                        >
                            <MaterialIcons
                                name="chevron-left"
                                size={20}
                                color={TEXT_PRIMARY}
                            />
                        </TouchableOpacity>
                        <Text style={styles.monthLabel}>
                            {monthYearLabel.charAt(0).toUpperCase() +
                                monthYearLabel.slice(1)}
                        </Text>
                        <TouchableOpacity
                            style={styles.monthButton}
                            onPress={goNextMonth}
                        >
                            <MaterialIcons
                                name="chevron-right"
                                size={20}
                                color={TEXT_PRIMARY}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.centerFill}>
                        <ActivityIndicator size="large" color={PRIMARY} />
                        <Text style={styles.loadingText}>
                            Cargando calendario...
                        </Text>
                    </View>
                ) : error ? (
                    <View style={styles.centerFill}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={loadCalendar}
                        >
                            <Text style={styles.retryText}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Días de la semana */}
                        <View style={styles.weekHeaderRow}>
                            {daysShort.map((d) => (
                                <Text key={d} style={styles.weekHeaderText}>
                                    {d}
                                </Text>
                            ))}
                        </View>

                        {/* Grilla del mes */}
                        <View style={styles.grid}>
                            {calendarDays.map((cell, index) => {
                                if (!cell.dateString || !cell.dayNumber) {
                                    return (
                                        <View
                                            key={index}
                                            style={styles.dayCellEmpty}
                                        />
                                    );
                                }

                                const dateString = cell.dateString;
                                const isToday = dateString === todayString;
                                const isSelected = dateString === selectedDate;

                                const dailyTotal =
                                    expensesByDate[dateString] ?? 0;
                                const hasEvents =
                                    (eventsByDate[dateString]?.length ?? 0) > 0;

                                let cellBg = SURFACE;
                                let borderColor = BORDER_SOFT;

                                if (isSelected) {
                                    cellBg = INPUT_BG;
                                    borderColor = PRIMARY;
                                } else if (isToday) {
                                    cellBg = SURFACE;
                                    borderColor = BORDER_SOFT;
                                }

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.dayCell,
                                            { backgroundColor: cellBg, borderColor },
                                        ]}
                                        onPress={() =>
                                            setSelectedDate(dateString)
                                        }
                                    >
                                        <View style={styles.dayTopRow}>
                                            <Text
                                                style={[
                                                    styles.dayNumber,
                                                    isSelected && {
                                                        color: PRIMARY,
                                                    },
                                                    !isSelected &&
                                                        isToday && {
                                                            color: TEXT_MUTED,
                                                        },
                                                ]}
                                            >
                                                {cell.dayNumber}
                                            </Text>
                                            {hasEvents && (
                                                <View style={styles.eventDot} />
                                            )}
                                        </View>
                                        {dailyTotal > 0 && (
                                            <Text style={styles.dayAmount}>
                                                ${formatAmount(dailyTotal)}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Panel inferior: detalles del día seleccionado */}
                        <View style={styles.bottomPanel}>
                            <View style={styles.bottomHeader}>
                                <View>
                                    <Text style={styles.bottomTitle}>
                                        {selectedDate
                                            ? formatDisplayDate(selectedDate)
                                            : "Día seleccionado"}
                                    </Text>
                                    <Text style={styles.bottomSubtitle}>
                                        Gastado este día: $
                                        {formatAmount(selectedExpensesTotal)}
                                    </Text>
                                </View>
                            </View>

                            <ScrollView
                                style={{ flex: 1 }}
                                contentContainerStyle={{
                                    paddingBottom: 80,
                                }}
                            >
                                {selectedEvents.length === 0 ? (
                                    <View style={styles.emptyRow}>
                                        <Text style={styles.emptyText}>
                                            No hay eventos registrados para este día.
                                        </Text>
                                    </View>
                                ) : (
                                    selectedEvents.map((ev) => (
                                        <View
                                            key={`${ev.source}-${ev.source_id}`}
                                            style={styles.eventRow}
                                        >
                                            <View style={styles.eventLeft}>
                                                <View style={styles.eventIconWrapper}>
                                                    <MaterialIcons
                                                        name={
                                                            ev.source === "bill"
                                                                ? "receipt-long"
                                                                : ev.source === "tanda"
                                                                ? "groups"
                                                                : ev.source === "saving_goal"
                                                                ? "savings"
                                                                : ev.source === "envelope"
                                                                ? "account-balance-wallet"
                                                                : "event"
                                                        }
                                                        size={18}
                                                        color={ICON_ACCENT}
                                                    />
                                                </View>
                                                <View>
                                                    <Text
                                                        style={styles.eventTitle}
                                                        numberOfLines={1}
                                                    >
                                                        {ev.title}
                                                    </Text>
                                                    <Text
                                                        style={styles.eventSubtitle}
                                                        numberOfLines={1}
                                                    >
                                                        {ev.source === "bill"
                                                            ? "Pago"
                                                            : ev.source === "tanda"
                                                            ? "Tanda"
                                                            : ev.source === "saving_goal"
                                                            ? "Meta de ahorro"
                                                            : ev.source === "envelope"
                                                            ? "Gasto en apartado"
                                                            : "Evento"}
                                                        {ev.status
                                                            ? ` · ${ev.status}`
                                                            : ""}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={styles.eventAmount}>
                                                ${formatAmount(ev.amount)}
                                            </Text>
                                        </View>
                                    ))
                                )}
                            </ScrollView>
                        </View>
                    </>
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
        paddingTop: 39,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    headerTitle: {
        color: TEXT_PRIMARY,
        fontSize: 18,
        fontWeight: "700",
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    monthButton: {
        width: 32,
        height: 32,
        borderRadius: 999,
        backgroundColor: INPUT_BG,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: BORDER_SOFT,
    },
    monthLabel: {
        color: TEXT_PRIMARY,
        fontSize: 14,
        fontWeight: "600",
        textTransform: "capitalize",
        marginHorizontal: 4,
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
        color: CHANGE_NEG,
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

    weekHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
        paddingHorizontal: 6,
    },
    weekHeaderText: {
        flex: 1,
        textAlign: "center",
        color: TEXT_MUTED,
        fontSize: 11,
        fontWeight: "600",
    },

    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 4,
        marginBottom: 10,
    },
    dayCell: {
        width: `${(100 - 6 * 4) / 7}%`, // 7 columnas con gap
        aspectRatio: 0.8,
        borderRadius: 10,
        borderWidth: 1,
        padding: 6,
        justifyContent: "space-between",
    },
    dayCellEmpty: {
        width: `${(100 - 6 * 4) / 7}%`,
        aspectRatio: 0.8,
    },
    dayTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dayNumber: {
        color: TEXT_PRIMARY,
        fontSize: 13,
        fontWeight: "600",
    },
    eventDot: {
        width: 6,
        height: 6,
        borderRadius: 999,
        backgroundColor: PRIMARY,
    },
    dayAmount: {
        color: TEXT_MUTED,
        fontSize: 10,
        marginTop: 4,
    },

    bottomPanel: {
        flex: 1,
        borderTopWidth: 1,
        borderTopColor: BORDER_SOFT,
        paddingTop: 8,
    },
    bottomHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: 4,
    },
    bottomTitle: {
        color: TEXT_PRIMARY,
        fontSize: 15,
        fontWeight: "700",
    },
    bottomSubtitle: {
        color: TEXT_MUTED,
        fontSize: 12,
    },

    emptyRow: {
        paddingVertical: 10,
    },
    emptyText: {
        color: TEXT_MUTED,
        fontSize: 12,
    },

    eventRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: SURFACE,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: BORDER_SOFT,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 6,
    },
    eventLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flex: 1,
    },
    eventIconWrapper: {
        width: 32,
        height: 32,
        borderRadius: 999,
        backgroundColor: ICON_BG,
        alignItems: "center",
        justifyContent: "center",
    },
    eventTitle: {
        color: TEXT_PRIMARY,
        fontSize: 13,
        fontWeight: "600",
    },
    eventSubtitle: {
        color: TEXT_MUTED,
        fontSize: 11,
        marginTop: 1,
    },
    eventAmount: {
        color: TEXT_PRIMARY,
        fontSize: 13,
        fontWeight: "700",
        marginLeft: 8,
    },
});
