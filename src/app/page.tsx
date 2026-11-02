"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart2,
  Compass,
  History,
  Plus,
  Target,
  Calculator,
} from "lucide-react";

import {
  BlockHabitStorage,
  HabitTransaction,
  MarketTicker,
  HalvingData,
} from "@/types";
import {
  loadStorageFromBrowser,
  saveStorageToBrowser,
} from "@/lib/storage";
import {
  calculateAnalytics,
  recalculateStreak,
  getLocalDateString,
} from "@/lib/calculations";
import {
  DEFAULT_BTC_PRICE_IDR,
  HALVING_TARGET_BLOCK,
  INITIAL_STORAGE,
} from "@/lib/constants";

import { Header } from "@/components/Header";
import { StreakSection } from "@/components/StreakSection";
import { AnalyticsSection } from "@/components/AnalyticsSection";
import { BitcoinRadar } from "@/components/BitcoinRadar";
import { DCAProjectionCalculator } from "@/components/DCAProjectionCalculator";
import { TakeProfitPlanner } from "@/components/TakeProfitPlanner";
import { TransactionHistory } from "@/components/TransactionHistory";
import { HabitLoggerModal } from "@/components/HabitLoggerModal";
import { NotepadImporterModal } from "@/components/NotepadImporterModal";
import { ShareCardModal } from "@/components/ShareCardModal";
import { BackupModal } from "@/components/BackupModal";

export default function HomePage() {
  // 1. Data State (Starts completely fresh from 0)
  const [storage, setStorage] = useState<BlockHabitStorage>(INITIAL_STORAGE);

  // 2. Market, Historical & Halving Data State
  const [ticker, setTicker] = useState<MarketTicker>({
    priceIdr: DEFAULT_BTC_PRICE_IDR,
    change24h: 1.25,
    high24h: 1510000000,
    low24h: 1475000000,
    lastUpdated: "2026-10-28T00:00:00.000Z",
    source: "Memuat Data...",
  });

  const [historicalPrices, setHistoricalPrices] = useState<Record<string, number>>({});

  const [halving, setHalving] = useState<HalvingData>({
    currentBlock: 882000,
    targetBlock: HALVING_TARGET_BLOCK,
    remainingBlocks: HALVING_TARGET_BLOCK - 882000,
    estimatedDate: "April 2028",
    daysRemaining: 550,
    progressPercent: 20.0,
    cyclePhase: "Akumulasi",
  });

  // 3. Navigation Tab: "dashboard" | "radar" | "kalkulator" | "exitplan" | "riwayat"
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "radar" | "kalkulator" | "exitplan" | "riwayat"
  >("dashboard");

  // 4. Modals State
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<HabitTransaction | null>(null);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isShareCardOpen, setIsShareCardOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  const [clientDate, setClientDate] = useState<Date>(
    new Date("2026-10-28T00:00:00.000Z")
  );

  // Load from browser localStorage on initial render
  useEffect(() => {
    setClientDate(new Date());
    const loaded = loadStorageFromBrowser();
    setStorage(loaded);

    // Register PWA Service Worker for Android Home Screen installation
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.warn("SW registration skipped:", err));
    }

    // Fetch Live Ticker
    fetch("/api/ticker")
      .then((res) => res.json())
      .then((data) => {
        if (data?.priceIdr) setTicker(data);
      })
      .catch((err) => console.warn("Gagal memuat ticker:", err));

    // Fetch Historical Daily Prices & Auto-Fix Past Transactions that used Today's Price
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => {
        if (data?.priceByDate) {
          const priceMap: Record<string, number> = data.priceByDate;
          setHistoricalPrices(priceMap);

          // Jika ada transaksi masa lalu yang semuanya memakai harga beli yang sama (akibat import/backdate tanpa harga historis),
          // otomatis sesuaikan dengan harga BTC historis pada masing-masing tanggal!
          const currentLoaded = loadStorageFromBrowser();
          if (currentLoaded.transactions.length > 1) {
            const uniquePrices = new Set(
              currentLoaded.transactions.map((t) => Math.round(t.btcPriceAtBuy))
            );
            if (uniquePrices.size <= 2) {
              let changed = false;
              const updatedTxs = currentLoaded.transactions.map((tx) => {
                const dateKey = getLocalDateString(tx.date);
                const histPrice = priceMap[dateKey];
                if (histPrice && histPrice > 0 && Math.abs(tx.btcPriceAtBuy - histPrice) > 1000) {
                  changed = true;
                  const netIdr = tx.netValueIdr ?? tx.amountIdr;
                  const sats = Math.floor((netIdr / histPrice) * 100_000_000);
                  return {
                    ...tx,
                    btcPriceAtBuy: histPrice,
                    satsAmount: sats,
                    btcAmount: sats / 100_000_000,
                  };
                }
                return tx;
              });

              if (changed) {
                const syncedStorage: BlockHabitStorage = {
                  ...currentLoaded,
                  transactions: updatedTxs,
                };
                setStorage(syncedStorage);
                saveStorageToBrowser(syncedStorage);
              }
            }
          }
        }
      })
      .catch((err) => console.warn("Gagal memuat history harga:", err));

    // Fetch Halving Data
    fetch("/api/halving")
      .then((res) => res.json())
      .then((data) => {
        if (data?.currentBlock) setHalving(data);
      })
      .catch((err) => console.warn("Gagal memuat halving:", err));
  }, []);

  // Update localStorage when storage state changes
  const updateStorage = (newStorage: BlockHabitStorage) => {
    setStorage(newStorage);
    saveStorageToBrowser(newStorage);
  };

  // Analytics calculation
  const currentPrice = ticker.priceIdr || DEFAULT_BTC_PRICE_IDR;
  const analytics = calculateAnalytics(storage.transactions, currentPrice, clientDate);

  // Sync Historical Prices Manually
  const handleSyncHistoricalPrices = () => {
    if (!historicalPrices || Object.keys(historicalPrices).length === 0) return;
    const updatedTxs = storage.transactions.map((tx) => {
      const dateKey = getLocalDateString(tx.date);
      const histPrice = historicalPrices[dateKey];
      if (histPrice && histPrice > 0) {
        const netIdr = tx.netValueIdr ?? tx.amountIdr;
        const sats = Math.floor((netIdr / histPrice) * 100_000_000);
        return {
          ...tx,
          btcPriceAtBuy: histPrice,
          satsAmount: sats,
          btcAmount: sats / 100_000_000,
        };
      }
      return tx;
    });

    updateStorage({
      ...storage,
      transactions: updatedTxs,
    });
  };

  // Calibrate Total BTC to match FLOQ exactly
  const handleCalibrateTotalBtc = (targetTotalBtc: number) => {
    if (storage.transactions.length === 0 || targetTotalBtc <= 0) return;
    const totalCapital = storage.transactions.reduce((acc, tx) => acc + tx.amountIdr, 0);
    if (totalCapital <= 0) return;

    const impliedAvgPrice = Math.round(totalCapital / targetTotalBtc);
    const updatedTxs = storage.transactions.map((tx) => {
      const weight = tx.amountIdr / totalCapital;
      const txBtc = parseFloat((targetTotalBtc * weight).toFixed(8));
      const txSats = Math.round(txBtc * 100_000_000);
      return {
        ...tx,
        btcPriceAtBuy: impliedAvgPrice,
        btcAmount: txBtc,
        satsAmount: txSats,
      };
    });

    updateStorage({
      ...storage,
      transactions: updatedTxs,
    });
  };

  // Calibrate Average Buy Price to match FLOQ exactly
  const handleCalibrateAvgBuyPrice = (targetAvgPriceIdr: number) => {
    if (storage.transactions.length === 0 || targetAvgPriceIdr <= 0) return;
    const updatedTxs = storage.transactions.map((tx) => {
      const netIdr = tx.netValueIdr ?? tx.amountIdr;
      const sats = Math.floor((netIdr / targetAvgPriceIdr) * 100_000_000);
      return {
        ...tx,
        btcPriceAtBuy: targetAvgPriceIdr,
        satsAmount: sats,
        btcAmount: sats / 100_000_000,
      };
    });

    updateStorage({
      ...storage,
      transactions: updatedTxs,
    });
  };

  // Transaction Handler: Save or Update
  const handleSaveTransaction = (tx: HabitTransaction) => {
    let updatedTxList: HabitTransaction[];
    const exists = storage.transactions.some((item) => item.id === tx.id);

    if (exists) {
      updatedTxList = storage.transactions.map((item) => (item.id === tx.id ? tx : item));
    } else {
      updatedTxList = [tx, ...storage.transactions];
    }

    const updatedStreak = recalculateStreak(
      updatedTxList,
      storage.streak.streakFreezesAvailable,
      clientDate
    );

    const newStorage: BlockHabitStorage = {
      ...storage,
      transactions: updatedTxList,
      streak: updatedStreak,
    };

    updateStorage(newStorage);
    setEditingTransaction(null);
  };

  // Transaction Handler: Delete
  const handleDeleteTransaction = (id: string) => {
    const updatedTxList = storage.transactions.filter((tx) => tx.id !== id);
    const updatedStreak = recalculateStreak(
      updatedTxList,
      storage.streak.streakFreezesAvailable,
      clientDate
    );

    const newStorage: BlockHabitStorage = {
      ...storage,
      transactions: updatedTxList,
      streak: updatedStreak,
    };

    updateStorage(newStorage);
  };

  // Bulk Notepad Import Handler
  const handleBulkImport = (newTransactions: HabitTransaction[]) => {
    const combined = [...newTransactions, ...storage.transactions];
    const updatedStreak = recalculateStreak(
      combined,
      storage.streak.streakFreezesAvailable,
      clientDate
    );

    const newStorage: BlockHabitStorage = {
      ...storage,
      transactions: combined,
      streak: updatedStreak,
    };

    updateStorage(newStorage);
  };

  // Restore entire data from JSON
  const handleRestoreData = (restored: BlockHabitStorage) => {
    updateStorage(restored);
  };

  // Update profile
  const handleUpdateProfile = (profile: BlockHabitStorage["profile"]) => {
    updateStorage({
      ...storage,
      profile,
    });
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col pb-28 selection:bg-[#F7931A] selection:text-black">
      {/* Mobile-First Header */}
      <Header
        streak={storage.streak}
        onOpenLogger={() => {
          setEditingTransaction(null);
          setIsLoggerOpen(true);
        }}
        onOpenImporter={() => setIsImporterOpen(true)}
        onOpenShareCard={() => setIsShareCardOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      {/* Main Responsive Body Container */}
      <main className="max-w-xl w-full mx-auto px-3 sm:px-4 pt-2.5 space-y-3.5 flex-1 pb-16">
        {/* Tab 1: Dashboard View */}
        {activeTab === "dashboard" && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            <StreakSection
              streak={storage.streak}
              transactions={storage.transactions}
              onOpenShareCard={() => setIsShareCardOpen(true)}
              onOpenLogger={() => {
                setEditingTransaction(null);
                setIsLoggerOpen(true);
              }}
              referenceDate={clientDate}
            />

            <AnalyticsSection
              analytics={analytics}
              transactions={storage.transactions}
              currentBtcPrice={currentPrice}
              onSyncHistoricalPrices={handleSyncHistoricalPrices}
              onCalibrateTotalBtc={handleCalibrateTotalBtc}
              onCalibrateAvgBuyPrice={handleCalibrateAvgBuyPrice}
            />

            {/* Quick 1-Tap CTA Button directly in Dashboard flow */}
            <div className="pt-1">
              <button
                onClick={() => {
                  setEditingTransaction(null);
                  setIsLoggerOpen(true);
                }}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#F7931A] via-amber-500 to-[#F7931A] text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#F7931A]/30 ring-1 ring-white/20 hover:brightness-110 active:scale-[0.98] transition-all whitespace-nowrap"
              >
                <Plus className="w-4 h-4 stroke-[3] shrink-0" />
                <span>1-Tap Catat Beli Bitcoin (+1 Blok)</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Bitcoin Radar & Halving Info */}
        {activeTab === "radar" && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            <BitcoinRadar
              ticker={ticker}
              halving={halving}
              averageHabitTicket={analytics.averageHabitTicket}
              onSelectQuickAction={() => {
                setEditingTransaction(null);
                setIsLoggerOpen(true);
              }}
            />
          </div>
        )}

        {/* Tab 3: Kalkulator Proyeksi DCA (Simulator Compound Interest) */}
        {activeTab === "kalkulator" && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            <DCAProjectionCalculator
              initialDailyDca={
                analytics.averageHabitTicket > 0
                  ? analytics.averageHabitTicket
                  : 25000
              }
              currentBtcPrice={currentPrice}
            />
          </div>
        )}

        {/* Tab 4: Take-Profit Exit Planner 2029 */}
        {activeTab === "exitplan" && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            <TakeProfitPlanner
              currentPrice={currentPrice}
              totalBtc={analytics.totalBtc}
              totalCapitalDeployed={analytics.totalCapitalDeployed}
              averageBuyPrice={analytics.averageBuyPrice}
              floatingPnlPercent={analytics.floatingPnlPercent}
            />
          </div>
        )}

        {/* Tab 5: Riwayat Transaksi CRUD */}
        {activeTab === "riwayat" && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            <TransactionHistory
              transactions={storage.transactions}
              onEditTransaction={(tx) => {
                setEditingTransaction(tx);
                setIsLoggerOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenLogger={() => {
                setEditingTransaction(null);
                setIsLoggerOpen(true);
              }}
            />
          </div>
        )}
      </main>

      {/* Floating 1-Tap Quick Action Button (Always Accessible with Thumb) */}
      <div className="fixed bottom-[4.8rem] right-4 sm:right-6 z-40 pointer-events-auto">
        <button
          onClick={() => {
            setEditingTransaction(null);
            setIsLoggerOpen(true);
          }}
          className="px-3.5 py-2.5 rounded-full bg-gradient-to-r from-[#F7931A] via-amber-500 to-[#F7931A] text-black font-black text-xs flex items-center gap-1.5 shadow-xl shadow-[#F7931A]/35 hover:brightness-110 active:scale-95 transition-all border border-amber-300/40"
          title="Catat Transaksi DCA Baru"
        >
          <Plus className="w-4 h-4 stroke-[3] shrink-0" />
          <span className="font-extrabold pr-0.5">Catat Blok</span>
        </button>
      </div>

      {/* Mobile-First Bottom Navigation Bar (Navbar Bottom) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#090D16]/95 backdrop-blur-xl border-t border-slate-800/90 shadow-2xl pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <div className="max-w-md mx-auto px-2 flex items-center justify-around">
          {/* 1. Dashboard */}
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative ${
              activeTab === "dashboard"
                ? "text-[#F7931A]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="relative">
              <BarChart2
                className={`w-5 h-5 transition-transform ${
                  activeTab === "dashboard" ? "scale-110" : ""
                }`}
              />
              {activeTab === "dashboard" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#F7931A]" />
              )}
            </div>
            <span
              className={`text-[10px] mt-1 tracking-tight ${
                activeTab === "dashboard" ? "font-extrabold" : "font-medium"
              }`}
            >
              Dashboard
            </span>
          </button>

          {/* 2. Radar */}
          <button
            onClick={() => setActiveTab("radar")}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative ${
              activeTab === "radar"
                ? "text-[#F7931A]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="relative">
              <Compass
                className={`w-5 h-5 transition-transform ${
                  activeTab === "radar" ? "scale-110" : ""
                }`}
              />
              {activeTab === "radar" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#F7931A]" />
              )}
            </div>
            <span
              className={`text-[10px] mt-1 tracking-tight ${
                activeTab === "radar" ? "font-extrabold" : "font-medium"
              }`}
            >
              Radar
            </span>
          </button>

          {/* 3. Kalkulator DCA */}
          <button
            onClick={() => setActiveTab("kalkulator")}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative ${
              activeTab === "kalkulator"
                ? "text-[#F7931A]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="relative">
              <Calculator
                className={`w-5 h-5 transition-transform ${
                  activeTab === "kalkulator" ? "scale-110" : ""
                }`}
              />
              {activeTab === "kalkulator" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#F7931A]" />
              )}
            </div>
            <span
              className={`text-[10px] mt-1 tracking-tight ${
                activeTab === "kalkulator" ? "font-extrabold" : "font-medium"
              }`}
            >
              Kalkulator
            </span>
          </button>

          {/* 4. Exit 2029 */}
          <button
            onClick={() => setActiveTab("exitplan")}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative ${
              activeTab === "exitplan"
                ? "text-[#F7931A]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="relative">
              <Target
                className={`w-5 h-5 transition-transform ${
                  activeTab === "exitplan" ? "scale-110" : ""
                }`}
              />
              {activeTab === "exitplan" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#F7931A]" />
              )}
            </div>
            <span
              className={`text-[10px] mt-1 tracking-tight ${
                activeTab === "exitplan" ? "font-extrabold" : "font-medium"
              }`}
            >
              Exit 2029
            </span>
          </button>

          {/* 5. Riwayat */}
          <button
            onClick={() => setActiveTab("riwayat")}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative ${
              activeTab === "riwayat"
                ? "text-[#F7931A]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="relative">
              <History
                className={`w-5 h-5 transition-transform ${
                  activeTab === "riwayat" ? "scale-110" : ""
                }`}
              />
              {storage.transactions.length > 0 && (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-slate-800 border border-slate-700 text-[8px] font-bold text-slate-300 leading-none">
                  {storage.transactions.length}
                </span>
              )}
              {activeTab === "riwayat" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#F7931A]" />
              )}
            </div>
            <span
              className={`text-[10px] mt-1 tracking-tight ${
                activeTab === "riwayat" ? "font-extrabold" : "font-medium"
              }`}
            >
              Riwayat
            </span>
          </button>
        </div>
      </nav>

      {/* MODALS */}
      <HabitLoggerModal
        isOpen={isLoggerOpen}
        onClose={() => {
          setIsLoggerOpen(false);
          setEditingTransaction(null);
        }}
        onSaveTransaction={handleSaveTransaction}
        currentBtcPrice={currentPrice}
        historicalPrices={historicalPrices}
        initialData={editingTransaction}
      />

      <NotepadImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportSuccess={handleBulkImport}
        currentBtcPrice={currentPrice}
        historicalPrices={historicalPrices}
      />

      <ShareCardModal
        isOpen={isShareCardOpen}
        onClose={() => setIsShareCardOpen(false)}
        streak={storage.streak}
        analytics={analytics}
        exchangeName={storage.profile.exchangeName}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        storageData={storage}
        onRestoreData={handleRestoreData}
        onUpdateProfile={handleUpdateProfile}
      />
    </div>
  );
}
