// app/(tabs)/entries.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useData } from '../../src/context/AppDataContext';

import type { Transaction } from '../../src/models/transaction';
import type { Ledger } from '../../src/models/ledger';

const COLORS = {
  primary: '#ac0c79',
  dark: '#121212',
  lightBg: '#ffffff',
  accent: '#2e9ff5',
  muted: '#777777',
  border: '#e0e0e0',
};

type VoucherFilter = 'all' | 'Cash' | 'Journal' | 'Payment' | 'Receipt';

type EnhancedTx = Transaction & {
  debitName: string;
  creditName: string;
};

export default function EntriesScreen() {
  const { transactions, ledgers } = useData();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [voucherFilter, setVoucherFilter] = useState<VoucherFilter>('all');

  const ledgerMap = useMemo(() => {
    const map: Record<string, Ledger> = {};
    ledgers.forEach((l) => {
      map[l.id] = l;
    });
    return map;
  }, [ledgers]);

  const enhancedTx: EnhancedTx[] = useMemo(() => {
    const list: EnhancedTx[] = transactions.map((t: Transaction) => {
      const debit = ledgerMap[t.debitLedgerId];
      const credit = ledgerMap[t.creditLedgerId];

      return {
        ...t,
        debitName: debit ? debit.name : t.debitLedgerId,
        creditName: credit ? credit.name : t.creditLedgerId,
      };
    });

    // Newest on top
    return list.sort((a, b) => {
      if (a.date === b.date) return b.id.localeCompare(a.id);
      return a.date < b.date ? 1 : -1;
    });
  }, [transactions, ledgerMap]);

  const filteredTx: EnhancedTx[] = useMemo(() => {
    return enhancedTx.filter((t) => {
      if (voucherFilter !== 'all' && t.voucherType !== voucherFilter) {
        return false;
      }

      if (fromDate && t.date < fromDate) return false;
      if (toDate && t.date > toDate) return false;

      const q = search.trim().toLowerCase();
      if (!q) return true;

      const haystack = [
        t.debitName.toLowerCase(),
        t.creditName.toLowerCase(),
        (t.narration || '').toLowerCase(),
      ];

      return haystack.some((h) => h.includes(q));
    });
  }, [enhancedTx, voucherFilter, fromDate, toDate, search]);

  const renderVoucherChip = (value: VoucherFilter, label: string) => {
    const selected = voucherFilter === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.voucherChip, selected && styles.voucherChipSelected]}
        onPress={() => setVoucherFilter(value)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.voucherChipText,
            selected && styles.voucherChipTextSelected,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const goToAddEntry = () => {
    router.push({ pathname: '/entry/new' });
  };

  const openEntryDetail = (id: string) => {
    router.push({ pathname: '/entry/[id]', params: { id } });
  };

  return (
    <View style={styles.root}>
      {/* Header + Add button */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Entries</Text>
          <Text style={styles.subtitle}>
            All vouchers in one place. Tap any row to see full details.
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={goToAddEntry}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterCard}>
        <Text style={styles.filterTitle}>Filters</Text>

        <View style={styles.filterRow}>
          <View style={styles.filterCol}>
            <Text style={styles.filterLabel}>From (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.filterInput}
              value={fromDate}
              onChangeText={setFromDate}
            />
          </View>
          <View style={styles.filterCol}>
            <Text style={styles.filterLabel}>To (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.filterInput}
              value={toDate}
              onChangeText={setToDate}
            />
          </View>
        </View>

        <Text style={[styles.filterLabel, { marginTop: 8 }]}>
          Ledger / Narration
        </Text>
        <TextInput
          style={styles.filterInput}
          value={search}
          onChangeText={setSearch}
        />

        <Text style={[styles.filterLabel, { marginTop: 8 }]}>
          Voucher Type
        </Text>
        <View style={styles.voucherRow}>
          {renderVoucherChip('all', 'All')}
          {renderVoucherChip('Cash', 'Cash')}
          {renderVoucherChip('Journal', 'Journal')}
          {renderVoucherChip('Payment', 'Payment')}
          {renderVoucherChip('Receipt', 'Receipt')}
        </View>
      </View>

      {/* Entries list */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {filteredTx.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No entries match the current filters.
            </Text>
          </View>
        ) : (
          filteredTx.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={styles.entryCard}
              activeOpacity={0.8}
              onPress={() => openEntryDetail(t.id)}
            >
              <View style={styles.entryRowTop}>
                <Text style={styles.entryDate}>{t.date}</Text>
                <Text style={styles.entryAmount}>
                  ¥{t.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>

              <View style={styles.entryRowMiddle}>
                <Text style={styles.entryVoucher}>{t.voucherType}</Text>
                <Text style={styles.entryPair} numberOfLines={1}>
                  {t.debitName} <Text style={styles.entryArrow}>→</Text>{' '}
                  {t.creditName}
                </Text>
              </View>

              {t.narration ? (
                <Text style={styles.entryNarration} numberOfLines={2}>
                  {t.narration}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
    padding: 16,
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
    maxWidth: 220,
  },
  addButton: {
    backgroundColor: COLORS.dark,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: COLORS.lightBg,
    fontWeight: '600',
    fontSize: 13,
  },

  filterCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    backgroundColor: '#fdf7fb',
    marginBottom: 10,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 6,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterCol: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 3,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    color: COLORS.dark,
    backgroundColor: COLORS.lightBg,
  },
  voucherRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  voucherChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  voucherChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  voucherChipText: {
    fontSize: 11,
    color: COLORS.dark,
  },
  voucherChipTextSelected: {
    color: COLORS.lightBg,
    fontWeight: '600',
  },

  listContainer: {
    flex: 1,
    marginTop: 4,
  },
  emptyBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
  },

  entryCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    backgroundColor: '#ffffff',
    padding: 10,
    marginBottom: 8,
  },
  entryRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 12,
    color: COLORS.muted,
  },
  entryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  entryRowMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  entryVoucher: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
  },
  entryPair: {
    fontSize: 12,
    color: COLORS.dark,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  entryArrow: {
    color: COLORS.muted,
  },
  entryNarration: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
});
