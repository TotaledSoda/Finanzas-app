import { SafeAreaView, ScrollView } from "react-native";
import { useDashboard } from "./Components/hooks/useDashboard";

import {
  EncabezadoDashboard,
  TarjetaIngreso,
  TarjetaApartados,
  TarjetaAhorro,
  ListaMetas,
  ListaPagos,
  AccionesRapidas,
} from "./Components";

export default function DashboardScreen() {
  const { data, loading, error, reload } = useDashboard();

  if (loading) return null;
  if (error) return null;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <EncabezadoDashboard user={data?.user} />

      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        <TarjetaIngreso income={data?.income} onReload={reload} />
        <TarjetaApartados />
        <TarjetaAhorro savings={data?.savings} />
        <AccionesRapidas />
        <ListaMetas goals={data?.goals} />
        <ListaPagos bills={data?.bills?.next} />
      </ScrollView>
    </SafeAreaView>
  );
}
