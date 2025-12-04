// app/ledger/[id].tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
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

type PeriodMode = 'all' | 'thisMonth' | 'thisYear' | 'custom';

function parseDateSafe(dateStr: string): Date | null {
  if (!dateStr) return null;
  const normalized = dateStr.replace(/\./g, '-').replace(/\//g, '-');
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function LedgerDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { ledgers, transactions } = useData();
  const ledgerId = params.id;

  const ledger = ledgers.find((l) => l.id === ledgerId);

  const [periodMode, setPeriodMode] = useState<PeriodMode>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const today = new Date();

  const periodLabel = useMemo(() => {
    switch (periodMode) {
      case 'thisMonth':
        return 'This Month';
      case 'thisYear':
        return 'This Year';
      case 'custom':
        return `Custom (${fromDate || '…'} to ${toDate || '…'})`;
      default:
        return 'All';
    }
  }, [periodMode, fromDate, toDate]);

  const { lines, totals } = useMemo(() => {
    if (!ledger) {
      return { lines: [], totals: { dr: 0, cr: 0 } };
    }

    const isInPeriod = (dateStr: string) => {
      const d = parseDateSafe(dateStr);
      if (!d) return false;

      if (periodMode === 'thisMonth') {
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth()
        );
      }

      if (periodMode === 'thisYear') {
        return d.getFullYear() === today.getFullYear();
      }

      if (periodMode === 'custom') {
        let ok = true;
        if (fromDate.trim()) {
          const from = parseDateSafe(fromDate.trim());
          if (from && d < from) ok = false;
        }
        if (toDate.trim()) {
          const to = parseDateSafe(toDate.trim());
          if (to && d > to) ok = false;
        }
        return ok;
      }

      // 'all'
      return true;
    };

    const relevantTx = transactions.filter((t) => {
      const involves =
        t.debitLedgerId === ledger.id || t.creditLedgerId === ledger.id;
      if (!involves) return false;
      return isInPeriod(t.date);
    });

    const sortedTx = [...relevantTx].sort((a, b) => {
      const da = parseDateSafe(a.date)?.getTime() ?? 0;
      const db = parseDateSafe(b.date)?.getTime() ?? 0;
      return da - db;
    });

    let runningDr = 0;
    let runningCr = 0;

    const rows = sortedTx.map((t: Transaction) => {
      const isDebit = t.debitLedgerId === ledger.id;
      const counterId = isDebit ? t.creditLedgerId : t.debitLedgerId;
      const counter = ledgers.find((l) => l.id === counterId);
      const particular = counter ? counter.name : counterId;

      const dr = isDebit ? t.amount : 0;
      const cr = !isDebit ? t.amount : 0;

      runningDr += dr;
      runningCr += cr;

      return {
        id: t.id,
        date: t.date,
        particular,
        dr,
        cr,
        narration: t.narration,
      };
    });

    return {
      lines: rows,
      totals: { dr: runningDr, cr: runningCr },
    };
  }, [ledger, ledgers, transactions, periodMode, fromDate, toDate, today]);

  const balance = totals.dr - totals.cr;
  const balanceLabel =
    balance > 0
      ? `Dr ${balance.toLocaleString()}`
      : balance < 0
      ? `Cr ${Math.abs(balance).toLocaleString()}`
      : '0';

  if (!ledger) {
    return (
      <>
        <Stack.Screen options={{ title: 'Ledger' }} />
        <View style={styles.container}>
          <Text style={styles.notFound}>Ledger not found.</Text>
        </View>
      </>
    );
  }

  const handleExportPdf = async () => {
    if (!lines.length) {
      Alert.alert('Export', 'No entries to export for this period.');
      return;
    }

    try {
      const html = buildLedgerHtml(ledger, lines, totals, balanceLabel, periodLabel);
      await Print.printAsync({ html });
    } catch (err) {
      console.warn('PDF export error', err);
      Alert.alert(
        'Export',
        Platform.OS === 'web'
          ? 'Export not supported in this browser environment.'
          : 'Could not export PDF.',
      );
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: ledger.name }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header summary */}
        <View style={styles.headerBox}>
          <Text style={styles.ledgerName}>{ledger.name}</Text>
          <Text style={styles.ledgerGroup}>{ledger.groupName}</Text>
          <Text style={styles.ledgerNature}>
            {ledger.nature}
            {ledger.isParty ? ' ・ Party' : ''}
          </Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Dr</Text>
              <Text style={styles.summaryValue}>
                ¥{totals.dr.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Cr</Text>
              <Text style={styles.summaryValue}>
                ¥{totals.cr.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Balance</Text>
              <Text style={styles.summaryValue}>{balanceLabel}</Text>
            </View>
          </View>
        </View>

        {/* Period + Export */}
        <View style={styles.controlsRow}>
          <View style={styles.periodBox}>
            <Text style={styles.controlsLabel}>Period</Text>
            <View style={styles.periodChipsRow}>
              {renderModeChip('all', 'All', periodMode, setPeriodMode)}
              {renderModeChip('thisMonth', 'This Month', periodMode, setPeriodMode)}
              {renderModeChip('thisYear', 'This Year', periodMode, setPeriodMode)}
              {renderModeChip('custom', 'Custom', periodMode, setPeriodMode)}
            </View>

            {periodMode === 'custom' && (
              <View style={styles.customRow}>
                <View style={styles.customField}>
                  <Text style={styles.customLabel}>From</Text>
                  <TextInput
                    value={fromDate}
                    onChangeText={setFromDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.muted}
                    style={styles.customInput}
                  />
                </View>
                <View style={styles.customField}>
                  <Text style={styles.customLabel}>To</Text>
                  <TextInput
                    value={toDate}
                    onChangeText={setToDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.muted}
                    style={styles.customInput}
                  />
                </View>
              </View>
            )}
          </View>

          <View style={styles.exportBox}>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExportPdf}
              activeOpacity={0.7}
            >
              <Text style={styles.exportText}>Export PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ledger table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.colDate, styles.tableHeaderText]}>Date</Text>
          <Text style={[styles.colParticular, styles.tableHeaderText]}>
            Particular
          </Text>
          <Text style={[styles.colAmt, styles.tableHeaderText, styles.right]}>
            Dr
          </Text>
          <Text style={[styles.colAmt, styles.tableHeaderText, styles.right]}>
            Cr
          </Text>
        </View>

        {lines.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No entries for this period.</Text>
          </View>
        ) : (
          <>
            {lines.map((line) => (
              <View style={styles.tableRow} key={line.id}>
                <Text style={styles.colDate}>{line.date}</Text>
                <View style={styles.particularCell}>
                  <Text style={styles.particularText}>{line.particular}</Text>
                  {line.narration ? (
                    <Text style={styles.narrationText} numberOfLines={2}>
                      {line.narration}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.colAmt, styles.right]}>
                  {line.dr ? line.dr.toLocaleString() : ''}
                </Text>
                <Text style={[styles.colAmt, styles.right]}>
                  {line.cr ? line.cr.toLocaleString() : ''}
                </Text>
              </View>
            ))}

            <View className="total-line" style={styles.totalLine} />
            <View style={styles.tableRow}>
              <Text style={[styles.colDate, styles.totalLabel]}>Total</Text>
              <Text style={styles.colParticular} />
              <Text style={[styles.colAmt, styles.right, styles.totalAmount]}>
                {totals.dr.toLocaleString()}
              </Text>
              <Text style={[styles.colAmt, styles.right, styles.totalAmount]}>
                {totals.cr.toLocaleString()}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

function renderModeChip(
  value: PeriodMode,
  label: string,
  current: PeriodMode,
  onChange: (m: PeriodMode) => void,
) {
  const selected = current === value;
  return (
    <TouchableOpacity
      key={value}
      style={[styles.modeChip, selected && styles.modeChipSelected]}
      onPress={() => onChange(value)}
      activeOpacity={0.7}
    >
      <Text
        style={[styles.modeChipText, selected && styles.modeChipTextSelected]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

type LedgerLine = {
  id: string;
  date: string;
  particular: string;
  dr: number;
  cr: number;
  narration?: string;
};

function buildLedgerHtml(
  ledger: Ledger,
  lines: LedgerLine[],
  totals: { dr: number; cr: number },
  balanceLabel: string,
  periodLabel: string,
): string {
  const rowsHtml = lines
    .map(
      (line) => `
      <tr>
        <td>${line.date}</td>
        <td>
          <div>${line.particular}</div>
          ${
            line.narration
              ? `<div style="font-size:11px;color:#666;">${line.narration}</div>`
              : ''
          }
        </td>
        <td style="text-align:right;">${
          line.dr ? line.dr.toLocaleString() : ''
        }</td>
        <td style="text-align:right;">${
          line.cr ? line.cr.toLocaleString() : ''
        }</td>
      </tr>
    `,
    )
    .join('\n');

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Ledger - ${ledger.name}</title>
    </head>
    <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 16px; color: #121212;">
      <h2 style="margin: 0 0 4px 0;">${ledger.name}</h2>
      <div style="font-size:12px;color:#555;margin-bottom:4px;">
        ${ledger.groupName} ・ ${ledger.nature}${
          ledger.isParty ? ' ・ Party' : ''
        }
      </div>
      <div style="font-size:12px;color:#555;margin-bottom:12px;">
        Period: ${periodLabel}
      </div>

      <div style="margin-bottom:12px;font-size:13px;">
        <div>Total Dr: <strong>¥${totals.dr.toLocaleString()}</strong></div>
        <div>Total Cr: <strong>¥${totals.cr.toLocaleString()}</strong></div>
        <div>Balance: <strong>${balanceLabel}</strong></div>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr>
            <th style="border-bottom:1px solid #ccc;text-align:left;padding:4px 2px;">Date</th>
            <th style="border-bottom:1px solid #ccc;text-align:left;padding:4px 2px;">Particular</th>
            <th style="border-bottom:1px solid #ccc;text-align:right;padding:4px 2px;">Dr</th>
            <th style="border-bottom:1px solid #ccc;text-align:right;padding:4px 2px;">Cr</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr>
            <td style="border-top:1px solid #ccc;padding-top:4px;font-weight:bold;">Total</td>
            <td style="border-top:1px solid #ccc;"></td>
            <td style="border-top:1px solid #ccc;text-align:right;font-weight:bold;">
              ${totals.dr.toLocaleString()}
            </td>
            <td style="border-top:1px solid #ccc;text-align:right;font-weight:bold;">
              ${totals.cr.toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>
    </body>
  </html>
  `;
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
  notFound: {
    padding: 16,
    fontSize: 14,
    color: COLORS.dark,
  },
  headerBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fdf7fb',
  },
  ledgerName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  ledgerGroup: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },
  ledgerNature: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.muted,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

  controlsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  periodBox: {
    flex: 3,
    marginRight: 8,
  },
  controlsLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 4,
  },
  periodChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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
    fontSize: 12,
    color: COLORS.dark,
  },
  modeChipTextSelected: {
    color: COLORS.lightBg,
    fontWeight: '600',
  },
  customRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  customField: {
    flex: 1,
  },
  customLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 2,
  },
  customInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    color: COLORS.dark,
    backgroundColor: '#fafafa',
  },

  exportBox: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  exportButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.dark,
  },
  exportText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.lightBg,
  },

  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  colDate: {
    flex: 1.1,
    fontSize: 12,
    color: COLORS.dark,
  },
  colParticular: {
    flex: 2.4,
    fontSize: 12,
    color: COLORS.dark,
  },
  colAmt: {
    flex: 1,
    fontSize: 12,
    color: COLORS.dark,
  },
  tableHeaderText: {
    fontWeight: '600',
  },
  right: {
    textAlign: 'right',
  },
  particularCell: {
    flex: 2.4,
  },
  particularText: {
    fontSize: 12,
    color: COLORS.dark,
  },
  narrationText: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  totalLine: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: 4,
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.dark,
  },
  totalAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyBox: {
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.muted,
  },
});
