// app/entry/[id].tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useData } from '../../src/context/AppDataContext';

const COLORS = {
  primary: '#ac0c79',
  dark: '#121212',
  lightBg: '#ffffff',
  muted: '#777777',
  border: '#e0e0e0',
};

export default function EntryDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { transactions, ledgers } = useData();

  const entry = transactions.find((t) => t.id === params.id);

  const detail = useMemo(() => {
    if (!entry) return null;
    const debitLedger = ledgers.find((l) => l.id === entry.debitLedgerId);
    const creditLedger = ledgers.find((l) => l.id === entry.creditLedgerId);

    return {
      ...entry,
      debitName: debitLedger?.name ?? entry.debitLedgerId,
      creditName: creditLedger?.name ?? entry.creditLedgerId,
    };
  }, [entry, ledgers]);

  if (!detail) {
    return (
      <>
        <Stack.Screen options={{ title: 'Entry' }} />
        <View style={styles.container}>
          <Text style={styles.notFound}>Entry not found.</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Entry Detail' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{detail.date}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Debit (Dr)</Text>
            <Text style={styles.value}>{detail.debitName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Credit (Cr)</Text>
            <Text style={styles.value}>{detail.creditName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>
              ¥{detail.amount.toLocaleString(undefined, {
                minimumFractionDigits: 0,
              })}
            </Text>
          </View>
          {detail.narration ? (
            <View style={styles.rowColumn}>
              <Text style={styles.label}>Narration</Text>
              <Text style={styles.value}>{detail.narration}</Text>
            </View>
          ) : null}
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
  content: {
    padding: 16,
  },
  notFound: {
    padding: 16,
    fontSize: 14,
    color: COLORS.dark,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    backgroundColor: '#fafafa',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowColumn: {
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    color: COLORS.muted,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
});
