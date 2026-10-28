"use client";

import React, { useState } from "react";
import {
  Compass,
  TrendingUp,
  TrendingDown,
  Clock,
  Calculator,
  Target,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldAlert,
  Flame,
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
  // Kalkulator Satoshi Instan State
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
      subtitle: "Harga sedang rally naik tajam. Tetap jaga kebiasaan dengan nominal minimum standar.",
      badge: "Cukup Hajar Rp10.000",
      color: "text-amber-400",
      bgColor: "bg-amber-950/30",
      borderColor: "border-amber-500/40",
      recommendedAmount: 10000,
    };
  } else if (change < -3) {
    dcaMode = {
      title: "Mode Diskon Flash Sale!",
      subtitle: "Bitcoin sedang diskon merah! Kesempatan menimbun lebih banyak satoshi per rupiah.",
      badge: "Hajar Rp30.000 – Rp50.000!",
      color: "text-emerald-400",
      bgColor: "bg-emerald-950/30",
      borderColor: "border-emerald-500/40",
      recommendedAmount: 30000,
    };
  } else {
    dcaMode = {
      title: "Mode Habit Normal",
      subtitle: "Pasar stabil dan tenang. Lanjutkan ritme tabungan harian konsisten.",
      badge: "Hajar Rp10.000 – Rp20.000",
      color: "text-sky-400",
      bgColor: "bg-sky-950/30",
      borderColor: "border-sky-500/40",
      recommendedAmount: 15000,
    };
  }

  // Hitung proyeksi investasi horizon 3 & 5 tahun
  const projections = calculateProjections(averageHabitTicket || 10000);
  const activeProjections =
    projectionHorizon === 3 ? projections.results3Y : projections.results5Y;
  const totalCapitalProjected =
    projectionHorizon === 3 ? projections.totalCapital3Y : projections.totalCapital5Y;

  return (
    <div className="space-y-4">
      {/* 1. Live Market Ticker Card */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 bg-[#0F172A]/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F7931A]/20 border border-[#F7931A]/40 flex items-center justify-center text-[#F7931A]">
              ₿
            </div>
            <div>
              <span className="text-xs font-bold text-slate-300">Live BTC / IDR Ticker</span>
              <p className="text-[10px] text-slate-400">Sumber: {ticker.source}</p>
            </div>
          </div>
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
              ticker.change24h >= 0
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
            }`}
          >
            {ticker.change24h >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>{formatPercent(ticker.change24h)} 24h</span>
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-2xl font-black text-slate-100 tracking-tight">
            {formatIdr(ticker.priceIdr)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
          <div>
            <span>Tertinggi 24H: </span>
            <span className="font-semibold text-slate-200">{formatIdr(ticker.high24h)}</span>
          </div>
          <div className="text-right">
            <span>Terendah 24H: </span>
            <span className="font-semibold text-slate-200">{formatIdr(ticker.low24h)}</span>
          </div>
        </div>
      </div>

      {/* 2. Asisten Strategi Dynamic DCA (Rumus 10-20-30) */}
      <div className={`p-4 rounded-2xl border ${dcaMode.borderColor} ${dcaMode.bgColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${dcaMode.color}`} />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
              Asisten Dynamic DCA (Rumus 10-20-30)
            </span>
          </div>
          <span
            className={`text-xs font-black px-2 py-0.5 rounded-full border ${dcaMode.borderColor} ${dcaMode.color}`}
          >
            {dcaMode.badge}
          </span>
        </div>

        <h3 className={`text-base font-extrabold mt-2 ${dcaMode.color}`}>{dcaMode.title}</h3>
        <p className="text-xs text-slate-300 mt-1">{dcaMode.subtitle}</p>

        {onSelectQuickAction && (
          <button
            onClick={() => onSelectQuickAction(dcaMode.recommendedAmount)}
            className="mt-3 w-full py-2.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Eksekusi Rekomendasi ({formatIdr(dcaMode.recommendedAmount)})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. Kalkulator Satoshi Instan */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 bg-[#0F172A]/70">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="w-4 h-4 text-[#F7931A]" />
          <span className="text-xs font-bold text-slate-200">Kalkulator Satoshi Instan</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Pilih Nominal Rupiah:</span>
            <div className="flex gap-1.5">
              {[10000, 20000, 50000, 100000].map((val) => (
                <button
                  key={val}
                  onClick={() => setCalcAmount(val)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    calcAmount === val
                      ? "bg-[#F7931A] text-black"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {formatIdr(val)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                {formatIdr(calcAmount)} hari ini setara
              </span>
              <span className="text-xl font-black text-[#F7931A]">
                +{formatSats(calculatedSats)}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {(calcAmount / price).toFixed(8)} BTC
            </span>
          </div>
        </div>
      </div>

      {/* 4. Halving ke-5 Countdown & Peta Siklus 4 Tahunan */}
      <div className="p-4 rounded-2xl glass-panel border border-indigo-500/20 bg-gradient-to-br from-[#10172B] to-[#0A0E1A]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-200">Halving ke-5 Bitcoin Radar</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            Target Blok 1.050.000
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Tinggi Blok Saat Ini</span>
            <span className="text-base font-black text-slate-100 font-mono">
              #{halving.currentBlock.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Sisa Blok Menuju Halving</span>
            <span className="text-base font-black text-indigo-400 font-mono">
              {halving.remainingBlocks.toLocaleString("id-ID")} Blok
            </span>
          </div>
        </div>

        {/* Progress Bar Siklus */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              Estimasi: <strong className="text-slate-200">{halving.estimatedDate}</strong> (
              {halving.daysRemaining} hari lagi)
            </span>
            <span className="text-indigo-400 font-bold">{halving.progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-[#F7931A] rounded-full transition-all duration-500"
              style={{ width: `${halving.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Peta Siklus 4 Tahunan */}
        <div className="mt-3 pt-3 border-t border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-2">
            Peta Siklus 4 Tahunan Bitcoin:
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300">
              <span className="font-extrabold block">2026–2027</span>
              <span>Fase Akumulasi DCA (Sekarang)</span>
            </div>
            <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/40 text-indigo-300">
              <span className="font-extrabold block">2028</span>
              <span>Pre-Halving & Halving</span>
            </div>
            <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300">
              <span className="font-extrabold block">2029</span>
              <span>Zona Take Profit Bull Run</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Simulator Proyeksi 3 Tahun & 5 Tahun Dinamis */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 bg-[#0F172A]/70">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-200 block">
              Simulator Proyeksi Disiplin DCA
            </span>
            <p className="text-[10px] text-slate-400">
              Berdasarkan tiket rata-ratamu ({formatIdr(averageHabitTicket || 10000)}/hari ≈{" "}
              {formatIdr(projections.monthlyContribution)}/bln)
            </p>
          </div>

          {/* Toggle Horizon 3Y vs 5Y */}
          <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            <button
              onClick={() => setProjectionHorizon(3)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                projectionHorizon === 3 ? "bg-[#F7931A] text-black" : "text-slate-400 hover:text-white"
              }`}
            >
              3 Tahun
            </button>
            <button
              onClick={() => setProjectionHorizon(5)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                projectionHorizon === 5 ? "bg-[#F7931A] text-black" : "text-slate-400 hover:text-white"
              }`}
            >
              5 Tahun
            </button>
          </div>
        </div>

        <div className="mt-2 text-[11px] text-slate-400">
          Total Modal Disetor Selama {projectionHorizon} Tahun:{" "}
          <strong className="text-slate-200">{formatIdr(totalCapitalProjected)}</strong>
        </div>

        {/* Tabel Skenario */}
        <div className="mt-3 space-y-2">
          {activeProjections.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-semibold block text-slate-200">{item.name}</span>
                <span className="text-[10px] text-slate-400">
                  Estimasi Untung:{" "}
                  <strong className={item.profit >= 0 ? "text-emerald-400" : "text-slate-300"}>
                    +{formatIdr(item.profit)}
                  </strong>
                </span>
              </div>
              <div className="text-right">
                <span className="font-black text-sm" style={{ color: item.color }}>
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
