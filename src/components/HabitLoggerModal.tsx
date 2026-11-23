"use client";

import React, { useState } from "react";
import {
  X,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import confetti from "canvas-confetti";
import { HabitTransaction, TransactionType } from "@/types";
import {
  QUICK_NOMINALS,
  SELL_QUICK_PERCENTAGES,
  SELL_REASON_PRESETS,
  DEFAULT_BTC_PRICE_IDR,
} from "@/lib/constants";
import { formatIdr, formatSats, getLocalDateString } from "@/lib/calculations";

interface HabitLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransaction: (tx: HabitTransaction) => void;
  currentBtcPrice: number;
  historicalPrices?: Record<string, number>;
  initialData?: HabitTransaction | null;
  defaultType?: TransactionType;
  availableBtc?: number;
  averageBuyPrice?: number;
}

function toLocalDateTimeInput(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  }
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function createTransactionId(): string {
  return `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

export function HabitLoggerModal(props: HabitLoggerModalProps) {
  if (!props.isOpen) return null;

  const modalKey = props.initialData
    ? `edit-${props.initialData.id}`
    : `new-${props.defaultType || "buy"}`;

  return <HabitLoggerModalContent key={modalKey} {...props} />;
}

function HabitLoggerModalContent({
  onClose,
  onSaveTransaction,
  currentBtcPrice = DEFAULT_BTC_PRICE_IDR,
  historicalPrices = {},
  initialData = null,
  defaultType = "buy",
  availableBtc = 0,
  averageBuyPrice = 0,
}: HabitLoggerModalProps) {
  const initialMode: TransactionType = initialData
    ? initialData.type === "sell"
      ? "sell"
      : "buy"
    : defaultType;

  const [txType, setTxType] = useState<TransactionType>(initialMode);
  const [dateInput, setDateInput] = useState(() =>
    initialData ? toLocalDateTimeInput(initialData.date) : toLocalDateTimeInput()
  );
  const [amountIdr, setAmountIdr] = useState<number>(() =>
    initialData ? initialData.amountIdr : initialMode === "sell" ? 0 : 10000
  );
  const [customAmountText, setCustomAmountText] = useState(() =>
    initialData
      ? initialData.amountIdr.toString()
      : initialMode === "sell"
      ? ""
      : "10000"
  );
  const [selectedSellPercent, setSelectedSellPercent] = useState<number | null>(null);

  const [showAdvanced, setShowAdvanced] = useState(() => Boolean(initialData));
  const [executionPrice, setExecutionPrice] = useState<number>(() =>
    initialData ? initialData.btcPriceAtBuy || currentBtcPrice : currentBtcPrice
  );
  const [isManualPrice, setIsManualPrice] = useState(() => Boolean(initialData));
  const [netReceivedIdr, setNetReceivedIdr] = useState<number | undefined>(
    () => initialData?.netValueIdr
  );
  const [manualBtcAmount, setManualBtcAmount] = useState<string>(() =>
    initialData && initialData.btcAmount ? initialData.btcAmount.toFixed(8) : ""
  );
  const [note, setNote] = useState<string>(() =>
    initialData
      ? initialData.note || ""
      : initialMode === "sell"
      ? "Kebutuhan Mendesak"
      : "Order Market FLOQ"
  );

  // Jika sedang mengedit transaksi jual, tambahkan kembali BTC transaksi tersebut ke saldo tersedia
  const effectiveAvailableBtc =
    initialData && initialData.type === "sell"
      ? availableBtc + (Number(initialData.btcAmount) || 0)
      : availableBtc;
  const effectiveAvailableSats = Math.round(effectiveAvailableBtc * 100_000_000);

  const isSell = txType === "sell";
  const activeBtcPrice = executionPrice > 0 ? executionPrice : currentBtcPrice;
  const effectiveNetIdr =
    netReceivedIdr !== undefined && netReceivedIdr > 0 ? netReceivedIdr : amountIdr;

  let calculatedBtc: number;
  let calculatedSats: number;

  if (manualBtcAmount && parseFloat(manualBtcAmount) > 0) {
    calculatedBtc = parseFloat(manualBtcAmount);
    calculatedSats = Math.round(calculatedBtc * 100_000_000);
  } else if (amountIdr > 0) {
    // Untuk beli gunakan netReceivedIdr (nilai bersih dibelikan BTC);
    // Untuk jual gunakan amountIdr (nilai kotor BTC yang dijual sebelum potongan biaya withdraw)
    const basisIdr = isSell ? amountIdr : effectiveNetIdr;
    const rawSats = (basisIdr / activeBtcPrice) * 100_000_000;
    calculatedSats = Math.floor(rawSats);
    calculatedBtc = calculatedSats / 100_000_000;
  } else {
    calculatedBtc = 0;
    calculatedSats = 0;
  }

  const exceedsBalance = isSell && calculatedBtc > effectiveAvailableBtc + 1e-8;
  const remainingBtcAfterSell = Math.max(0, effectiveAvailableBtc - calculatedBtc);

  // Estimasi Realized PnL untuk mode Jual
  const estimatedRealizedPnl =
    isSell && averageBuyPrice > 0 && calculatedBtc > 0
      ? Math.round(effectiveNetIdr - calculatedBtc * averageBuyPrice)
      : null;

  const handleSwitchMode = (nextMode: TransactionType) => {
    if (nextMode === txType) return;
    setTxType(nextMode);
    setSelectedSellPercent(null);
    setManualBtcAmount("");
    setNetReceivedIdr(undefined);

    if (nextMode === "sell") {
      setAmountIdr(0);
      setCustomAmountText("");
      if (!note || note === "Order Market FLOQ") {
        setNote("Kebutuhan Mendesak");
      }
    } else {
      setAmountIdr(10000);
      setCustomAmountText("10000");
      if (
        !note ||
        SELL_REASON_PRESETS.includes(note as (typeof SELL_REASON_PRESETS)[number])
      ) {
        setNote("Order Market FLOQ");
      }
    }
  };

  // Otomatis sesuaikan harga BTC dengan harga historis jika pengguna memilih tanggal backdate
  const handleDateChange = (newDateVal: string) => {
    setDateInput(newDateVal);
    if (!isManualPrice && newDateVal) {
      const dateKey = newDateVal.slice(0, 10); // YYYY-MM-DD
      const todayKey = getLocalDateString(new Date());
      if (dateKey === todayKey) {
        setExecutionPrice(currentBtcPrice);
      } else if (historicalPrices[dateKey]) {
        setExecutionPrice(historicalPrices[dateKey]);
      }
    }
  };

  const handleSelectQuickBuy = (nominal: number) => {
    setAmountIdr(nominal);
    setCustomAmountText(nominal.toString());
    setManualBtcAmount("");
    if (netReceivedIdr !== undefined) {
      setNetReceivedIdr(nominal > 12 ? nominal - 12 : nominal);
    }
  };

  const handleSelectSellPercent = (percent: number) => {
    if (effectiveAvailableBtc <= 0) return;
    setSelectedSellPercent(percent);

    const targetSats =
      percent === 100
        ? effectiveAvailableSats
        : Math.floor(effectiveAvailableSats * (percent / 100));
    const targetBtc = targetSats / 100_000_000;
    const estimatedIdr = Math.round(targetBtc * activeBtcPrice);

    setManualBtcAmount(targetBtc.toFixed(8));
    setAmountIdr(estimatedIdr);
    setCustomAmountText(estimatedIdr.toString());
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setCustomAmountText(raw);
    const num = parseInt(raw, 10) || 0;
    setAmountIdr(num);
    setSelectedSellPercent(null);
    if (isSell) {
      setManualBtcAmount("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountIdr <= 0 || calculatedBtc <= 0) return;

    const finalDate = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();

    const newTx: HabitTransaction = {
      id: initialData?.id || createTransactionId(),
      type: txType,
      date: finalDate,
      amountIdr,
      netValueIdr: netReceivedIdr,
      btcPriceAtBuy: activeBtcPrice,
      btcAmount: calculatedBtc,
      satsAmount: calculatedSats,
      note: note.trim() || undefined,
    };

    onSaveTransaction(newTx);

    if (!isSell) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#F7931A", "#F59E0B", "#10B981"],
        });
      } catch {
        // ignore
      }
    }

    onClose();
  };

  const selectedDateKey = dateInput ? dateInput.slice(0, 10) : "";
  const isHistoricalPriceUsed =
    !isManualPrice &&
    selectedDateKey &&
    selectedDateKey !== getLocalDateString(new Date()) &&
    Boolean(historicalPrices[selectedDateKey]);

  const availableIdrValue = Math.round(effectiveAvailableBtc * activeBtcPrice);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0D1322] border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header Modal */}
        <div className="sticky top-0 z-10 bg-[#0D1322]/95 backdrop-blur-md px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                isSell
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                  : "bg-[#F7931A]/20 border-[#F7931A]/40 text-[#F7931A]"
              }`}
            >
              {isSell ? <ArrowUpRight className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">
                {initialData
                  ? isSell
                    ? "Ubah Catatan Jual / Withdraw"
                    : "Ubah Catatan DCA"
                  : isSell
                  ? "Catat Jual / Withdraw Modal"
                  : "Catat Pembelian Bitcoin"}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isSell
                  ? "Catat penarikan modal agar saldo & PnL tetap akurat"
                  : "Tambah 1 Blok ke rantai kebiasaanmu"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 pb-8 sm:pb-5 space-y-4">
          {/* Switcher Mode: Beli vs Jual/Withdraw */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => handleSwitchMode("buy")}
              className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                !isSell
                  ? "bg-gradient-to-r from-[#F7931A] to-amber-500 text-black shadow-md shadow-[#F7931A]/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Beli / Stack</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("sell")}
              className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                isSell
                  ? "bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-md shadow-rose-500/25"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Jual / Withdraw</span>
            </button>
          </div>

          {/* Info Saldo Tersedia (Khusus Mode Jual) */}
          {isSell && (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Saldo BTC Tercatat Saat Ini
                  </span>
                  <span className="text-xs font-extrabold text-slate-100 block truncate">
                    {formatSats(effectiveAvailableSats)}{" "}
                    <span className="text-[10px] font-mono text-slate-400">
                      ({effectiveAvailableBtc.toFixed(8)} BTC)
                    </span>
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 block">Estimasi Nilai</span>
                <span className="text-xs font-bold text-emerald-400">
                  {formatIdr(availableIdrValue)}
                </span>
              </div>
            </div>
          )}

          {/* Tanggal & Waktu (Backdate support + Auto Historical Price) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Tanggal & Jam Transaksi
            </label>
            <input
              type="datetime-local"
              value={dateInput}
              onChange={(e) => handleDateChange(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 text-xs focus:outline-none ${
                isSell ? "focus:border-rose-500" : "focus:border-[#F7931A]"
              }`}
              required
            />
          </div>

          {/* Quick Chips: Nominal untuk Beli, Persentase Saldo untuk Jual */}
          {!isSell ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Pilih Cepat Nominal Beli (Quick Chips)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_NOMINALS.map((nominal) => {
                  const isSelected = amountIdr === nominal;
                  return (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => handleSelectQuickBuy(nominal)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? "bg-[#F7931A] text-black border-[#F7931A] shadow-md shadow-[#F7931A]/25"
                          : "bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300"
                      }`}
                    >
                      {formatIdr(nominal)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Pilih Cepat Porsi Jual / Withdraw
              </label>
              <div className="grid grid-cols-4 gap-2">
                {SELL_QUICK_PERCENTAGES.map((pct) => {
                  const isSelected = selectedSellPercent === pct;
                  return (
                    <button
                      key={pct}
                      type="button"
                      disabled={effectiveAvailableBtc <= 0}
                      onClick={() => handleSelectSellPercent(pct)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                        effectiveAvailableBtc <= 0
                          ? "bg-slate-900/60 border-slate-800 text-slate-600 cursor-not-allowed"
                          : isSelected
                          ? "bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/25"
                          : "bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300"
                      }`}
                    >
                      {pct === 100 ? "100% All" : `${pct}%`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input Nominal Kustom */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isSell
                ? "Nominal Penjualan / Withdraw (Rp)"
                : "Atau Masukkan Nominal Sendiri (Rp)"}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                value={customAmountText}
                onChange={handleCustomChange}
                placeholder={isSell ? "Contoh: 500000" : "Contoh: 10000"}
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm focus:outline-none ${
                  isSell ? "focus:border-rose-500" : "focus:border-[#F7931A]"
                }`}
              />
            </div>
          </div>

          {/* Alasan / Catatan Cepat (Khusus Mode Jual) */}
          {isSell && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Alasan Penjualan / Catatan
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {SELL_REASON_PRESETS.map((preset) => {
                  const active = note === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNote(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                        active
                          ? "bg-rose-500/20 border-rose-500/50 text-rose-300"
                          : "bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: Kebutuhan mendesak / tarik modal FLOQ"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
          )}

          {/* Live / Historical Satoshi Conversion Banner */}
          <div
            className={`p-3.5 rounded-xl border space-y-2 ${
              isSell
                ? "bg-gradient-to-r from-rose-500/10 via-red-500/10 to-transparent border-rose-500/25"
                : "bg-gradient-to-r from-[#F7931A]/10 via-amber-500/10 to-transparent border-[#F7931A]/20"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {isSell ? "Bitcoin yang Dijual" : "Perolehan Satoshi"}
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                  <span
                    className={`text-lg font-black ${
                      isSell ? "text-rose-400" : "text-[#F7931A]"
                    }`}
                  >
                    {isSell ? "-" : "+"}
                    {formatSats(calculatedSats)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ({calculatedBtc.toFixed(8)} BTC)
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 block">
                  {isHistoricalPriceUsed
                    ? "Harga Historis Tanggal Ini"
                    : isSell
                    ? "Harga Jual Acuan"
                    : "Harga Beli Acuan"}
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {formatIdr(activeBtcPrice)}
                </span>
              </div>
            </div>

            {/* Estimasi Realized PnL & Sisa Saldo untuk Mode Jual */}
            {isSell && calculatedBtc > 0 && (
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Sisa Saldo Setelah Jual</span>
                  <span className="font-mono font-bold text-slate-200">
                    {remainingBtcAfterSell.toFixed(8)} BTC
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Est. Realized PnL</span>
                  {estimatedRealizedPnl !== null ? (
                    <span
                      className={`font-bold ${
                        estimatedRealizedPnl > 0
                          ? "text-emerald-400"
                          : estimatedRealizedPnl < 0
                          ? "text-rose-400"
                          : "text-slate-300"
                      }`}
                    >
                      {estimatedRealizedPnl > 0 ? "+" : ""}
                      {formatIdr(estimatedRealizedPnl)}
                    </span>
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Peringatan jika melebihi saldo BTC tercatat */}
          {exceedsBalance && (
            <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-[11px] flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Jumlah jual ({calculatedBtc.toFixed(8)} BTC) melebihi saldo tercatat (
                  {effectiveAvailableBtc.toFixed(8)} BTC). Kamu tetap bisa mencatatnya atau pakai
                  100% saldo.
                </span>
              </div>
              {effectiveAvailableBtc > 0 && (
                <button
                  type="button"
                  onClick={() => handleSelectSellPercent(100)}
                  className="px-2 py-1 rounded-lg bg-amber-500 text-black font-extrabold text-[10px] shrink-0 whitespace-nowrap"
                >
                  Pakai 100%
                </button>
              )}
            </div>
          )}

          {/* Toggle Mode Detail / Struk Exchange */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium"
            >
              {showAdvanced ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              {showAdvanced
                ? "Sembunyikan Detail Struk FLOQ"
                : isSell
                ? "Sesuaikan Struk Jual (Harga Jual, Dana Bersih, BTC Dijual)"
                : "Sesuaikan Struk FLOQ (Harga Beli, BTC Diterima, Catatan)"}
            </button>

            {showAdvanced && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 animate-in slide-in-from-top-2 duration-150">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    {isSell
                      ? "Harga Eksekusi BTC saat Jual (Rp)"
                      : "Harga Eksekusi BTC saat Beli (Rp)"}
                  </label>
                  <input
                    type="number"
                    value={executionPrice}
                    onChange={(e) => {
                      setIsManualPrice(true);
                      setExecutionPrice(parseFloat(e.target.value) || currentBtcPrice);
                    }}
                    placeholder="1493000000"
                    className={`w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none ${
                      isSell ? "focus:border-rose-500" : "focus:border-[#F7931A]"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      {isSell
                        ? "Dana Bersih Diterima / Net (Rp)"
                        : "Nominal Bersih / Net (Rp)"}
                    </label>
                    <input
                      type="number"
                      value={netReceivedIdr ?? ""}
                      onChange={(e) =>
                        setNetReceivedIdr(e.target.value ? parseFloat(e.target.value) : undefined)
                      }
                      placeholder={isSell ? "Setelah biaya tarik" : "Contoh: 9988"}
                      className={`w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none ${
                        isSell ? "focus:border-rose-500" : "focus:border-[#F7931A]"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      {isSell ? "Jumlah BTC Dijual (Struk)" : "Jumlah BTC Diterima (Struk)"}
                    </label>
                    <input
                      type="text"
                      value={manualBtcAmount}
                      onChange={(e) => {
                        setSelectedSellPercent(null);
                        setManualBtcAmount(e.target.value);
                      }}
                      placeholder="Contoh: 0.00000668"
                      className={`w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none ${
                        isSell ? "focus:border-rose-500" : "focus:border-[#F7931A]"
                      }`}
                    />
                  </div>
                </div>

                {!isSell && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Catatan / Exchange (Opsional)
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Order Market FLOQ"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-[#F7931A]"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tombol Simpan */}
          <button
            type="submit"
            disabled={amountIdr <= 0 || calculatedBtc <= 0}
            className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              amountIdr <= 0 || calculatedBtc <= 0
                ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed shadow-none"
                : isSell
                ? "bg-gradient-to-r from-rose-600 via-rose-500 to-red-500 text-white shadow-rose-500/25 hover:brightness-105 active:scale-[0.99]"
                : "bg-gradient-to-r from-[#F7931A] via-amber-500 to-[#F7931A] text-black shadow-[#F7931A]/20 hover:brightness-105 active:scale-[0.99]"
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>
              {initialData
                ? isSell
                  ? "Simpan Perubahan Jual"
                  : "Simpan Perubahan Blok"
                : isSell
                ? "Catat Penjualan / Withdraw"
                : "Stack Blok Ini (+1 Streak 🔥)"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
