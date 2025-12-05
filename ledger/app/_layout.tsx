// app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { DataProvider } from '../src/context/AppDataContext';
import { SettingsProvider } from '../src/context/SettingsContext';

export default function RootLayout() {
  return (
    <SettingsProvider>
      <DataProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="entry/[id]" options={{ title: 'Entry Details' }} />
          <Stack.Screen name="ledger/[id]" options={{ title: 'Ledger' }} />
        </Stack>
      </DataProvider>
    </SettingsProvider>
  );
}
