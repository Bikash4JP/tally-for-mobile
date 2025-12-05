// app/(tabs)/settings.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSettings } from '../../src/context/SettingsContext';

const COLORS = {
  primary: '#ac0c79',
  dark: '#121212',
  lightBg: '#ffffff',
  accent: '#2e9ff5',
  muted: '#777777',
  border: '#e0e0e0',
};

export default function SettingsScreen() {
  const { settings, setLanguage } = useSettings();
  const currentLang = settings.language;

  const renderLangChip = (value: 'en' | 'ja', label: string) => {
    const selected = currentLang === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.langChip, selected && styles.langChipSelected]}
        onPress={() => setLanguage(value)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.langChipText,
            selected && styles.langChipTextSelected,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          App preferences, language, and (later) backup/sync.
        </Text>
      </View>

      {/* Language section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Language</Text>
        <Text style={styles.sectionHint}>
          Choose the language for the app interface.
        </Text>

        <View style={styles.langRow}>
          {renderLangChip('en', 'English')}
          {renderLangChip('ja', '日本語')}
        </View>

        <Text style={styles.currentLangText}>
          Current: {currentLang === 'en' ? 'English' : '日本語'}
        </Text>
        <Text style={styles.infoText}>
          UI text will gradually follow this setting as we add translations.
        </Text>
      </View>

      {/* Data & backup placeholder */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Data & Backup</Text>
        <Text style={styles.sectionHint}>
          Right now all data is stored locally on this device.
        </Text>
        <Text style={styles.infoText}>
          In the future, you can connect cloud sync (PostgreSQL / Firebase, etc.)
          so that ledgers are shared across devices.
        </Text>
      </View>

      {/* About app */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.infoText}>
          Tally-for-Mobile (ledger prototype){'\n'}
          Built with React Native + Expo.{'\n'}
          Double-entry, ledger-wise view, trial balance, P&L and balance sheet
          are already working.
        </Text>
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
    marginBottom: 12,
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

  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    backgroundColor: '#fdf7fb',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 8,
  },

  langRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  langChipText: {
    fontSize: 13,
    color: COLORS.dark,
  },
  langChipTextSelected: {
    color: COLORS.lightBg,
    fontWeight: '600',
  },
  currentLangText: {
    fontSize: 12,
    color: COLORS.dark,
    marginTop: 4,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 6,
    lineHeight: 18,
  },
});
