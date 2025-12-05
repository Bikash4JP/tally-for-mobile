// app/entry/new.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useData } from '../../src/context/AppDataContext';
import type { Ledger } from '../../src/models/ledger';
import type { VoucherType } from '../../src/models/transaction';

const COLORS = {
  primary: '#ac0c79',
  dark: '#121212',
  lightBg: '#ffffff',
  accent: '#2e9ff5',
  muted: '#777777',
  border: '#e0e0e0',
  danger: '#d32f2f',
};

type EntryType = 'cashBook' | 'journal';

type Line = {
  id: string;
  ledgerId?: string;
  ledgerName: string;
  amount: string;
};

export default function NewEntryScreen() {
  const router = useRouter();
  const { ledgers, addTransaction, addLedger } = useData();

  const [entryType, setEntryType] = useState<EntryType>('cashBook');

  // ----- CASH BOOK STATE -----
  const [cashDirection, setCashDirection] = useState<'in' | 'out'>('out');
  const [cashLedgerId, setCashLedgerId] = useState<string | undefined>();
  const [cashLedgerQuery, setCashLedgerQuery] = useState('');
  const [otherLedgerId, setOtherLedgerId] = useState<string | undefined>();
  const [otherLedgerQuery, setOtherLedgerQuery] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cashNarration, setCashNarration] = useState('');

  // ----- JOURNAL STATE -----
  const [journalDate, setJournalDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [journalNarration, setJournalNarration] = useState('');

  const [debitLines, setDebitLines] = useState<Line[]>([
    { id: 'dr-1', ledgerName: '', amount: '' },
  ]);
  const [creditLines, setCreditLines] = useState<Line[]>([
    { id: 'cr-1', ledgerName: '', amount: '' },
  ]);

  const todayDateStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const cashLedgers = useMemo(
    () =>
      ledgers.filter((l) =>
        ['cash', 'bank'].some((word) =>
          l.name.toLowerCase().includes(word),
        ),
      ),
    [ledgers],
  );

  const findMatchingLedgers = (query: string): Ledger[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ledgers
      .filter((l) => l.name.toLowerCase().includes(q))
      .slice(0, 8);
  };

  const createSimplePartyLedger = (name: string): Ledger => {
    const clean = name.trim();
    if (!clean) {
      throw new Error('Cannot create ledger with empty name');
    }
    const existing = ledgers.find(
      (l) => l.name.toLowerCase() === clean.toLowerCase(),
    );
    if (existing) return existing;

    return addLedger({
      name: clean,
      groupName: 'Sundry Parties',
      nature: 'Asset',
      isParty: true,
    });
  };

  const parseAmount = (v: string): number => {
    const num = parseFloat(v.replace(/,/g, ''));
    return Number.isNaN(num) ? 0 : Math.abs(num);
  };

  // ========== SAVE: CASH BOOK ==========
  const handleSaveCashBook = () => {
    const amount = parseAmount(cashAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Validation', 'Please enter amount.');
      return;
    }

    let usedCashLedger = cashLedgerId
      ? ledgers.find((l) => l.id === cashLedgerId)
      : undefined;

    if (!usedCashLedger) {
      if (!cashLedgerQuery.trim()) {
        Alert.alert('Validation', 'Please select or type Cash/Bank account.');
        return;
      }
      usedCashLedger = createSimplePartyLedger(cashLedgerQuery);
    }

    let usedOtherLedger = otherLedgerId
      ? ledgers.find((l) => l.id === otherLedgerId)
      : undefined;

    if (!usedOtherLedger) {
      if (!otherLedgerQuery.trim()) {
        Alert.alert(
          'Validation',
          'Please select or type the other account (Rent, Sales, Party, etc.).',
        );
        return;
      }
      usedOtherLedger = createSimplePartyLedger(otherLedgerQuery);
    }

    const date = todayDateStr;
    const narration =
      cashNarration.trim() ||
      (cashDirection === 'out'
        ? `Payment to ${usedOtherLedger.name}`
        : `Receipt from ${usedOtherLedger.name}`);

    const voucherType: VoucherType =
      cashDirection === 'out' ? 'Payment' : 'Receipt';

    if (cashDirection === 'out') {
      // Other A/C Dr  To Cash/Bank
      addTransaction({
        date,
        debitLedgerId: usedOtherLedger.id,
        creditLedgerId: usedCashLedger.id,
        amount,
        narration,
        voucherType,
      });
    } else {
      // Cash/Bank Dr  To Other A/C
      addTransaction({
        date,
        debitLedgerId: usedCashLedger.id,
        creditLedgerId: usedOtherLedger.id,
        amount,
        narration,
        voucherType,
      });
    }

    Alert.alert('Success', 'Entries saved successfully.', [
      {
        text: 'OK',
        onPress: () => router.replace('/(tabs)/entries'),
      },
    ]);
  };

  // ========== SAVE: JOURNAL ==========
  const handleSaveJournal = () => {
    const drLines = debitLines
      .map((line) => ({
        ...line,
        amountNum: parseAmount(line.amount),
      }))
      .filter((l) => l.ledgerName.trim() && l.amountNum > 0);

    const crLines = creditLines
      .map((line) => ({
        ...line,
        amountNum: parseAmount(line.amount),
      }))
      .filter((l) => l.ledgerName.trim() && l.amountNum > 0);

    if (drLines.length === 0 || crLines.length === 0) {
      Alert.alert(
        'Validation',
        'Please enter at least one debit and one credit line.',
      );
      return;
    }

    const totalDr = drLines.reduce((s, l) => s + l.amountNum, 0);
    const totalCr = crLines.reduce((s, l) => s + l.amountNum, 0);

    if (Math.abs(totalDr - totalCr) > 0.001) {
      Alert.alert(
        'Validation',
        `Debit (¥${totalDr.toLocaleString()}) is not equal to Credit (¥${totalCr.toLocaleString()}).`,
      );
      return;
    }

    if (drLines.length > 1 && crLines.length > 1) {
      Alert.alert(
        'Limitation',
        'Abhi ke liye: ya to multiple Debits with a single Credit, ya multiple Credits with a single Debit supported hai.',
      );
      return;
    }

    const date = journalDate.trim() || todayDateStr;
    const narration = journalNarration.trim() || 'Journal entry';

    const resolveLedger = (name: string): Ledger => {
      const clean = name.trim();
      const existing = ledgers.find(
        (l) => l.name.toLowerCase() === clean.toLowerCase(),
      );
      if (existing) return existing;
      return createSimplePartyLedger(clean);
    };

    if (crLines.length === 1) {
      // Many Dr → One Cr
      const cr = crLines[0];
      const crLedger = resolveLedger(cr.ledgerName);

      drLines.forEach((dr) => {
        const drLedger = resolveLedger(dr.ledgerName);
        addTransaction({
          date,
          debitLedgerId: drLedger.id,
          creditLedgerId: crLedger.id,
          amount: dr.amountNum,
          narration,
          voucherType: 'Journal',
        });
      });
    } else if (drLines.length === 1) {
      // One Dr → Many Cr
      const dr = drLines[0];
      const drLedger = resolveLedger(dr.ledgerName);

      crLines.forEach((cr) => {
        const crLedger = resolveLedger(cr.ledgerName);
        addTransaction({
          date,
          debitLedgerId: drLedger.id,
          creditLedgerId: crLedger.id,
          amount: cr.amountNum,
          narration,
          voucherType: 'Journal',
        });
      });
    }

    Alert.alert('Success', 'Entries saved successfully.', [
      {
        text: 'OK',
        onPress: () => router.replace('/(tabs)/entries'),
      },
    ]);
  };

  const renderChip = (value: EntryType, label: string) => {
    const selected = entryType === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.modeChip, selected && styles.modeChipSelected]}
        onPress={() => setEntryType(value)}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.modeChipText, selected && styles.modeChipTextSelected]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Add Entry' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.modeRow}>
          {renderChip('cashBook', 'Cash Book')}
          {renderChip('journal', 'Journal')}
        </View>

        {entryType === 'cashBook' ? (
          <CashBookForm
            cashDirection={cashDirection}
            setCashDirection={setCashDirection}
            cashLedgers={cashLedgers}
            cashLedgerId={cashLedgerId}
            setCashLedgerId={setCashLedgerId}
            cashLedgerQuery={cashLedgerQuery}
            setCashLedgerQuery={setCashLedgerQuery}
            otherLedgerId={otherLedgerId}
            setOtherLedgerId={setOtherLedgerId}
            otherLedgerQuery={otherLedgerQuery}
            setOtherLedgerQuery={setOtherLedgerQuery}
            amount={cashAmount}
            setAmount={setCashAmount}
            narration={cashNarration}
            setNarration={setCashNarration}
            findMatchingLedgers={findMatchingLedgers}
            onSave={handleSaveCashBook}
          />
        ) : (
          <JournalForm
            date={journalDate}
            setDate={setJournalDate}
            narration={journalNarration}
            setNarration={setJournalNarration}
            debitLines={debitLines}
            setDebitLines={setDebitLines}
            creditLines={creditLines}
            setCreditLines={setCreditLines}
            findMatchingLedgers={findMatchingLedgers}
            onSave={handleSaveJournal}
          />
        )}
      </ScrollView>
    </>
  );
}

// ===== CASH BOOK FORM =====
type CashBookProps = {
  cashDirection: 'in' | 'out';
  setCashDirection: (v: 'in' | 'out') => void;
  cashLedgers: Ledger[];
  cashLedgerId?: string;
  setCashLedgerId: (id?: string) => void;
  cashLedgerQuery: string;
  setCashLedgerQuery: (v: string) => void;
  otherLedgerId?: string;
  setOtherLedgerId: (id?: string) => void;
  otherLedgerQuery: string;
  setOtherLedgerQuery: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  narration: string;
  setNarration: (v: string) => void;
  findMatchingLedgers: (q: string) => Ledger[];
  onSave: () => void;
};

function CashBookForm(props: CashBookProps) {
  const {
    cashDirection,
    setCashDirection,
    cashLedgers,
    cashLedgerId,
    setCashLedgerId,
    cashLedgerQuery,
    setCashLedgerQuery,
    otherLedgerId,
    setOtherLedgerId,
    otherLedgerQuery,
    setOtherLedgerQuery,
    amount,
    setAmount,
    narration,
    setNarration,
    findMatchingLedgers,
    onSave,
  } = props;

  const cashSuggestions = useMemo(
    () =>
      cashLedgerQuery
        ? cashLedgers
            .filter((l) =>
              l.name.toLowerCase().includes(cashLedgerQuery.toLowerCase()),
            )
            .slice(0, 6)
        : [],
    [cashLedgerQuery, cashLedgers],
  );

  const otherSuggestions = useMemo(
    () => findMatchingLedgers(otherLedgerQuery),
    [otherLedgerQuery, findMatchingLedgers],
  );

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Cash Book Entry</Text>

      <View style={styles.chipRow}>
        <TouchableOpacity
          style={[
            styles.smallChip,
            cashDirection === 'in' && styles.smallChipSelected,
          ]}
          onPress={() => setCashDirection('in')}
        >
          <Text
            style={[
              styles.smallChipText,
              cashDirection === 'in' && styles.smallChipTextSelected,
            ]}
          >
            Cash In
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.smallChip,
            cashDirection === 'out' && styles.smallChipSelected,
          ]}
          onPress={() => setCashDirection('out')}
        >
          <Text
            style={[
              styles.smallChipText,
              cashDirection === 'out' && styles.smallChipTextSelected,
            ]}
          >
            Cash Out
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Cash / Bank A/C</Text>
      <TextInput
        style={styles.input}
        value={cashLedgerQuery}
        onChangeText={(v) => {
          setCashLedgerQuery(v);
          setCashLedgerId(undefined);
        }}
      />
      {cashSuggestions.length > 0 && (
        <View style={styles.suggestionBox}>
          {cashSuggestions.map((ledger) => (
            <TouchableOpacity
              key={ledger.id}
              style={styles.suggestionItem}
              onPress={() => {
                setCashLedgerId(ledger.id);
                setCashLedgerQuery(ledger.name);
              }}
            >
              <Text style={styles.suggestionText}>{ledger.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={[styles.label, { marginTop: 10 }]}>Particular A/C</Text>
      <TextInput
        style={styles.input}
        value={otherLedgerQuery}
        onChangeText={(v) => {
          setOtherLedgerQuery(v);
          setOtherLedgerId(undefined);
        }}
      />
      {otherSuggestions.length > 0 && (
        <View style={styles.suggestionBox}>
          {otherSuggestions.map((ledger) => (
            <TouchableOpacity
              key={ledger.id}
              style={styles.suggestionItem}
              onPress={() => {
                setOtherLedgerId(ledger.id);
                setOtherLedgerQuery(ledger.name);
              }}
            >
              <Text style={styles.suggestionText}>{ledger.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={[styles.label, { marginTop: 10 }]}>Amount</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={[styles.label, { marginTop: 10 }]}>Narration</Text>
      <TextInput
        style={[styles.input, { minHeight: 60 }]}
        multiline
        value={narration}
        onChangeText={setNarration}
      />

      <TouchableOpacity style={styles.saveButton} onPress={onSave}>
        <Text style={styles.saveButtonText}>Save Cash Entry</Text>
      </TouchableOpacity>
    </View>
  );
}

// ===== JOURNAL FORM =====
type JournalProps = {
  date: string;
  setDate: (v: string) => void;
  narration: string;
  setNarration: (v: string) => void;
  debitLines: Line[];
  setDebitLines: (ls: Line[]) => void;
  creditLines: Line[];
  setCreditLines: (ls: Line[]) => void;
  findMatchingLedgers: (q: string) => Ledger[];
  onSave: () => void;
};

function JournalForm(props: JournalProps) {
  const {
    date,
    setDate,
    narration,
    setNarration,
    debitLines,
    setDebitLines,
    creditLines,
    setCreditLines,
    findMatchingLedgers,
    onSave,
  } = props;

  const updateLine = (
    type: 'dr' | 'cr',
    id: string,
    patch: Partial<Line>,
  ) => {
    if (type === 'dr') {
      const updated = debitLines.map((l) =>
        l.id === id ? { ...l, ...patch } : l,
      );
      setDebitLines(updated);
    } else {
      const updated = creditLines.map((l) =>
        l.id === id ? { ...l, ...patch } : l,
      );
      setCreditLines(updated);
    }
  };

  const addLine = (type: 'dr' | 'cr') => {
    const id = `${type}-${Date.now()}`;
    const newLine: Line = { id, ledgerName: '', amount: '' };
    if (type === 'dr') {
      setDebitLines([...debitLines, newLine]);
    } else {
      setCreditLines([...creditLines, newLine]);
    }
  };

  const removeLine = (type: 'dr' | 'cr', id: string) => {
    if (type === 'dr') {
      if (debitLines.length === 1) return;
      setDebitLines(debitLines.filter((l) => l.id !== id));
    } else {
      if (creditLines.length === 1) return;
      setCreditLines(creditLines.filter((l) => l.id !== id));
    }
  };

  const renderLine = (type: 'dr' | 'cr', line: Line, index: number) => {
    const suggestions = findMatchingLedgers(line.ledgerName);

    return (
      <View key={line.id} style={styles.journalLine}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>
            {type === 'dr' ? `Dr Ledger ${index + 1}` : `Cr Ledger ${index + 1}`}
          </Text>
          <TextInput
            style={styles.input}
            value={line.ledgerName}
            onChangeText={(v) => updateLine(type, line.id, { ledgerName: v })}
          />
          {suggestions.length > 0 && line.ledgerName.trim().length > 0 && (
            <View style={styles.suggestionBox}>
              {suggestions.map((ledger) => (
                <TouchableOpacity
                  key={ledger.id}
                  style={styles.suggestionItem}
                  onPress={() =>
                    updateLine(type, line.id, { ledgerName: ledger.name })
                  }
                >
                  <Text style={styles.suggestionText}>{ledger.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.amountColumn}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={line.amount}
            onChangeText={(v) => updateLine(type, line.id, { amount: v })}
          />
          <TouchableOpacity
            style={styles.removeLineBtn}
            onPress={() => removeLine(type, line.id)}
          >
            <Text style={styles.removeLineText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const totalDr = debitLines.reduce(
    (s, l) => s + (parseFloat(l.amount || '0') || 0),
    0,
  );
  const totalCr = creditLines.reduce(
    (s, l) => s + (parseFloat(l.amount || '0') || 0),
    0,
  );

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Journal Entry</Text>

      <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={date} onChangeText={setDate} />

      <Text style={[styles.subTitle, { marginTop: 10 }]}>Debit</Text>
      {debitLines.map((line, index) => renderLine('dr', line, index))}
      <TouchableOpacity
        style={styles.addLineButton}
        onPress={() => addLine('dr')}
      >
        <Text style={styles.addLineText}>+ Add Debit Line</Text>
      </TouchableOpacity>

      <Text style={[styles.subTitle, { marginTop: 16 }]}>Credit</Text>
      {creditLines.map((line, index) => renderLine('cr', line, index))}
      <TouchableOpacity
        style={styles.addLineButton}
        onPress={() => addLine('cr')}
      >
        <Text style={styles.addLineText}>+ Add Credit Line</Text>
      </TouchableOpacity>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Dr:</Text>
        <Text style={styles.totalValue}>
          ¥{totalDr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Cr:</Text>
        <Text style={styles.totalValue}>
          ¥{totalCr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Text>
      </View>
      {Math.abs(totalDr - totalCr) > 0.001 && (
        <Text style={styles.mismatchText}>
          Dr and Cr totals must be equal for a valid journal.
        </Text>
      )}

      <Text style={[styles.label, { marginTop: 10 }]}>Narration</Text>
      <TextInput
        style={[styles.input, { minHeight: 60 }]}
        multiline
        value={narration}
        onChangeText={setNarration}
      />

      <TouchableOpacity style={styles.saveButton} onPress={onSave}>
        <Text style={styles.saveButtonText}>Save Journal Entry</Text>
      </TouchableOpacity>
    </View>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeChipText: {
    fontSize: 13,
    color: COLORS.dark,
  },
  modeChipTextSelected: {
    color: COLORS.lightBg,
    fontWeight: '600',
  },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    backgroundColor: '#fdf7fb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  label: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.dark,
    backgroundColor: '#ffffff',
  },

  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  smallChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  smallChipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  smallChipText: {
    fontSize: 12,
    color: COLORS.dark,
  },
  smallChipTextSelected: {
    color: COLORS.lightBg,
    fontWeight: '600',
  },

  suggestionBox: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  suggestionText: {
    fontSize: 12,
    color: COLORS.dark,
  },

  saveButton: {
    marginTop: 16,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: COLORS.dark,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.lightBg,
  },

  journalLine: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  amountColumn: {
    width: 100,
  },
  addLineButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addLineText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '500',
  },
  removeLineBtn: {
    marginTop: 4,
    alignSelf: 'flex-end',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  removeLineText: {
    fontSize: 16,
    color: COLORS.danger,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.dark,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  mismatchText: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.danger,
  },
});
