"use client";

import React, { useState, useEffect } from "react";
import {
  Flame,
  BarChart2,
  Compass,
  History,
  Plus,
  Sparkles,
  Layers,
  FileText,
  Shield,
  Share2,
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
  formatIdr,
} from "@/lib/calculations";
import {
  DEFAULT_BTC_PRICE_IDR,
  HALVING_TARGET_BLOCK,
  SAMPLE_STORAGE,
} from "@/lib/constants";

import { Header } from "@/components/Header";
import { StreakSection } from "@/components/StreakSection";
import { AnalyticsSection } from "@/components/AnalyticsSection";
import { BitcoinRadar } from "@/components/BitcoinRadar";
import { TransactionHistory } from "@/components/TransactionHistory";
import { HabitLoggerModal } from "@/components/HabitLoggerModal";
import { NotepadImporterModal } from "@/components/NotepadImporterModal";
import { ShareCardModal } from "@/components/ShareCardModal";
import { BackupModal } from "@/components/BackupModal";

export default function HomePage() {
  // 1. Data State
  const [storage, setStorage] = useState<BlockHabitStorage>(SAMPLE_STORAGE);
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  // 2. Market & Halving Data State
  const [ticker, setTicker] = useState<MarketTicker>({
    priceIdr: DEFAULT_BTC_PRICE_IDR,
    change24h: 1.25,
    high24h: 1510000000,
    low24h: 1475000000,
    lastUpdated: "2026-10-28T00:00:00.000Z",
    source: "Memuat Data...",
  });

  const [halving, setHalving] = useState<HalvingData>({
    currentBlock: 882000,
    targetBlock: HALVING_TARGET_BLOCK,
    remainingBlocks: HALVING_TARGET_BLOCK - 882000,
    estimatedDate: "April 2028",
    daysRemaining: 550,
    progressPercent: 20.0,
    cyclePhase: "Akumulasi",
  });

  // 3. Navigation Tab: "dashboard" | "radar" | "riwayat"
  const [activeTab, setActiveTab] = useState<"dashboard" | "radar" | "riwayat">("dashboard");

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
    setIsClientLoaded(true);

    // Fetch Live Ticker
    fetch("/api/ticker")
      .then((res) => res.json())
      .then((data) => {
        if (data?.priceIdr) setTicker(data);
      })
      .catch((err) => console.warn("Gagal memuat ticker:", err));

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
      storage.streak.streakFreezesAvailable
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
      storage.streak.streakFreezesAvailable
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
      storage.streak.streakFreezesAvailable
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
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col pb-24 selection:bg-[#F7931A] selection:text-black">
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

      {/* Main Responsive Body Container (Max 600px width for supreme mobile-first feel) */}
      <main className="max-w-xl w-full mx-auto px-4 pt-3 space-y-5 flex-1">
        {/* Navigation Tabs Pill Bar */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-900/90 border border-slate-800">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "dashboard"
                ? "bg-[#F7931A] text-black shadow-md shadow-[#F7931A]/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("radar")}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "radar"
                ? "bg-[#F7931A] text-black shadow-md shadow-[#F7931A]/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>BTC Radar</span>
          </button>

          <button
            onClick={() => setActiveTab("riwayat")}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "riwayat"
                ? "bg-[#F7931A] text-black shadow-md shadow-[#F7931A]/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat ({storage.transactions.length})</span>
          </button>
        </div>

        {/* Tab 1: Dashboard View */}
        {activeTab === "dashboard" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Gamifikasi Block Streak & Heatmap */}
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

            {/* Average & Analytics Engine */}
            <AnalyticsSection
              analytics={analytics}
              transactions={storage.transactions}
              currentBtcPrice={currentPrice}
            />
          </div>
        )}

        {/* Tab 2: Bitcoin Radar & Halving Info */}
        {activeTab === "radar" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <BitcoinRadar
              ticker={ticker}
              halving={halving}
              averageHabitTicket={analytics.averageHabitTicket}
              onSelectQuickAction={(amount) => {
                setEditingTransaction(null);
                setIsLoggerOpen(true);
              }}
            />
          </div>
        )}

        {/* Tab 3: Riwayat Transaksi CRUD */}
        {activeTab === "riwayat" && (
          <div className="space-y-4 animate-in fade-in duration-150">
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

      {/* Floating 1-Tap CTA Bar (Thumb-Friendly on Smartphones) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-gradient-to-t from-[#090D16] via-[#090D16]/95 to-transparent backdrop-blur-sm pointer-events-auto">
        <div className="max-w-xl mx-auto flex items-center gap-2">
          <button
            onClick={() => {
              setEditingTransaction(null);
              setIsLoggerOpen(true);
            }}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#F7931A] via-amber-500 to-[#F7931A] text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#F7931A]/25 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>1-Tap Catat Beli Bitcoin (+1 Blok)</span>
          </button>
        </div>
      </div>

      {/* MODALS */}
      <HabitLoggerModal
        isOpen={isLoggerOpen}
        onClose={() => {
          setIsLoggerOpen(false);
          setEditingTransaction(null);
        }}
        onSaveTransaction={handleSaveTransaction}
        currentBtcPrice={currentPrice}
        initialData={editingTransaction}
      />

      <NotepadImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportSuccess={handleBulkImport}
        currentBtcPrice={currentPrice}
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
