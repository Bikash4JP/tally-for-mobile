// app/(tabs)/index.tsx
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useData } from '../../src/context/AppDataContext';

const COLORS = {
  primary: '#ac0c79',
  dark: '#121212',
  lightBg: '#ffffff',
  accent: '#2e9ff5',
  muted: '#777777',
  cardBorder: '#e0e0e0',
};

export default function HomeScreen() {
  const router = useRouter();
  const { ledgers, transactions } = useData();

  const totalLedgers = ledgers.length;
  const totalEntries = transactions.length;
  const totalVolume = useMemo(
    () => transactions.reduce((sum, t) => sum + t.amount, 0),
    [transactions],
  );

  const handleAddEntry = () => {
    router.push('/entry/new' as any);
  };

  const handleGoReports = () => {
    router.push('/(tabs)/reports' as any);
  };

  const handleGoEntries = () => {
    router.push('/(tabs)/entries' as any);
  };

  const handleGoLedgers = () => {
    router.push('/(tabs)/ledgers' as any);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerBox}>
        <Text style={styles.appName}>Budget Ledger</Text>
        <Text style={styles.appTagline}>
          Simple double-entry ledger for mobile.
        </Text>

        <View style={styles.headerButtonsRow}>
          <TouchableOpacity
            style={[styles.headerButton, styles.headerPrimaryButton]}
            onPress={handleAddEntry}
            activeOpacity={0.7}
          >
            <Text style={styles.headerPrimaryText}>＋ Add Entry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, styles.headerSecondaryButton]}
            onPress={handleGoReports}
            activeOpacity={0.7}
          >
            <Text style={styles.headerSecondaryText}>View Reports</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Ledgers</Text>
          <Text style={styles.statValue}>{totalLedgers}</Text>
          <Text style={styles.statHint}>Parties / banks / expenses</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Entries</Text>
          <Text style={styles.statValue}>{totalEntries}</Text>
          <Text style={styles.statHint}>All vouchers recorded</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statWideCard]}>
          <Text style={styles.statLabel}>Total Volume</Text>
          <Text style={styles.statValue}>
            ¥{totalVolume.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </Text>
          <Text style={styles.statHint}>
            Sum of all transaction amounts (Dr/Cr side)
          </Text>
        </View>
      </View>

      {/* Quick links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Navigation</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={handleGoEntries}
            activeOpacity={0.7}
          >
            <Text style={styles.quickTitle}>Entries</Text>
            <Text style={styles.quickText}>Add / review vouchers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={handleGoLedgers}
            activeOpacity={0.7}
          >
            <Text style={styles.quickTitle}>Ledgers</Text>
            <Text style={styles.quickText}>Party / account balances</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickCardWide}
            onPress={handleGoReports}
            activeOpacity={0.7}
          >
            <Text style={styles.quickTitle}>Reports</Text>
            <Text style={styles.quickText}>
              Trial balance and accounting summaries
            </Text>
          </TouchableOpacity>
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
  headerBox: {
    backgroundColor: COLORS.dark,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.lightBg,
  },
  appTagline: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 4,
  },
  headerButtonsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  headerButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  headerPrimaryButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    marginRight: 8,
  },
  headerSecondaryButton: {
    backgroundColor: 'transparent',
    borderColor: COLORS.lightBg,
  },
  headerPrimaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.lightBg,
  },
  headerSecondaryText: {
    fontSize: 13,
    color: COLORS.lightBg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  statWideCard: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  statHint: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  quickCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 12,
    backgroundColor: '#fdf9ff',
  },
  quickCardWide: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 12,
    backgroundColor: '#f3f8ff',
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  quickText: {
    fontSize: 12,
    color: COLORS.muted,
  },
});
