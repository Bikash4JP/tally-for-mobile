// app/(tabs)/reports.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

// 👉 yahan dhyaan: agar tumhara file `src/context/DataContext.tsx` hai
// toh yeh line change karke:
//   import { useData } from '../../src/context/DataContext';
// kar dena.
import { useData } from '../../src/context/AppDataContext';

import type { Ledger } from '../../src/models/ledger';
import type { Transaction } from '../../src/models/transaction';

const COLORS = {
  primary: '#ac0c79',
  dark: '#121212',
  lightBg: '#ffffff',
  accent: '#2e9ff5',
  muted: '#777777',
  border: '#e0e0e0',
};

type ReportMode = 'overall' | 'monthly' | 'yearly';

type TrialRow = {
  ledgerId: string;
  name: string;
  debit: number;
  credit: number;
};

export default function ReportsScreen() {
  const { ledgers, transactions } = useData();
  const [mode, setMode] = useState<ReportMode>('overall');

  const trialRows: TrialRow[] = useMemo(() => {
    const rows: TrialRow[] = ledgers.map((ledger: Ledger) => {
      let debitTotal = 0;
      let creditTotal = 0;

      transactions.forEach((t: Transaction) => {
        if (t.debitLedgerId === ledger.id) debitTotal += t.amount;
        if (t.creditLedgerId === ledger.id) creditTotal += t.amount;
      });

      return {
        ledgerId: ledger.id,
        name: ledger.name,
        debit: debitTotal,
        credit: creditTotal,
      };
    });

    return rows.filter((r: TrialRow) => r.debit > 0 || r.credit > 0);
  }, [ledgers, transactions]);

  const totals = useMemo(
    () =>
      trialRows.reduce(
        (acc: { debit: number; credit: number }, row: TrialRow) => {
          acc.debit += row.debit;
          acc.credit += row.credit;
          return acc;
        },
        { debit: 0, credit: 0 },
      ),
    [trialRows],
  );

  const renderModeTag = (value: ReportMode, label: string) => {
    const selected = mode === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.modeChip, selected && styles.modeChipSelected]}
        onPress={() => setMode(value)}
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>
            Trial balance and high-level accounting summaries.
          </Text>
        </View>
      </View>

      <View style={styles.modesRow}>
        {renderModeTag('overall', 'Overall')}
        {renderModeTag('monthly', 'Monthly')}
        {renderModeTag('yearly', 'Yearly')}
      </View>

      {mode === 'overall' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trial Balance (Overall)</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellLedger, styles.tableHeaderText]}>
              Ledger
            </Text>
            <Text
              style={[styles.tableCellAmt, styles.tableHeaderText, styles.right]}
            >
              Debit
            </Text>
            <Text
              style={[styles.tableCellAmt, styles.tableHeaderText, styles.right]}
            >
              Credit
            </Text>
          </View>

          {trialRows.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No transactions yet.</Text>
            </View>
          ) : (
            <>
              {trialRows.map((row: TrialRow) => (
                <View style={styles.tableRow} key={row.ledgerId}>
                  <Text style={styles.tableCellLedger}>{row.name}</Text>
                  <Text style={[styles.tableCellAmt, styles.right]}>
                    {row.debit
                      ? `¥${row.debit.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}`
                      : ''}
                  </Text>
                  <Text style={[styles.tableCellAmt, styles.right]}>
                    {row.credit
                      ? `¥${row.credit.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}`
                      : ''}
                  </Text>
                </View>
              ))}

              <View style={styles.tableFooterLine} />

              <View style={styles.tableRow}>
                <Text style={[styles.tableCellLedger, styles.totalLabel]}>
                  TOTAL
                </Text>
                <Text
                  style={[styles.tableCellAmt, styles.right, styles.totalAmount]}
                >
                  ¥{totals.debit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
                <Text
                  style={[styles.tableCellAmt, styles.right, styles.totalAmount]}
                >
                  ¥{totals.credit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </>
          )}
        </View>
      )}

      {mode === 'monthly' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Reports (Coming Soon)</Text>
        </View>
      )}

      {mode === 'yearly' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Yearly / Final Accounts (Coming Soon)
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Planned Reports</Text>
        <View style={styles.reportGrid}>
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Profit & Loss</Text>
            <Text style={styles.reportText}>
              Income vs expenses monthly / yearly.
            </Text>
          </View>
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Balance Sheet</Text>
            <Text style={styles.reportText}>
              Assets / Liabilities / Capital snapshot.
            </Text>
          </View>
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Cash Flow</Text>
            <Text style={styles.reportText}>
              Movement in cash / bank ledgers.
            </Text>
          </View>
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Ledger Analysis</Text>
            <Text style={styles.reportText}>
              Turnover & balances per ledger.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  headerRow: {
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },
  modesRow: {
    flexDirection: 'row',
    marginVertical: 12,
    gap: 8,
  },
  modeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
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
  section: {
    marginTop: 4,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  tableCellLedger: {
    flex: 2,
    fontSize: 13,
    color: COLORS.dark,
  },
  tableCellAmt: {
    flex: 1,
    fontSize: 13,
    color: COLORS.dark,
  },
  tableHeaderText: {
    fontWeight: '600',
    color: COLORS.dark,
  },
  right: {
    textAlign: 'right',
  },
  tableFooterLine: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: 4,
    marginBottom: 4,
  },
  totalLabel: {
    fontWeight: '700',
  },
  totalAmount: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyBox: {
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  reportCard: {
    flexBasis: '48%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    backgroundColor: '#fafafa',
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  reportText: {
    fontSize: 12,
    color: COLORS.muted,
  },
});
