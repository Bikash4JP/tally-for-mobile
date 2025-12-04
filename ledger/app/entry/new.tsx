// app/entry/new.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useData } from '../../src/context/AppDataContext';
import type { Ledger } from '../../src/models/ledger';

type LedgerTarget = 'debit' | 'credit';

const COLORS = {
  primary: '#ac0c79',
  dark: '#121212',
  lightBg: '#ffffff',
  accent: '#2e9ff5',
  border: '#dddddd',
  muted: '#777777',
};

export default function NewEntryScreen() {
  const router = useRouter();
  const { ledgers, addTransaction, addLedger } = useData();

  const today = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [debitQuery, setDebitQuery] = useState<string>('');
  const [debitLedgerId, setDebitLedgerId] = useState<string>('');

  const [creditQuery, setCreditQuery] = useState<string>('');
  const [creditLedgerId, setCreditLedgerId] = useState<string>('');

  const [amountText, setAmountText] = useState<string>('');
  const [narration, setNarration] = useState<string>('');

  const [createTarget, setCreateTarget] = useState<LedgerTarget | null>(null);
  const [newLedgerName, setNewLedgerName] = useState('');
  const [newLedgerGroup, setNewLedgerGroup] =
    useState<string>('Sundry Debtors');
  const [newLedgerNature, setNewLedgerNature] =
    useState<Ledger['nature']>('Asset');
  const [newLedgerIsParty, setNewLedgerIsParty] = useState<boolean>(true);

  const openCreateLedger = (target: LedgerTarget, presetName: string) => {
    setCreateTarget(target);
    setNewLedgerName(presetName);
    setNewLedgerGroup('Sundry Debtors');
    setNewLedgerNature('Asset');
    setNewLedgerIsParty(true);
  };

  const cancelCreateLedger = () => {
    setCreateTarget(null);
  };

  const saveNewLedger = () => {
    const name = newLedgerName.trim();
    if (!name) {
      Alert.alert('Validation', 'Ledger name required.');
      return;
    }

    const created = addLedger({
      name,
      groupName: newLedgerGroup.trim() || 'Sundry Debtors',
      nature: newLedgerNature,
      isParty: newLedgerIsParty,
    });

    if (createTarget === 'debit') {
      setDebitLedgerId(created.id);
      setDebitQuery(created.name);
    } else if (createTarget === 'credit') {
      setCreditLedgerId(created.id);
      setCreditQuery(created.name);
    }

    setCreateTarget(null);
  };

  const getSuggestions = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as Ledger[];
    return ledgers
      .filter((l) => l.name.toLowerCase().includes(q))
      .slice(0, 6);
  };

  const hasExactMatch = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return false;
    return ledgers.some((l) => l.name.toLowerCase() === q);
  };

  const debitSuggestions = getSuggestions(debitQuery);
  const creditSuggestions = getSuggestions(creditQuery);

  const handleSave = () => {
    const amount = Number(amountText.replace(/,/g, ''));

    if (!debitLedgerId || !creditLedgerId) {
      Alert.alert(
        'Validation',
        'Debit (Dr) aur Credit (Cr) dono ledger select karo.',
      );
      return;
    }
    if (debitLedgerId === creditLedgerId) {
      Alert.alert('Validation', 'Dr aur Cr ledger alag hone chahiye.');
      return;
    }
    if (!amount || amount <= 0 || Number.isNaN(amount)) {
      Alert.alert('Validation', 'Amount sahi daalo (number > 0).');
      return;
    }

    addTransaction({
      date: today,
      debitLedgerId,
      creditLedgerId,
      amount,
      narration: narration.trim() || undefined,
    });

    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  const renderLedgerSelector = (
    label: string,
    query: string,
    setQuery: (v: string) => void,
    selectedId: string,
    setSelectedId: (id: string) => void,
    suggestions: Ledger[],
    target: LedgerTarget,
  ) => {
    const exact = hasExactMatch(query);

    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setSelectedId('');
          }}
          placeholder="Type ledger name"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
        />

        {query.trim().length > 0 && (
          <View style={styles.suggestionsBox}>
            {suggestions.map((l) => (
              <TouchableOpacity
                key={l.id}
                style={styles.suggestionRow}
                onPress={() => {
                  setQuery(l.name);
                  setSelectedId(l.id);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionName}>{l.name}</Text>
                <Text style={styles.suggestionMeta}>
                  {l.groupName} ・ {l.nature}
                </Text>
              </TouchableOpacity>
            ))}

            {!exact && query.trim().length > 0 && (
              <TouchableOpacity
                style={styles.createLedgerRow}
                onPress={() => openCreateLedger(target, query)}
                activeOpacity={0.7}
              >
                <Text style={styles.createLedgerText}>
                  ＋ Create ledger “{query.trim()}”
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {selectedId ? (
          <Text style={styles.selectedHint}>Selected id: {selectedId}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Entry',
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.autoDateValue}>{today} (auto)</Text>
        </View>

        {renderLedgerSelector(
          'Debit (Dr) Ledger / Particular',
          debitQuery,
          setDebitQuery,
          debitLedgerId,
          setDebitLedgerId,
          debitSuggestions,
          'debit',
        )}

        {renderLedgerSelector(
          'Credit (Cr) Ledger / Counter A/C',
          creditQuery,
          setCreditQuery,
          creditLedgerId,
          setCreditLedgerId,
          creditSuggestions,
          'credit',
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            value={amountText}
            onChangeText={setAmountText}
            placeholder="Enter amount"
            placeholderTextColor={COLORS.muted}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Narration / Remarks</Text>
          <TextInput
            value={narration}
            onChangeText={setNarration}
            placeholder="Add narration / remarks (optional)"
            placeholderTextColor={COLORS.muted}
            style={[styles.input, styles.inputMultiline]}
            multiline
            numberOfLines={3}
          />
        </View>

        {createTarget && (
          <View style={styles.newLedgerBox}>
            <Text style={styles.newLedgerTitle}>Create Ledger</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Ledger Name</Text>
              <TextInput
                value={newLedgerName}
                onChangeText={setNewLedgerName}
                style={styles.input}
                placeholder="Ledger name"
                placeholderTextColor={COLORS.muted}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Group Name</Text>
              <TextInput
                value={newLedgerGroup}
                onChangeText={setNewLedgerGroup}
                placeholder="Group name (e.g. Sundry Debtors)"
                placeholderTextColor={COLORS.muted}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nature</Text>
              <View style={styles.natureRow}>
                {(['Asset', 'Liability', 'Income', 'Expense'] as Ledger['nature'][]).map(
                  (n) => {
                    const selected = n === newLedgerNature;
                    return (
                      <TouchableOpacity
                        key={n}
                        style={[
                          styles.natureChip,
                          selected && styles.natureChipSelected,
                        ]}
                        onPress={() => setNewLedgerNature(n)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.natureChipText,
                            selected && styles.natureChipTextSelected,
                          ]}
                        >
                          {n}
                        </Text>
                      </TouchableOpacity>
                    );
                  },
                )}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Is Party?</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleChip,
                    newLedgerIsParty && styles.toggleChipSelected,
                  ]}
                  onPress={() => setNewLedgerIsParty(true)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.toggleChipText,
                      newLedgerIsParty && styles.toggleChipTextSelected,
                    ]}
                  >
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleChip,
                    !newLedgerIsParty && styles.toggleChipSelected,
                  ]}
                  onPress={() => setNewLedgerIsParty(false)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.toggleChipText,
                      !newLedgerIsParty && styles.toggleChipTextSelected,
                    ]}
                  >
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.newLedgerButtonsRow}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={cancelCreateLedger}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={saveNewLedger}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryButtonText}>Save Ledger</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryButtonText}>Save Entry</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: COLORS.dark,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.dark,
    backgroundColor: '#fafafa',
  },
  inputMultiline: {
    textAlignVertical: 'top',
    minHeight: 70,
  },
  autoDateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  suggestionsBox: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.lightBg,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  suggestionName: {
    fontSize: 14,
    color: COLORS.dark,
  },
  suggestionMeta: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  createLedgerRow: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#f7f2f9',
  },
  createLedgerText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  selectedHint: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.muted,
  },
  newLedgerBox: {
    marginTop: 8,
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: '#fff7fc',
  },
  newLedgerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: COLORS.primary,
  },
  natureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  natureChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
    marginBottom: 6,
  },
  natureChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  natureChipText: {
    fontSize: 12,
    color: COLORS.dark,
  },
  natureChipTextSelected: {
    color: COLORS.lightBg,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
  },
  toggleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  toggleChipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  toggleChipText: {
    fontSize: 12,
    color: COLORS.dark,
  },
  toggleChipTextSelected: {
    color: COLORS.lightBg,
    fontWeight: '600',
  },
  newLedgerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginLeft: 10,
  },
  secondaryButton: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.lightBg,
  },
  primaryButton: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: COLORS.dark,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.lightBg,
  },
});
