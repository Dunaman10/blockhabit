import { HabitTransaction, StreakMetadata, AnalyticsSummary } from "@/types";

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
  if (!transactions || transactions.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastLoggedDate: "",
      streakFreezesAvailable: 0,
    };
  }

  // 1. Kumpulkan seluruh tanggal unik di mana ada transaksi
  const loggedDateSet = new Set<string>();
  transactions.forEach((tx) => {
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
 * Hitung seluruh metrik analytics ringkasan modal, rata-rata, sats, dan PnL
 */
export function calculateAnalytics(
  transactions: HabitTransaction[],
  currentBtcPrice: number,
  referenceDate: Date = new Date("2026-10-28T00:00:00.000Z")
): AnalyticsSummary {
  if (!transactions || transactions.length === 0) {
    return {
      totalCapitalDeployed: 0,
      averageHabitTicket: 0,
      minTicket: 0,
      maxTicket: 0,
      thisMonthTotal: 0,
      totalBtc: 0,
      totalSats: 0,
      averageBuyPrice: 0,
      currentPortfolioValue: 0,
      floatingPnlIdr: 0,
      floatingPnlPercent: 0,
      transactionCount: 0,
    };
  }

  const now = referenceDate;
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  let totalCapitalDeployed = 0;
  let totalBtc = 0;
  let totalSats = 0;
  let minTicket = Infinity;
  let maxTicket = -Infinity;
  let thisMonthTotal = 0;

  transactions.forEach((tx) => {
    const amount = Number(tx.amountIdr) || 0;
    totalCapitalDeployed += amount;
    if (amount < minTicket) minTicket = amount;
    if (amount > maxTicket) maxTicket = amount;

    const btc = Number(tx.btcAmount) || 0;
    totalBtc += btc;

    const sats = Number(tx.satsAmount) || Math.round(btc * 100_000_000);
    totalSats += sats;

    // Hitung akumulasi bulan ini
    try {
      const txDate = new Date(tx.date);
      if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
        thisMonthTotal += amount;
      }
    } catch {
      // abaikan tanggal tidak valid
    }
  });

  const transactionCount = transactions.length;
  const averageHabitTicket = transactionCount > 0 ? Math.round(totalCapitalDeployed / transactionCount) : 0;
  const averageBuyPrice = totalBtc > 0 ? Math.round(totalCapitalDeployed / totalBtc) : 0;

  const currentPortfolioValue = Math.round(totalBtc * currentBtcPrice);
  const floatingPnlIdr = currentPortfolioValue - totalCapitalDeployed;
  const floatingPnlPercent =
    totalCapitalDeployed > 0 ? ((currentPortfolioValue - totalCapitalDeployed) / totalCapitalDeployed) * 100 : 0;

  return {
    totalCapitalDeployed,
    averageHabitTicket,
    minTicket: minTicket === Infinity ? 0 : minTicket,
    maxTicket: maxTicket === -Infinity ? 0 : maxTicket,
    thisMonthTotal,
    totalBtc,
    totalSats,
    averageBuyPrice,
    currentPortfolioValue,
    floatingPnlIdr,
    floatingPnlPercent,
    transactionCount,
  };
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
