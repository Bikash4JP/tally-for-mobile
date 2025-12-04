// src/data/seedLedgers.ts
import type { Ledger } from '../models/ledger';

export const seedLedgers: Ledger[] = [
  {
    id: 'L1',
    name: 'Cash A/C',
    groupName: 'Cash-in-Hand',
    nature: 'Asset',
    isParty: false,
  },
  {
    id: 'L2',
    name: 'Main Bank A/C',
    groupName: 'Bank Accounts',
    nature: 'Asset',
    isParty: false,
  },
  {
    id: 'L3',
    name: 'Bhuwan Loan A/C',
    groupName: 'Loans & Advances',
    nature: 'Liability',
    isParty: true,
  },
  {
    id: 'L4',
    name: 'Salary Expense A/C',
    groupName: 'Indirect Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L5',
    name: 'Interest Received A/C',
    groupName: 'Indirect Incomes',
    nature: 'Income',
    isParty: false,
  },
];
