// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#222222',
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#aaaaaa',
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      {/* Tabs order: Entries | Ledgers | Home | Reports */}
      <Tabs.Screen
        name="entries"
        options={{
          title: 'Entries',
        }}
      />
      <Tabs.Screen
        name="ledgers"
        options={{
          title: 'Ledgers',
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
        }}
      />
    </Tabs>
  );
}
