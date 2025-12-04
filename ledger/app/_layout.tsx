// app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { DataProvider } from '../src/context/AppDataContext';

export default function RootLayout() {
  return (
    <DataProvider>
      <Stack
        screenOptions={{
          headerShown: false, // tabs screen handle header, detail screens set their own
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Other screens (entry/[id], entry/new, ledger/[id]) will auto-register */}
      </Stack>
    </DataProvider>
  );
}
