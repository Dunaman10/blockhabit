"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Plus, Clock, ChevronDown, ChevronUp, Check, Layers } from "lucide-react";
import confetti from "canvas-confetti";
import { HabitTransaction } from "@/types";
import { QUICK_NOMINALS, DEFAULT_BTC_PRICE_IDR } from "@/lib/constants";
import { formatIdr, formatSats, formatBtc } from "@/lib/calculations";

interface HabitLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransaction: (tx: HabitTransaction) => void;
  currentBtcPrice: number;
  initialData?: HabitTransaction | null;
}

export function HabitLoggerModal({
  isOpen,
  onClose,
  onSaveTransaction,
  currentBtcPrice = DEFAULT_BTC_PRICE_IDR,
  initialData = null,
}: HabitLoggerModalProps) {
  // Input fields
  const [dateInput, setDateInput] = useState("");
  const [amountIdr, setAmountIdr] = useState<number>(10000);
  const [customAmountText, setCustomAmountText] = useState("10000");

  // Advanced / Exchange Receipt Accordion
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [executionPrice, setExecutionPrice] = useState<number>(currentBtcPrice);
  const [netReceivedIdr, setNetReceivedIdr] = useState<number | undefined>(undefined);
  const [manualBtcAmount, setManualBtcAmount] = useState<string>("");
  const [note, setNote] = useState<string>("Order Market FLOQ");

  useEffect(() => {
    if (initialData) {
      setDateInput(initialData.date ? initialData.date.slice(0, 16) : "");
      setAmountIdr(initialData.amountIdr);
      setCustomAmountText(initialData.amountIdr.toString());
      setExecutionPrice(initialData.btcPriceAtBuy || currentBtcPrice);
      setNetReceivedIdr(initialData.netValueIdr);
      setManualBtcAmount(initialData.btcAmount ? initialData.btcAmount.toString() : "");
      setNote(initialData.note || "");
      setShowAdvanced(true);
    } else {
      // Waktu saat ini format YYYY-MM-DDTHH:mm
      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDateInput(localIso);
      setAmountIdr(10000);
      setCustomAmountText("10000");
      setExecutionPrice(currentBtcPrice);
      setNetReceivedIdr(undefined);
      setManualBtcAmount("");
      setNote("Order Market FLOQ");
      setShowAdvanced(false);
    }
  }, [isOpen, initialData, currentBtcPrice]);

  if (!isOpen) return null;

  // Kalkulasi estimasi BTC & Satoshi
  const activeBtcPrice = executionPrice > 0 ? executionPrice : currentBtcPrice;
  const effectiveNetIdr = netReceivedIdr !== undefined && netReceivedIdr > 0 ? netReceivedIdr : amountIdr;

  let calculatedBtc: number;
  let calculatedSats: number;

  if (manualBtcAmount && parseFloat(manualBtcAmount) > 0) {
    calculatedBtc = parseFloat(manualBtcAmount);
    calculatedSats = Math.round(calculatedBtc * 100_000_000);
  } else {
    calculatedBtc = parseFloat((effectiveNetIdr / activeBtcPrice).toFixed(8));
    calculatedSats = Math.round(calculatedBtc * 100_000_000);
  }

  const handleSelectQuick = (nominal: number) => {
    setAmountIdr(nominal);
    setCustomAmountText(nominal.toString());
    if (netReceivedIdr !== undefined) {
      // Sesuaikan pembulatan fee nominal bersih jika ada
      setNetReceivedIdr(nominal > 12 ? nominal - 12 : nominal);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setCustomAmountText(raw);
    const num = parseInt(raw, 10) || 0;
    setAmountIdr(num);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountIdr <= 0) return;

    // Pastikan tanggal valid
    const finalDate = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();

    const newTx: HabitTransaction = {
      id: initialData?.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: finalDate,
      amountIdr,
      netValueIdr: netReceivedIdr,
      btcPriceAtBuy: activeBtcPrice,
      btcAmount: calculatedBtc,
      satsAmount: calculatedSats,
      note: note.trim() || undefined,
    };

    onSaveTransaction(newTx);

    // Efek Konfeti Streak
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#F7931A", "#F59E0B", "#10B981"],
      });
    } catch {
      // abaikan jika tidak didukung
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0D1322] border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header Modal */}
        <div className="sticky top-0 z-10 bg-[#0D1322]/95 backdrop-blur-md px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F7931A]/20 border border-[#F7931A]/40 flex items-center justify-center text-[#F7931A]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">
                {initialData ? "Ubah Catatan DCA" : "Catat Pembelian Bitcoin Hari Ini"}
              </h2>
              <p className="text-[11px] text-slate-400">Tambah 1 Blok ke rantai kebiasaanmu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tanggal & Waktu (Backdate support) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Tanggal & Jam Transaksi
            </label>
            <input
              type="datetime-local"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-[#F7931A]"
              required
            />
          </div>

          {/* Quick Nominal Chips */}
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
                    onClick={() => handleSelectQuick(nominal)}
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

          {/* Input Nominal Kustom */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Atau Masukkan Nominal Sendiri (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                value={customAmountText}
                onChange={handleCustomChange}
                placeholder="Contoh: 10000"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm focus:outline-none focus:border-[#F7931A]"
              />
            </div>
          </div>

          {/* Live Satoshi Conversion Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#F7931A]/10 via-amber-500/10 to-transparent border border-[#F7931A]/20 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Perolehan Satoshi (Live Price)
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-black text-[#F7931A]">
                  +{formatSats(calculatedSats)}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({calculatedBtc.toFixed(8)} BTC)
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Harga Acuan</span>
              <span className="text-xs font-semibold text-slate-300">
                {formatIdr(activeBtcPrice)}
              </span>
            </div>
          </div>

          {/* Toggle Mode Detail / Struk Exchange */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium"
            >
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showAdvanced ? "Sembunyikan Detail Struk Exchange" : "Sesuaikan Struk Exchange (Opsional: Fee, Harga Eksekusi, Catatan)"}
            </button>

            {showAdvanced && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 animate-in slide-in-from-top-2 duration-150">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Harga Eksekusi BTC (Rp)
                  </label>
                  <input
                    type="number"
                    value={executionPrice}
                    onChange={(e) => setExecutionPrice(parseFloat(e.target.value) || currentBtcPrice)}
                    placeholder="1493000000"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-[#F7931A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Nominal Bersih / Net (Rp)
                    </label>
                    <input
                      type="number"
                      value={netReceivedIdr ?? ""}
                      onChange={(e) =>
                        setNetReceivedIdr(e.target.value ? parseFloat(e.target.value) : undefined)
                      }
                      placeholder="Contoh: 9988"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-[#F7931A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Jumlah BTC Diterima
                    </label>
                    <input
                      type="text"
                      value={manualBtcAmount}
                      onChange={(e) => setManualBtcAmount(e.target.value)}
                      placeholder="Contoh: 0.00000668"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-[#F7931A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Catatan / Exchange (Opsional)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Order Market FLOQ / Pintu / Indodax"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-[#F7931A]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tombol Simpan 1-Tap */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#F7931A] via-amber-500 to-[#F7931A] text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#F7931A]/20 hover:brightness-105 active:scale-[0.99] transition-all"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{initialData ? "Simpan Perubahan Blok" : "Stack Blok Ini (+1 Streak 🔥)"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
