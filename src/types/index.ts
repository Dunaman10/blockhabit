export interface HabitTransaction {
  id: string;               // UUID unik transaksi
  date: string;             // Format ISO: "2026-10-14T05:36:00.000Z"
  amountIdr: number;        // Nominal uang yang dikeluarkan (contoh: 9990 atau 20000)
  netValueIdr?: number;     // Nilai bersih diterima setelah pembulatan (contoh: 9988)
  btcPriceAtBuy: number;    // Harga 1 BTC dalam IDR saat beli (contoh: 1493000000)
  btcAmount: number;        // Jumlah BTC didapat (contoh: 0.00000668)
  satsAmount: number;       // Jumlah Satoshi bulat (contoh: 668)
  note?: string;            // Catatan opsional (contoh: "Order Market FLOQ")
}

export interface StreakMetadata {
  currentStreak: number;    // Jumlah hari berturut-turut saat ini
  longestStreak: number;    // Rekor streak terpanjang
  lastLoggedDate: string;   // Tanggal terakhir input ("YYYY-MM-DD")
  streakFreezesAvailable: number; // Kuota pelindung streak
}

export interface BlockHabitStorage {
  profile: {
    startDate: string;
    targetHorizonYears: 3 | 5;
    dailyFloorIdr: number;  // Default: 10000
    exchangeName: string;   // Default: "FLOQ"
    hideBalanceOnShare: boolean;
  };
  streak: StreakMetadata;
  transactions: HabitTransaction[];
  lastBackupDate: string | null;
}

export interface MarketTicker {
  priceIdr: number;
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
  totalCapitalDeployed: number;
  averageHabitTicket: number;
  minTicket: number;
  maxTicket: number;
  thisMonthTotal: number;
  totalBtc: number;
  totalSats: number;
  averageBuyPrice: number;
  currentPortfolioValue: number;
  floatingPnlIdr: number;
  floatingPnlPercent: number;
  transactionCount: number;
}
