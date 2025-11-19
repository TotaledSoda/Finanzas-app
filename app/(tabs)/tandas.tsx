import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/api/client';

type TandaStatus = 'active' | 'upcoming' | 'finished' | 'cancelled';

type TandaMember = {
  id: number;
  name: string;
  email: string;
  role: string;
  expected_contribution?: number | null;
};

type Tanda = {
  id: number;
  name: string;
  description?: string | null;
  role: 'owner' | 'member';
  total_amount: number;
  contribution_amount: number;
  rounds_total: number;
  current_round: number;
  progress_percent: number;
  start_date: string | null;
  next_payment_date: string | null;
  frequency: string;
  status: TandaStatus;
  participants?: TandaMember[];
};

const filterTabs = [
  { key: 'active', label: 'Activas' },
  { key: 'upcoming', label: 'Próximas' },
  { key: 'finished', label: 'Finalizadas' },
];

export default function TandasScreen() {
  const [tandas, setTandas] = useState<Tanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'upcoming' | 'finished'>(
    'active'
  );

  // Crear tanda
  const [createVisible, setCreateVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTotal, setNewTotal] = useState('');
  const [newContribution, setNewContribution] = useState('');
  const [newRounds, setNewRounds] = useState('');
  const [newFrequency, setNewFrequency] = useState<'monthly' | 'weekly' | 'biweekly'>('monthly');

  // Participantes
  const [participantsVisible, setParticipantsVisible] = useState(false);
  const [selectedTanda, setSelectedTanda] = useState<Tanda | null>(null);
  const [members, setMembers] = useState<TandaMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  // Invitar miembro
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteContribution, setInviteContribution] = useState('');
  const [inviting, setInviting] = useState(false);

  const fetchTandas = async () => {
    try {
      setError(null);
      const res = await api.get<Tanda[]>('/tandas');
      setTandas(res.data);
    } catch (err: any) {
      console.log('Error tandas:', err?.response?.data || err.message);
      setError('No se pudieron cargar tus tandas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTandas();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTandas();
  }, []);

  const filteredTandas = tandas.filter((t) => t.status === filter);

  // ---------------- CREAR TANDA ----------------

  const openCreateModal = () => {
    setNewName('');
    setNewTotal('');
    setNewContribution('');
    setNewRounds('');
    setNewFrequency('monthly');
    setCreating(false);
    setCreateVisible(true);
  };

  const handleCreateTanda = async () => {
    if (!newName || !newTotal || !newContribution || !newRounds) {
      alert('Completa todos los campos.');
      return;
    }

    const total = parseFloat(newTotal);
    const contrib = parseFloat(newContribution);
    const rounds = parseInt(newRounds, 10);

    if (isNaN(total) || isNaN(contrib) || isNaN(rounds)) {
      alert('Revisa que montos y rondas sean números válidos.');
      return;
    }

    try {
      setCreating(true);
      const payload = {
        name: newName,
        total_amount: total,
        contribution_amount: contrib,
        rounds_total: rounds,
        frequency: newFrequency,
      };

      const res = await api.post<Tanda>('/tandas', payload);
      // Agregar al inicio de la lista
      setTandas((prev) => [res.data, ...prev]);
      setCreateVisible(false);
    } catch (err: any) {
      console.log('Error creando tanda:', err?.response?.data || err.message);
      alert('No se pudo crear la tanda. Revisa los datos o inténtalo más tarde.');
    } finally {
      setCreating(false);
    }
  };

  // ---------------- PARTICIPANTES ----------------

  const openParticipantsModal = async (t: Tanda) => {
    setSelectedTanda(t);
    setMembers([]);
    setMembersError(null);
    setParticipantsVisible(true);
    setMembersLoading(true);

    try {
      const res = await api.get<Tanda>(`/tandas/${t.id}`);
      const tandaDetail = res.data;
      setMembers(tandaDetail.participants || []);
    } catch (err: any) {
      console.log('Error cargando participantes:', err?.response?.data || err.message);
      setMembersError('No se pudieron cargar los participantes.');
    } finally {
      setMembersLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!selectedTanda) return;

    if (!inviteEmail) {
      alert('Ingresa el correo de la persona que quieres agregar.');
      return;
    }

    const expected = inviteContribution
      ? parseFloat(inviteContribution)
      : undefined;

    if (inviteContribution && isNaN(expected!)) {
      alert('La aportación esperada debe ser un número.');
      return;
    }

    try {
      setInviting(true);
      const res = await api.post<{ member: TandaMember }>(
        `/tandas/${selectedTanda.id}/members`,
        {
          email: inviteEmail,
          expected_contribution: expected,
        }
      );

      setMembers((prev) => [...prev, res.data.member]);
      setInviteEmail('');
      setInviteContribution('');
    } catch (err: any) {
      console.log('Error invitando miembro:', err?.response?.data || err.message);
      alert(
        err?.response?.data?.message ||
          'No se pudo agregar a la persona. Asegúrate que exista el usuario.'
      );
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!selectedTanda) return;

    try {
      await api.delete(`/tandas/${selectedTanda.id}/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err: any) {
      console.log('Error eliminando miembro:', err?.response?.data || err.message);
      alert('No se pudo eliminar al participante.');
    }
  };

  // ---------------- UI ----------------

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color="#13ec5b" />
          <Text style={styles.loadingText}>Cargando tandas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Tandas</Text>
        {/* Botón crear en el header opcional */}
      </View>

      {/* Tabs filtro */}
      <View style={styles.tabsWrapper}>
        <View style={styles.tabsContainer}>
          {filterTabs.map((tab) => {
            const isActive = filter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setFilter(tab.key as any)}
              >
                <Text
                  style={[styles.tabText, isActive && styles.tabTextActive]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Error de lista */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Lista de tandas */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredTandas.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <Text style={styles.emptyText}>
              No tienes tandas {filterTabs.find((x) => x.key === filter)?.label}.
            </Text>
          </View>
        ) : (
          filteredTandas.map((t) => (
            <View key={t.id} style={styles.card}>
              <View style={styles.cardBody}>
                {/* Nombre + rol + monto total */}
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={styles.cardTitle}>{t.name}</Text>
                    <Text style={styles.cardRole}>
                      {t.role === 'owner' ? 'Organizador' : 'Participante'}
                    </Text>
                  </View>

                  <View style={styles.cardAmountWrapper}>
                    <Text style={styles.cardAmount}>
                      $
                      {t.total_amount.toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                    <Text style={styles.cardAmountLabel}>Monto total</Text>
                  </View>
                </View>

                {/* Detalle aportación y rondas */}
                <View style={styles.cardDetail}>
                  <Text style={styles.cardDetailText}>
                    Aportación:{' '}
                    <Text style={styles.cardDetailStrong}>
                      $
                      {t.contribution_amount.toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </Text>

                  <Text style={styles.cardRoundText}>
                    Ronda {t.current_round} de {t.rounds_total}
                  </Text>
                </View>

                {/* Progreso */}
                <View style={styles.progressWrapper}>
                  <View style={styles.progressHeaderRow}>
                    <Text style={styles.progressLabel}>Progreso</Text>
                    <Text style={styles.progressPercent}>
                      {t.progress_percent.toFixed(1)}%
                    </Text>
                  </View>

                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${t.progress_percent}%` },
                      ]}
                    />
                  </View>
                </View>

                {/* Botón ver participantes */}
                <View style={styles.participantsButtonWrapper}>
                  <TouchableOpacity
                    style={styles.participantsButton}
                    onPress={() => openParticipantsModal(t)}
                  >
                    <Text style={styles.participantsButtonText}>
                      Ver participantes
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer tarjeta */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.footerLabel}>Próximo pago</Text>
                  <Text style={styles.footerDate}>
                    {t.next_payment_date || 'Por definir'}
                  </Text>
                </View>

                <Text style={styles.footerFreq}>
                  Frecuencia:{' '}
                  {t.frequency === 'weekly'
                    ? 'Semanal'
                    : t.frequency === 'biweekly'
                    ? 'Quincenal'
                    : 'Mensual'}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB para crear tanda */}
      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Text style={styles.fabPlus}>＋</Text>
      </TouchableOpacity>

      {/* MODAL: Crear tanda */}
      <Modal
        visible={createVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Crear nueva tanda</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre de la tanda"
              placeholderTextColor="#9ca3af"
              value={newName}
              onChangeText={setNewName}
            />

            <TextInput
              style={styles.input}
              placeholder="Monto total (ej. 12000)"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={newTotal}
              onChangeText={setNewTotal}
            />

            <TextInput
              style={styles.input}
              placeholder="Aportación por ronda (ej. 1000)"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={newContribution}
              onChangeText={setNewContribution}
            />

            <TextInput
              style={styles.input}
              placeholder="Número de rondas (ej. 12)"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={newRounds}
              onChangeText={setNewRounds}
            />

            <View style={styles.frequencyRow}>
              <TouchableOpacity
                style={[
                  styles.freqButton,
                  newFrequency === 'weekly' && styles.freqButtonActive,
                ]}
                onPress={() => setNewFrequency('weekly')}
              >
                <Text
                  style={[
                    styles.freqText,
                    newFrequency === 'weekly' && styles.freqTextActive,
                  ]}
                >
                  Semanal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.freqButton,
                  newFrequency === 'biweekly' && styles.freqButtonActive,
                ]}
                onPress={() => setNewFrequency('biweekly')}
              >
                <Text
                  style={[
                    styles.freqText,
                    newFrequency === 'biweekly' && styles.freqTextActive,
                  ]}
                >
                  Quincenal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.freqButton,
                  newFrequency === 'monthly' && styles.freqButtonActive,
                ]}
                onPress={() => setNewFrequency('monthly')}
              >
                <Text
                  style={[
                    styles.freqText,
                    newFrequency === 'monthly' && styles.freqTextActive,
                  ]}
                >
                  Mensual
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalButtonOutline}
                onPress={() => setCreateVisible(false)}
                disabled={creating}
              >
                <Text style={styles.modalButtonOutlineText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleCreateTanda}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#020617" />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>Crear</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: Participantes */}
      <Modal
        visible={participantsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setParticipantsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardLarge}>
            <Text style={styles.modalTitle}>
              Participantes{selectedTanda ? ` - ${selectedTanda.name}` : ''}
            </Text>

            {membersLoading ? (
              <View style={styles.center}>
                <ActivityIndicator color="#13ec5b" />
              </View>
            ) : membersError ? (
              <Text style={styles.errorText}>{membersError}</Text>
            ) : (
              <ScrollView style={{ maxHeight: 260 }}>
                {members.length === 0 ? (
                  <Text style={styles.emptyText}>
                    Esta tanda no tiene participantes aún.
                  </Text>
                ) : (
                  members.map((m) => (
                    <View key={m.id} style={styles.memberRow}>
                      <View>
                        <Text style={styles.memberName}>
                          {m.name || m.email}
                        </Text>
                        <Text style={styles.memberEmail}>{m.email}</Text>
                        {m.expected_contribution != null && (
                          <Text style={styles.memberContribution}>
                            Aportación esperada: $
                            {m.expected_contribution.toLocaleString('es-MX', {
                              minimumFractionDigits: 2,
                            })}
                          </Text>
                        )}
                        <Text style={styles.memberRole}>
                          Rol: {m.role === 'owner' ? 'Organizador' : 'Miembro'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleRemoveMember(m.id)}
                        style={styles.memberRemoveButton}
                      >
                        <Text style={styles.memberRemoveText}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            )}

            {/* Formulario para invitar */}
            <View style={styles.inviteBox}>
              <Text style={styles.inviteTitle}>Agregar persona</Text>

              <TextInput
                style={styles.input}
                placeholder="Correo de la persona"
                placeholderTextColor="#9ca3af"
                value={inviteEmail}
                onChangeText={setInviteEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <TextInput
                style={styles.input}
                placeholder="Aportación esperada (opcional)"
                placeholderTextColor="#9ca3af"
                value={inviteContribution}
                onChangeText={setInviteContribution}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleInviteMember}
                disabled={inviting}
              >
                {inviting ? (
                  <ActivityIndicator color="#020617" />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>
                    Agregar a la tanda
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalButtonOutline}
                onPress={() => setParticipantsVisible(false)}
              >
                <Text style={styles.modalButtonOutlineText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --------- STYLES ---------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  loadingText: {
    marginTop: 8,
    color: '#e5e7eb',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  tabsWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#020617',
  },
  tabText: {
    fontSize: 13,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  errorBox: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  emptyWrapper: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#a1a1aa',
  },
  card: {
    borderRadius: 16,
    backgroundColor: 'rgba(24,24,27,0.9)',
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardBody: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 17,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  cardRole: {
    marginTop: 4,
    fontSize: 11,
    color: '#9ca3af',
  },
  cardAmountWrapper: {
    alignItems: 'flex-end',
  },
  cardAmount: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  cardAmountLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  cardDetail: {
    marginTop: 6,
  },
  cardDetailText: {
    fontSize: 13,
    color: '#e5e7eb',
  },
  cardDetailStrong: {
    fontWeight: '600',
  },
  cardRoundText: {
    marginTop: 2,
    fontSize: 11,
    color: '#9ca3af',
  },
  progressWrapper: {
    marginTop: 12,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: '#d4d4d8',
  },
  progressPercent: {
    fontSize: 11,
    color: '#13ec5b',
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#18181b',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#13ec5b',
    borderRadius: 999,
  },
  participantsButtonWrapper: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  participantsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  participantsButtonText: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#020617',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  footerLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  footerDate: {
    fontSize: 13,
    color: '#e5e7eb',
    fontWeight: '600',
  },
  footerFreq: {
    fontSize: 11,
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#13ec5b',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabPlus: {
    fontSize: 28,
    color: '#020617',
    fontWeight: 'bold',
    marginTop: -2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.8)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: '#020617',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  modalCardLarge: {
    backgroundColor: '#020617',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#e5e7eb',
    fontSize: 14,
    marginBottom: 10,
  },
  frequencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  freqButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#374151',
    marginHorizontal: 2,
    alignItems: 'center',
  },
  freqButtonActive: {
    backgroundColor: '#13ec5b1a',
    borderColor: '#13ec5b',
  },
  freqText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  freqTextActive: {
    color: '#e5e7eb',
    fontWeight: '600',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  modalButtonOutline: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  modalButtonOutlineText: {
    color: '#e5e7eb',
    fontSize: 13,
  },
  modalButtonPrimary: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#13ec5b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimaryText: {
    color: '#020617',
    fontSize: 13,
    fontWeight: '600',
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  },
  memberName: {
    color: '#e5e7eb',
    fontWeight: '600',
    fontSize: 14,
  },
  memberEmail: {
    color: '#9ca3af',
    fontSize: 12,
  },
  memberContribution: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  memberRole: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 2,
  },
  memberRemoveButton: {
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  memberRemoveText: {
    color: '#fca5a5',
    fontSize: 12,
  },
  inviteBox: {
    marginTop: 12,
  },
  inviteTitle: {
    color: '#e5e7eb',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 6,
  },
});
