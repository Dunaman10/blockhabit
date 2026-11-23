export type TransactionType = "buy" | "sell";

export interface HabitTransaction {
  id: string;               // UUID unik transaksi
  type?: TransactionType;   // Tipe transaksi: "buy" (default) atau "sell" (jual/withdraw)
  date: string;             // Format ISO: "2026-10-14T05:36:00.000Z"
  amountIdr: number;        // Nominal uang beli atau nilai jual kotor (contoh: 9990 atau 500000)
  netValueIdr?: number;     // Nilai bersih setelah biaya/pembulatan (contoh: 9988 atau dana cair bersih)
  btcPriceAtBuy: number;    // Harga eksekusi 1 BTC dalam IDR saat beli/jual (contoh: 1493000000)
  btcAmount: number;        // Jumlah BTC dibeli atau dijual (selalu positif, contoh: 0.00000668)
  satsAmount: number;       // Jumlah Satoshi bulat (selalu positif, contoh: 668)
  note?: string;            // Catatan/alasan opsional (contoh: "Order Market FLOQ" / "Kebutuhan Mendesak")
}

export interface StreakMetadata {
  currentStreak: number;    // Jumlah hari berturut-turut saat ini
  longestStreak: number;    // Rekor streak terpanjang
  lastLoggedDate: string;   // Tanggal terakhir input ("YYYY-MM-DD")
  streakFreezesAvailable: number; // Kuota pelindung streak
}

export interface FloqSyncConfig {
  priceSpreadPercent: number;  // Rasio penyesuaian harga FLOQ vs harga live Indodax (%)
  cashBalanceIdr?: number;     // Opsional: sisa saldo tunai IDR mengendap di wallet FLOQ
  lastSyncedAt?: string;       // ISO timestamp terakhir kali disamakan dengan FLOQ
  lockedCalibration?: boolean; // Kunci kalibrasi agar tidak tertimpa auto-sync harga historis saat reload
}

export interface BlockHabitStorage {
  profile: {
    startDate: string;
    targetHorizonYears: 3 | 5;
    dailyFloorIdr: number;  // Default: 10000
    exchangeName: string;   // Default: "FLOQ"
    hideBalanceOnShare: boolean;
    floqSync?: FloqSyncConfig;
  };
  streak: StreakMetadata;
  transactions: HabitTransaction[];
  lastBackupDate: string | null;
}

export interface MarketTicker {
  priceIdr: number;
  buyPriceIdr?: number;     // Bid / harga jual instan di pasar
  sellPriceIdr?: number;    // Ask / harga beli instan di pasar
  change24h: number;
  high24h: number;
  low24h: number;
  lastUpdated: string;
  source: string;
}

export interface HalvingData {
  currentBlock: number;
  targetBlock: number;
  remainingBlocks: number;
  estimatedDate: string;
  daysRemaining: number;
  progressPercent: number;
  cyclePhase: "Akumulasi" | "Pre-Halving" | "Bull Run Take Profit";
}

export interface AnalyticsSummary {
  totalCapitalDeployed: number;   // Modal aktif tersisa (cost basis BTC yang masih dipegang)
  totalBoughtIdr: number;         // Total kumulatif modal yang pernah disetor (semua transaksi beli)
  totalWithdrawnIdr: number;      // Total dana Rupiah yang sudah ditarik dari penjualan
  totalSoldBtc: number;           // Total BTC yang pernah dijual
  totalSoldSats: number;          // Total Satoshi yang pernah dijual
  realizedPnlIdr: number;         // Untung/Rugi terealisasi dari penjualan
  netCashFlowIdr: number;         // Selisih modal keluar - dana ditarik
  averageHabitTicket: number;
  minTicket: number;
  maxTicket: number;
  thisMonthTotal: number;
  totalBtc: number;               // Saldo BTC tersisa saat ini
  totalSats: number;              // Saldo Satoshi tersisa saat ini
  averageBuyPrice: number;        // Rata-rata harga beli BTC yang tersisa
  currentPortfolioValue: number;  // Nilai aset BTC saat ini dalam IDR
  cashBalanceIdr: number;         // Saldo tunai IDR mengendap di exchange (jika diisi)
  totalAssetValue: number;        // Total Aset = nilai BTC + saldo tunai IDR
  floatingPnlIdr: number;
  floatingPnlPercent: number;
  transactionCount: number;       // Total seluruh transaksi (beli + jual)
  buyCount: number;               // Jumlah transaksi beli
  sellCount: number;              // Jumlah transaksi jual/withdraw
}
