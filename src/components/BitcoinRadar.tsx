"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calculator,
  Target,
  Zap,
  ArrowRight,
} from "lucide-react";
import { MarketTicker, HalvingData } from "@/types";
import { formatIdr, formatSats, formatPercent, calculateProjections } from "@/lib/calculations";

interface BitcoinRadarProps {
  ticker: MarketTicker;
  halving: HalvingData;
  averageHabitTicket: number;
  onSelectQuickAction?: (amount: number) => void;
}

export function BitcoinRadar({
  ticker,
  halving,
  averageHabitTicket,
  onSelectQuickAction,
}: BitcoinRadarProps) {
  const [calcAmount, setCalcAmount] = useState<number>(10000);
  const [projectionHorizon, setProjectionHorizon] = useState<3 | 5>(3);

  const price = ticker.priceIdr || 1495000000;
  const calculatedSats = Math.round((calcAmount / price) * 100_000_000);

  // Dynamic DCA 10-20-30 Rule
  const change = ticker.change24h;
  let dcaMode: {
    title: string;
    subtitle: string;
    badge: string;
    color: string;
    bgColor: string;
    borderColor: string;
    recommendedAmount: number;
  };

  if (change > 2) {
    dcaMode = {
      title: "Mode Rem Pucuk",
      subtitle: "Harga sedang rally naik tajam. Jaga kebiasaan dengan nominal minimum standar.",
      badge: "Hajar Rp10.000",
      color: "text-amber-400",
      bgColor: "bg-amber-950/30",
      borderColor: "border-amber-500/40",
      recommendedAmount: 10000,
    };
  } else if (change < -3) {
    dcaMode = {
      title: "Mode Diskon Flash Sale!",
      subtitle: "Bitcoin sedang diskon merah! Kesempatan menimbun lebih banyak satoshi.",
      badge: "Hajar Rp30rb – Rp50rb!",
      color: "text-emerald-400",
      bgColor: "bg-emerald-950/30",
      borderColor: "border-emerald-500/40",
      recommendedAmount: 30000,
    };
  } else {
    dcaMode = {
      title: "Mode Habit Normal",
      subtitle: "Pasar stabil dan tenang. Lanjutkan ritme tabungan harian konsisten.",
      badge: "Hajar Rp10rb – Rp20rb",
      color: "text-sky-400",
      bgColor: "bg-sky-950/30",
      borderColor: "border-sky-500/40",
      recommendedAmount: 15000,
    };
  }

  const projections = calculateProjections(averageHabitTicket || 10000);
  const activeProjections =
    projectionHorizon === 3 ? projections.results3Y : projections.results5Y;
  const totalCapitalProjected =
    projectionHorizon === 3 ? projections.totalCapital3Y : projections.totalCapital5Y;

  return (
    <div className="space-y-3">
      {/* 1. Live Market Ticker Card */}
      <div className="p-3.5 sm:p-4 rounded-2xl glass-panel border border-slate-800 bg-[#0F172A]/70">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 shrink-0 rounded-lg bg-[#F7931A]/20 border border-[#F7931A]/40 flex items-center justify-center text-[#F7931A] text-sm font-bold">
              ₿
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-200 block truncate">
                Live BTC / IDR Ticker
              </span>
              <p className="text-[10px] text-slate-400 truncate">Sumber: {ticker.source}</p>
            </div>
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-extrabold shrink-0 whitespace-nowrap ${
              ticker.change24h >= 0
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
            }`}
          >
            {ticker.change24h >= 0 ? (
              <TrendingUp className="w-3 h-3 shrink-0" />
            ) : (
              <TrendingDown className="w-3 h-3 shrink-0" />
            )}
            <span>{formatPercent(ticker.change24h)}</span>
          </div>
        </div>

        <div className="mt-2.5 text-xl sm:text-2xl font-black text-slate-100 tracking-tight truncate">
          {formatIdr(ticker.priceIdr)}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
          <div className="truncate">
            <span>High 24H: </span>
            <span className="font-semibold text-slate-200">{formatIdr(ticker.high24h)}</span>
          </div>
          <div className="text-right truncate">
            <span>Low 24H: </span>
            <span className="font-semibold text-slate-200">{formatIdr(ticker.low24h)}</span>
          </div>
        </div>
      </div>

      {/* 2. Asisten Strategi Dynamic DCA (Rumus 10-20-30) */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border ${dcaMode.borderColor} ${dcaMode.bgColor}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Zap className={`w-3.5 h-3.5 shrink-0 ${dcaMode.color}`} />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 truncate">
              Dynamic DCA (10-20-30)
            </span>
          </div>
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${dcaMode.borderColor} ${dcaMode.color}`}
          >
            {dcaMode.badge}
          </span>
        </div>

        <h3 className={`text-sm sm:text-base font-extrabold mt-2 ${dcaMode.color}`}>
          {dcaMode.title}
        </h3>
        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{dcaMode.subtitle}</p>

        {onSelectQuickAction && (
          <button
            onClick={() => onSelectQuickAction(dcaMode.recommendedAmount)}
            className="mt-2.5 w-full py-2 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Eksekusi Rekomendasi ({formatIdr(dcaMode.recommendedAmount)})</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        )}
      </div>

      {/* 3. Kalkulator Satoshi Instan */}
      <div className="p-3.5 sm:p-4 rounded-2xl glass-panel border border-slate-800 bg-[#0F172A]/70">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Calculator className="w-3.5 h-3.5 text-[#F7931A]" />
          <span className="text-xs font-bold text-slate-200">Kalkulator Satoshi Instan</span>
        </div>

        <div className="space-y-2.5">
          <div className="grid grid-cols-4 gap-1.5">
            {[10000, 20000, 50000, 100000].map((val) => (
              <button
                key={val}
                onClick={() => setCalcAmount(val)}
                className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-colors truncate ${
                  calcAmount === val
                    ? "bg-[#F7931A] text-black"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {formatIdr(val)}
              </button>
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[9px] text-slate-400 block uppercase font-bold truncate">
                {formatIdr(calcAmount)} setara
              </span>
              <span className="text-base sm:text-lg font-black text-[#F7931A] truncate block">
                +{formatSats(calculatedSats)}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono shrink-0">
              {(calcAmount / price).toFixed(8)} BTC
            </span>
          </div>
        </div>
      </div>

      {/* 4. Halving ke-5 Countdown & Peta Siklus 4 Tahunan */}
      <div className="p-3.5 sm:p-4 rounded-2xl glass-panel border border-indigo-500/20 bg-gradient-to-br from-[#10172B] to-[#0A0E1A]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Target className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-xs font-bold text-slate-200 truncate">
              Halving ke-5 Radar
            </span>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shrink-0 whitespace-nowrap">
            Blok 1.050.000
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2.5">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 min-w-0">
            <span className="text-[9px] text-slate-400 block truncate">Blok Saat Ini</span>
            <span className="text-sm sm:text-base font-black text-slate-100 font-mono truncate block">
              #{halving.currentBlock.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 min-w-0">
            <span className="text-[9px] text-slate-400 block truncate">Sisa Blok</span>
            <span className="text-sm sm:text-base font-black text-indigo-400 font-mono truncate block">
              {halving.remainingBlocks.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Progress Bar Siklus */}
        <div className="mt-2.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] gap-2">
            <span className="text-slate-400 truncate">
              Est: <strong className="text-slate-200">{halving.estimatedDate}</strong> (
              {halving.daysRemaining}h)
            </span>
            <span className="text-indigo-400 font-bold shrink-0">{halving.progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-[#F7931A] rounded-full transition-all duration-500"
              style={{ width: `${halving.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Peta Siklus 4 Tahunan */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80">
          <div className="grid grid-cols-3 gap-1.5 text-center text-[9px]">
            <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300">
              <span className="font-extrabold block">2026–2027</span>
              <span className="truncate block">Akumulasi</span>
            </div>
            <div className="p-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/40 text-indigo-300">
              <span className="font-extrabold block">2028</span>
              <span className="truncate block">Halving 5</span>
            </div>
            <div className="p-1.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300">
              <span className="font-extrabold block">2029</span>
              <span className="truncate block">Take Profit</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Simulator Proyeksi 3 Tahun & 5 Tahun Dinamis */}
      <div className="p-3.5 sm:p-4 rounded-2xl glass-panel border border-slate-800 bg-[#0F172A]/70">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-200 block truncate">
              Simulator Proyeksi DCA
            </span>
            <p className="text-[10px] text-slate-400 truncate">
              Tiket: {formatIdr(averageHabitTicket || 10000)}/hr (
              {formatIdr(projections.monthlyContribution)}/bln)
            </p>
          </div>

          <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 shrink-0">
            <button
              onClick={() => setProjectionHorizon(3)}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                projectionHorizon === 3 ? "bg-[#F7931A] text-black" : "text-slate-400 hover:text-white"
              }`}
            >
              3 Thn
            </button>
            <button
              onClick={() => setProjectionHorizon(5)}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                projectionHorizon === 5 ? "bg-[#F7931A] text-black" : "text-slate-400 hover:text-white"
              }`}
            >
              5 Thn
            </button>
          </div>
        </div>

        <div className="mt-2 text-[10px] text-slate-400">
          Modal Disetor {projectionHorizon} Tahun:{" "}
          <strong className="text-slate-200">{formatIdr(totalCapitalProjected)}</strong>
        </div>

        <div className="mt-2.5 space-y-1.5">
          {activeProjections.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2 text-xs"
            >
              <div className="min-w-0">
                <span className="font-semibold block text-slate-200 text-[11px] truncate">
                  {item.name}
                </span>
                <span className="text-[10px] text-slate-400 truncate block">
                  Untung:{" "}
                  <strong className={item.profit >= 0 ? "text-emerald-400" : "text-slate-300"}>
                    +{formatIdr(item.profit)}
                  </strong>
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="font-black text-xs sm:text-sm" style={{ color: item.color }}>
                  {formatIdr(item.futureValue)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
