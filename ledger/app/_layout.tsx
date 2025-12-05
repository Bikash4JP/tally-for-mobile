// app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

import { DataProvider } from '../src/context/AppDataContext';
import { SettingsProvider } from '../src/context/SettingsContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* Make sure content stays below status bar on all screens */}
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#000' }}
        edges={['top', 'left', 'right']}
      >
        {/* Settings must wrap anything that uses useSettings() */}
        <SettingsProvider>
          {/* App-wide data (ledgers, transactions, etc.) */}
          <DataProvider>
            <Stack screenOptions={{ headerShown: false }}>
              {/* Tab group */}
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

              {/* Entry detail */}
              <Stack.Screen
                name="entry/[id]"
                options={{ title: 'Entry Detail' }}
              />

              {/* Ledger detail */}
              <Stack.Screen
                name="ledger/[id]"
                options={{ title: 'Ledger' }}
              />
            </Stack>
          </DataProvider>
        </SettingsProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
