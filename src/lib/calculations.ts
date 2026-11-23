import { HabitTransaction, StreakMetadata, AnalyticsSummary, FloqSyncConfig } from "@/types";

/**
 * Hitung harga efektif BTC/IDR dengan memperhitungkan selisih rasio/spread FLOQ vs pasar live
 */
export function getEffectiveBtcPrice(
  marketPriceIdr: number,
  floqSync?: FloqSyncConfig
): number {
  if (!marketPriceIdr || marketPriceIdr <= 0) return 0;
  const spreadPct = floqSync?.priceSpreadPercent ?? 0;
  if (!spreadPct || isNaN(spreadPct)) return marketPriceIdr;
  const adjusted = marketPriceIdr * (1 + spreadPct / 100);
  return adjusted > 0 ? adjusted : marketPriceIdr;
}

/**
 * Distribusikan saldo BTC target secara eksak dalam satuan Satoshi (integer) ke transaksi beli
 * menggunakan Largest Remainder Method sehingga tidak ada selisih pembulatan 1 satoshi pun.
 */
export function calibrateTransactionsToExactBtc(
  transactions: HabitTransaction[],
  targetTotalBtc: number
): HabitTransaction[] {
  const buyIndices: number[] = [];
  let totalBuyCapital = 0;
  let totalSoldSats = 0;

  transactions.forEach((tx, idx) => {
    if (isSellTransaction(tx)) {
      totalSoldSats +=
        Number(tx.satsAmount) || Math.round((Number(tx.btcAmount) || 0) * 100_000_000);
    } else {
      buyIndices.push(idx);
      totalBuyCapital += Number(tx.amountIdr) || 0;
    }
  });

  if (buyIndices.length === 0 || targetTotalBtc < 0 || totalBuyCapital <= 0) {
    return transactions;
  }

  const targetHeldSats = Math.round(targetTotalBtc * 100_000_000);
  const neededBoughtSats = targetHeldSats + totalSoldSats;
  if (neededBoughtSats <= 0) return transactions;

  const neededBoughtBtc = neededBoughtSats / 100_000_000;
  const impliedAvgPrice = Math.round(totalBuyCapital / neededBoughtBtc);

  // Alokasi satoshi bulat (floor) + simpan sisa desimal untuk metode Largest Remainder
  const allocations = buyIndices.map((txIdx) => {
    const weight = (Number(transactions[txIdx].amountIdr) || 0) / totalBuyCapital;
    const exactSats = neededBoughtSats * weight;
    const floorSats = Math.floor(exactSats);
    return {
      txIdx,
      sats: floorSats,
      fraction: exactSats - floorSats,
    };
  });

  const allocatedSum = allocations.reduce((acc, item) => acc + item.sats, 0);
  let remainder = neededBoughtSats - allocatedSum;

  // Bagikan sisa satoshi ke transaksi dengan pecahan terbesar agar total = neededBoughtSats PERSIS
  const sortedByFraction = [...allocations].sort((a, b) => b.fraction - a.fraction);
  for (let i = 0; i < sortedByFraction.length && remainder > 0; i++) {
    sortedByFraction[i].sats += 1;
    remainder -= 1;
  }

  const satsByTxIdx = new Map<number, number>();
  allocations.forEach((item) => {
    satsByTxIdx.set(item.txIdx, item.sats);
  });

  return transactions.map((tx, idx) => {
    if (isSellTransaction(tx)) return tx;
    const exactSats = satsByTxIdx.get(idx) ?? tx.satsAmount;
    return {
      ...tx,
      btcPriceAtBuy: impliedAvgPrice,
      satsAmount: exactSats,
      btcAmount: Number((exactSats / 100_000_000).toFixed(8)),
    };
  });
}

/**
 * Cek apakah transaksi merupakan penjualan / withdraw
 */
export function isSellTransaction(tx: HabitTransaction): boolean {
  return tx.type === "sell";
}

/**
 * Format angka ke mata uang Rupiah (contoh: Rp10.000)
 */
export function formatIdr(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "Rp0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format angka Satoshi dengan pemisah ribuan (contoh: 1.250 sats)
 */
export function formatSats(sats: number): string {
  if (isNaN(sats)) return "0 sats";
  return new Intl.NumberFormat("id-ID").format(Math.round(sats)) + " sats";
}

/**
 * Format jumlah Bitcoin hingga 8 digit desimal
 */
export function formatBtc(btc: number): string {
  if (isNaN(btc)) return "0.00000000 BTC";
  return btc.toFixed(8) + " BTC";
}

/**
 * Format persentase dengan tanda + atau -
 */
export function formatPercent(percent: number): string {
  if (isNaN(percent)) return "0.00%";
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}

/**
 * Format tanggal Indonesia ringkas
 */
export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

/**
 * Format tanggal dan jam Indonesia
 */
export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

/**
 * Ambil tanggal string lokal format YYYY-MM-DD
 */
export function getLocalDateString(dateInput: Date | string = new Date()): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Kalkulasi Daily Streak & Streak Freeze berdasarkan riwayat transaksi
 */
export function recalculateStreak(
  transactions: HabitTransaction[],
  currentFreezes: number = 0,
  referenceDate: Date = new Date("2026-10-28T00:00:00.000Z")
): StreakMetadata {
  const buyTransactions = (transactions || []).filter((tx) => !isSellTransaction(tx));

  if (buyTransactions.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastLoggedDate: "",
      streakFreezesAvailable: 0,
    };
  }

  // 1. Kumpulkan seluruh tanggal unik di mana ada transaksi BELI (DCA)
  const loggedDateSet = new Set<string>();
  buyTransactions.forEach((tx) => {
    if (tx.date) {
      loggedDateSet.add(getLocalDateString(tx.date));
    }
  });

  const sortedDates = Array.from(loggedDateSet).sort();
  const lastLoggedDate = sortedDates[sortedDates.length - 1];

  const todayStr = getLocalDateString(referenceDate);
  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  // 2. Hitung streak berjalan mundur dari hari ini atau kemarin
  let currentStreak = 0;
  let checkDate = new Date(referenceDate);
  let availableFreezes = currentFreezes;
  let freezeUsedCount = 0;

  // Jika hari ini belum log tapi kemarin log, mulai dari kemarin
  const todayLogged = loggedDateSet.has(todayStr);
  const yesterdayLogged = loggedDateSet.has(yesterdayStr);

  if (!todayLogged && !yesterdayLogged) {
    // Cek apakah freeze bisa melindungi selisih 1 hari
    const twoDaysAgo = new Date(referenceDate);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = getLocalDateString(twoDaysAgo);
    
    if (loggedDateSet.has(twoDaysAgoStr) && availableFreezes > 0) {
      // Freeze melindungi kemarin!
      availableFreezes -= 1;
      freezeUsedCount += 1;
      checkDate = twoDaysAgo;
    } else {
      // Streak terputus
      currentStreak = 0;
    }
  }

  if (todayLogged || yesterdayLogged || freezeUsedCount > 0) {
    let cursor = new Date(todayLogged ? todayStr : yesterdayStr);
    while (true) {
      const cursorStr = getLocalDateString(cursor);
      if (loggedDateSet.has(cursorStr)) {
        currentStreak++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (availableFreezes > 0) {
        // Gunakan freeze untuk menambal 1 hari bolong
        availableFreezes--;
        freezeUsedCount++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // 3. Hitung rekor streak terpanjang (longest streak) sepanjang sejarah
  let longestStreak = 0;
  let runningStreak = 0;
  if (sortedDates.length > 0) {
    runningStreak = 1;
    longestStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        runningStreak++;
      } else {
        runningStreak = 1;
      }
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  // Bonus: Setiap 7 hari streak yang dicapai menghasilkan kuota freeze (maks 3)
  const earnedBonusFreezes = Math.floor(currentStreak / 7);
  const totalFreezes = Math.min(3, Math.max(availableFreezes, earnedBonusFreezes));

  return {
    currentStreak,
    longestStreak,
    lastLoggedDate,
    streakFreezesAvailable: totalFreezes,
  };
}

/**
 * Urutkan transaksi secara kronologis (lama -> baru).
 * Jika waktunya persis sama, transaksi beli diproses sebelum jual.
 */
export function sortTransactionsChronologically(
  transactions: HabitTransaction[]
): HabitTransaction[] {
  return [...transactions].sort((a, b) => {
    const timeDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (timeDiff !== 0) return timeDiff;
    const aSell = isSellTransaction(a) ? 1 : 0;
    const bSell = isSellTransaction(b) ? 1 : 0;
    return aSell - bSell;
  });
}

/**
 * Hitung seluruh metrik analytics ringkasan modal aktif, withdraw, rata-rata, sats, dan PnL (floating & realized)
 * Menggunakan metode Weighted Average Cost Basis secara kronologis.
 */
export function calculateAnalytics(
  transactions: HabitTransaction[],
  currentBtcPrice: number,
  referenceDate: Date = new Date("2026-10-28T00:00:00.000Z"),
  cashBalanceIdr: number = 0
): AnalyticsSummary {
  const safeCashIdr = Math.max(0, Math.round(Number(cashBalanceIdr) || 0));

  if (!transactions || transactions.length === 0) {
    return {
      totalCapitalDeployed: 0,
      totalBoughtIdr: 0,
      totalWithdrawnIdr: 0,
      totalSoldBtc: 0,
      totalSoldSats: 0,
      realizedPnlIdr: 0,
      netCashFlowIdr: 0,
      averageHabitTicket: 0,
      minTicket: 0,
      maxTicket: 0,
      thisMonthTotal: 0,
      totalBtc: 0,
      totalSats: 0,
      averageBuyPrice: 0,
      currentPortfolioValue: 0,
      cashBalanceIdr: safeCashIdr,
      totalAssetValue: safeCashIdr,
      floatingPnlIdr: 0,
      floatingPnlPercent: 0,
      transactionCount: 0,
      buyCount: 0,
      sellCount: 0,
    };
  }

  const now = referenceDate;
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const chronological = sortTransactionsChronologically(transactions);

  let totalBoughtIdr = 0;
  let totalWithdrawnIdr = 0;
  let totalSoldSats = 0;
  let realizedPnlIdr = 0;

  let remainingCostBasisIdr = 0;
  let heldSats = 0;

  let minTicket = Infinity;
  let maxTicket = -Infinity;
  let thisMonthTotal = 0;
  let buyCount = 0;
  let sellCount = 0;

  chronological.forEach((tx) => {
    const amount = Number(tx.amountIdr) || 0;
    const btc = Number(tx.btcAmount) || 0;
    const sats =
      tx.satsAmount !== undefined && tx.satsAmount !== null
        ? Math.round(Number(tx.satsAmount))
        : Math.round(btc * 100_000_000);

    if (isSellTransaction(tx)) {
      sellCount += 1;
      const proceedsIdr =
        tx.netValueIdr !== undefined && tx.netValueIdr > 0 ? Number(tx.netValueIdr) : amount;

      totalWithdrawnIdr += proceedsIdr;
      totalSoldSats += sats;

      // Hitung porsi cost basis yang dijual (Weighted Average Cost berbasis satoshi eksak)
      const sellRatio = heldSats > 0 ? Math.min(1, sats / heldSats) : 0;
      const costOfSoldIdr = remainingCostBasisIdr * sellRatio;
      realizedPnlIdr += proceedsIdr - costOfSoldIdr;

      remainingCostBasisIdr = Math.max(0, remainingCostBasisIdr - costOfSoldIdr);
      heldSats = Math.max(0, heldSats - sats);

      // Bersihkan sisa cost basis jika saldo habis terjual
      if (heldSats <= 0) {
        heldSats = 0;
        remainingCostBasisIdr = 0;
      }
    } else {
      buyCount += 1;
      totalBoughtIdr += amount;
      remainingCostBasisIdr += amount;
      heldSats += sats;

      if (amount < minTicket) minTicket = amount;
      if (amount > maxTicket) maxTicket = amount;

      // Hitung akumulasi pembelian bulan ini
      try {
        const txDate = new Date(tx.date);
        if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
          thisMonthTotal += amount;
        }
      } catch {
        // abaikan tanggal tidak valid
      }
    }
  });

  const heldBtc = Number((heldSats / 100_000_000).toFixed(8));
  const totalSoldBtc = Number((totalSoldSats / 100_000_000).toFixed(8));
  const totalCapitalDeployed = Math.round(remainingCostBasisIdr);
  const transactionCount = transactions.length;
  const averageHabitTicket = buyCount > 0 ? Math.round(totalBoughtIdr / buyCount) : 0;
  const averageBuyPrice = heldBtc > 0 ? Math.round(remainingCostBasisIdr / heldBtc) : 0;

  const currentPortfolioValue = Math.round(heldBtc * currentBtcPrice);
  const totalAssetValue = currentPortfolioValue + safeCashIdr;
  const floatingPnlIdr = heldSats > 0 ? currentPortfolioValue - totalCapitalDeployed : 0;
  const floatingPnlPercent =
    totalCapitalDeployed > 0
      ? ((currentPortfolioValue - totalCapitalDeployed) / totalCapitalDeployed) * 100
      : 0;

  return {
    totalCapitalDeployed,
    totalBoughtIdr: Math.round(totalBoughtIdr),
    totalWithdrawnIdr: Math.round(totalWithdrawnIdr),
    totalSoldBtc,
    totalSoldSats: Math.round(totalSoldSats),
    realizedPnlIdr: Math.round(realizedPnlIdr),
    netCashFlowIdr: Math.round(totalBoughtIdr - totalWithdrawnIdr),
    averageHabitTicket,
    minTicket: minTicket === Infinity ? 0 : minTicket,
    maxTicket: maxTicket === -Infinity ? 0 : maxTicket,
    thisMonthTotal,
    totalBtc: heldBtc,
    totalSats: Math.round(heldSats),
    averageBuyPrice,
    currentPortfolioValue,
    cashBalanceIdr: safeCashIdr,
    totalAssetValue,
    floatingPnlIdr,
    floatingPnlPercent,
    transactionCount,
    buyCount,
    sellCount,
  };
}

/**
 * Bangun data seri kronologis grafik modal aktif vs nilai portofolio
 */
export function buildPortfolioChartSeries(
  transactions: HabitTransaction[],
  currentBtcPrice: number
) {
  if (!transactions || transactions.length === 0) return [];

  const sorted = sortTransactionsChronologically(transactions);

  let remainingCostBasisIdr = 0;
  let heldBtc = 0;

  return sorted.map((tx) => {
    const amount = Number(tx.amountIdr) || 0;
    const btc = Number(tx.btcAmount) || 0;

    if (isSellTransaction(tx)) {
      const sellRatio = heldBtc > 0 ? Math.min(1, btc / heldBtc) : 0;
      remainingCostBasisIdr = Math.max(0, remainingCostBasisIdr * (1 - sellRatio));
      heldBtc = Math.max(0, heldBtc - btc);
      if (heldBtc < 1e-10) {
        heldBtc = 0;
        remainingCostBasisIdr = 0;
      }
    } else {
      remainingCostBasisIdr += amount;
      heldBtc += btc;
    }

    const portfolioValue = Math.round(heldBtc * currentBtcPrice);

    return {
      dateStr: formatDate(tx.date),
      modalDisetor: Math.round(remainingCostBasisIdr),
      nilaiPortofolio: portfolioValue,
    };
  });
}

/**
 * Hitung proyeksi investasi horizon 3 & 5 tahun dengan Compound Interest (Bulanan)
 * Menggunakan rata-rata habit ticket harian dikali 30 hari.
 */
export function calculateProjections(averageDailyTicket: number) {
  const monthlyContribution = (averageDailyTicket || 10000) * 30;

  // Rate p.a.
  const scenarios = [
    { name: "Deposito / RDPU", rate: 0.0375, color: "#94A3B8" },
    { name: "Konservatif BTC (17% p.a.)", rate: 0.17, color: "#38BDF8" },
    { name: "Moderat BTC (25% p.a.)", rate: 0.25, color: "#10B981" },
    { name: "Agresif BTC (50% p.a.)", rate: 0.50, color: "#F7931A" },
  ];

  const calculateFutureValue = (monthlyDeposit: number, annualRate: number, years: number) => {
    const months = years * 12;
    const monthlyRate = annualRate / 12;
    // FV of Annuity: P * [((1 + r)^n - 1) / r] * (1 + r)
    if (monthlyRate === 0) return monthlyDeposit * months;
    const fv = monthlyDeposit * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    return Math.round(fv);
  };

  const totalCapital3Y = monthlyContribution * 36;
  const totalCapital5Y = monthlyContribution * 60;

  const results3Y = scenarios.map((s) => ({
    ...s,
    futureValue: calculateFutureValue(monthlyContribution, s.rate, 3),
    profit: calculateFutureValue(monthlyContribution, s.rate, 3) - totalCapital3Y,
  }));

  const results5Y = scenarios.map((s) => ({
    ...s,
    futureValue: calculateFutureValue(monthlyContribution, s.rate, 5),
    profit: calculateFutureValue(monthlyContribution, s.rate, 5) - totalCapital5Y,
  }));

  return {
    monthlyContribution,
    totalCapital3Y,
    totalCapital5Y,
    results3Y,
    results5Y,
  };
}
