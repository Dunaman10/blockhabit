import { z } from "zod";
import { BlockHabitStorage, HabitTransaction } from "@/types";
import { STORAGE_KEY, INITIAL_STORAGE } from "./constants";
import { recalculateStreak } from "./calculations";

// Zod Schema Validation
export const HabitTransactionSchema = z.object({
  id: z.string(),
  date: z.string(),
  amountIdr: z.number().nonnegative(),
  netValueIdr: z.number().optional(),
  btcPriceAtBuy: z.number().positive(),
  btcAmount: z.number().nonnegative(),
  satsAmount: z.number().nonnegative(),
  note: z.string().optional(),
});

export const StreakMetadataSchema = z.object({
  currentStreak: z.number().nonnegative(),
  longestStreak: z.number().nonnegative(),
  lastLoggedDate: z.string(),
  streakFreezesAvailable: z.number().nonnegative(),
});

export const BlockHabitStorageSchema = z.object({
  profile: z.object({
    startDate: z.string(),
    targetHorizonYears: z.union([z.literal(3), z.literal(5)]),
    dailyFloorIdr: z.number().nonnegative(),
    exchangeName: z.string(),
    hideBalanceOnShare: z.boolean(),
  }),
  streak: StreakMetadataSchema,
  transactions: z.array(HabitTransactionSchema),
  lastBackupDate: z.string().nullable(),
});

/**
 * Muat data murni dari localStorage dengan validasi Zod (mulai dari 0 jika belum ada data)
 */
export function loadStorageFromBrowser(): BlockHabitStorage {
  if (typeof window === "undefined") {
    return INITIAL_STORAGE;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const freshData: BlockHabitStorage = {
        ...INITIAL_STORAGE,
        profile: {
          ...INITIAL_STORAGE.profile,
          startDate: new Date().toISOString(),
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(freshData));
      return freshData;
    }

    const parsed = JSON.parse(raw);
    const validated = BlockHabitStorageSchema.safeParse(parsed);

    if (validated.success) {
      // Bersihkan otomatis jika masih ada sisa transaksi dummy lama ("demo-tx-*")
      const hasLegacyDemo = validated.data.transactions.some((tx) =>
        tx.id.startsWith("demo-tx-")
      );
      if (hasLegacyDemo) {
        const realTransactions = validated.data.transactions.filter(
          (tx) => !tx.id.startsWith("demo-tx-")
        );
        const recalculated = recalculateStreak(realTransactions, 0, new Date());
        const cleanedData: BlockHabitStorage = {
          ...validated.data,
          transactions: realTransactions,
          streak: recalculated,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedData));
        return cleanedData;
      }

      return validated.data;
    } else {
      console.warn(
        "Storage schema validation warning, falling back to initial data:",
        validated.error
      );
      return INITIAL_STORAGE;
    }
  } catch (err) {
    console.error("Gagal membaca localStorage:", err);
    return INITIAL_STORAGE;
  }
}

/**
 * Simpan data ke localStorage
 */
export function saveStorageToBrowser(data: BlockHabitStorage): boolean {
  if (typeof window === "undefined") return false;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error("Gagal menyimpan ke localStorage:", err);
    return false;
  }
}

/**
 * Unduh cadangan file JSON
 */
export function exportToJsonFile(data: BlockHabitStorage) {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(data, null, 2)
  )}`;
  const downloadAnchor = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  downloadAnchor.setAttribute("href", jsonString);
  downloadAnchor.setAttribute("download", `blockhabit-backup-${timestamp}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Unduh cadangan file CSV untuk Excel / Sheets
 */
export function exportToCsvFile(transactions: HabitTransaction[]) {
  const headers = [
    "ID",
    "Tanggal (ISO)",
    "Nominal Beli (IDR)",
    "Nilai Bersih (IDR)",
    "Harga BTC Beli (IDR)",
    "Jumlah BTC",
    "Jumlah Sats",
    "Catatan",
  ];

  const rows = transactions.map((tx) => [
    `"${tx.id}"`,
    `"${tx.date}"`,
    tx.amountIdr,
    tx.netValueIdr ?? tx.amountIdr,
    tx.btcPriceAtBuy,
    tx.btcAmount.toFixed(8),
    tx.satsAmount,
    `"${(tx.note || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", `blockhabit-transactions-${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Validasi dan impor file JSON hasil unggahan pengguna
 */
export async function parseUploadedJsonFile(file: File): Promise<BlockHabitStorage> {
  const text = await file.text();
  const parsed = JSON.parse(text);

  // Jika file hanya berisi array transaksi
  if (Array.isArray(parsed)) {
    const validatedTx = z.array(HabitTransactionSchema).parse(parsed);
    const updatedStreak = recalculateStreak(validatedTx, 0, new Date());
    return {
      ...INITIAL_STORAGE,
      transactions: validatedTx,
      streak: updatedStreak,
      lastBackupDate: new Date().toISOString(),
    };
  }

  // Jika file adalah full backup BlockHabitStorage
  const validated = BlockHabitStorageSchema.parse(parsed);
  return {
    ...validated,
    lastBackupDate: new Date().toISOString(),
  };
}
