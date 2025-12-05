// src/context/AppDataContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { seedLedgers } from '../data/seedLedgers';
import { seedTransactions } from '../data/seedTransactions';
import type { Ledger } from '../models/ledger';
import type { Transaction, VoucherType } from '../models/transaction';

export type NewTransactionInput = {
  date: string;
  debitLedgerId: string;
  creditLedgerId: string;
  amount: number;
  narration?: string;
  voucherType?: VoucherType;
};

type NewLedgerInput = {
  name: string;
  groupName: string;
  nature: Ledger['nature'];
  isParty?: boolean;
};

type DataContextValue = {
  ledgers: Ledger[];
  transactions: Transaction[];
  addTransaction: (input: NewTransactionInput) => void;
  addLedger: (input: NewLedgerInput) => Ledger;
};

const STORAGE_KEYS = {
  ledgers: '@ledgerapp_ledgers',
  transactions: '@ledgerapp_transactions',
};

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ledgersJson, txJson] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.ledgers),
          AsyncStorage.getItem(STORAGE_KEYS.transactions),
        ]);

        let base: Ledger[] = seedLedgers;

        if (ledgersJson) {
          const stored: Ledger[] = JSON.parse(ledgersJson);

          // 👉 Sirf user-created party ledgers ko preserve karo
          const userParties = stored.filter((l) => l.isParty);

          const merged: Ledger[] = [...base];
          userParties.forEach((p) => {
            const exists = merged.some(
              (l) => l.name.toLowerCase() === p.name.toLowerCase(),
            );
            if (!exists) {
              merged.push(p);
            }
          });

          base = merged;
        }

        setLedgers(base);

        if (txJson) {
          setTransactions(JSON.parse(txJson));
        } else {
          setTransactions(seedTransactions);
        }
      } catch (err) {
        console.warn('Failed to load data from storage', err);
        setLedgers(seedLedgers);
        setTransactions(seedTransactions);
      } finally {
        setIsHydrated(true);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const saveData = async () => {
      try {
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.ledgers, JSON.stringify(ledgers)),
          AsyncStorage.setItem(
            STORAGE_KEYS.transactions,
            JSON.stringify(transactions),
          ),
        ]);
      } catch (err) {
        console.warn('Failed to save data to storage', err);
      }
    };
    saveData();
  }, [ledgers, transactions, isHydrated]);

  const addTransaction = (input: NewTransactionInput) => {
    setTransactions((prev) => {
      const newId = `t${prev.length + 1}`;
      const tx: Transaction = {
        id: newId,
        voucherType: input.voucherType ?? 'Journal',
        date: input.date,
        debitLedgerId: input.debitLedgerId,
        creditLedgerId: input.creditLedgerId,
        amount: input.amount,
        narration: input.narration,
      };
      return [...prev, tx];
    });
  };

  const addLedger = (input: NewLedgerInput): Ledger => {
    const newLedger: Ledger = {
      id: `L${Date.now()}`,
      name: input.name,
      groupName: input.groupName,
      nature: input.nature,
      isParty: input.isParty ?? true,
    };
    setLedgers((prev) => [...prev, newLedger]);
    return newLedger;
  };

  if (!isHydrated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#121212',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: '#ffffff', marginTop: 8 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <DataContext.Provider
      value={{ ledgers, transactions, addTransaction, addLedger }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
