import { BlockHabitStorage } from "@/types";

export const STORAGE_KEY = "blockhabit_data_v1";

export const QUICK_NOMINALS = [9990, 10000, 15000, 20000, 30000, 50000];

export const HALVING_TARGET_BLOCK = 1050000;
export const HALVING_PREVIOUS_BLOCK = 840000; // Halving ke-4 (April 2024)

export const DEFAULT_BTC_PRICE_IDR = 1495000000; // ~Rp 1,495 Milyar

export const INITIAL_STORAGE: BlockHabitStorage = {
  profile: {
    startDate: "2026-10-01T00:00:00.000Z",
    targetHorizonYears: 3,
    dailyFloorIdr: 10000,
    exchangeName: "FLOQ",
    hideBalanceOnShare: false,
  },
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastLoggedDate: "",
    streakFreezesAvailable: 0,
  },
  transactions: [],
  lastBackupDate: null,
};
