"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Lock,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Info,
} from "lucide-react";
import { formatIdr, formatPercent } from "@/lib/calculations";

interface TakeProfitPlannerProps {
  currentPrice?: number;
  totalBtc?: number;
  totalCapitalDeployed?: number;
  averageBuyPrice?: number;
  floatingPnlPercent?: number;
}

export function TakeProfitPlanner({
  currentPrice: propPrice,
  totalBtc: propBtc,
  totalCapitalDeployed: propCapital,
  averageBuyPrice: propAvgPrice,
  floatingPnlPercent: propPnlPercent,
}: TakeProfitPlannerProps) {
  // Mock data fallback jika props tidak tersedia / belum ada data riil
  const currentPrice = propPrice && propPrice > 0 ? propPrice : 1438000000; // ~Rp 1,438 Miliar
  const totalBtc = propBtc && propBtc > 0 ? propBtc : 0.0152485; // ~1.52 Juta Sats
  const totalCapitalDeployed =
    propCapital && propCapital > 0 ? propCapital : 18500000; // ~Rp 18.5 Juta
  const averageBuyPrice =
    propAvgPrice && propAvgPrice > 0
      ? propAvgPrice
      : Math.round(totalCapitalDeployed / totalBtc);

  // Floating PnL % calculation
  const calculatedPnlPercent = useMemo(() => {
    if (propPnlPercent !== undefined) return propPnlPercent;
    if (totalCapitalDeployed <= 0) return 0;
    const currentVal = totalBtc * currentPrice;
    return ((currentVal - totalCapitalDeployed) / totalCapitalDeployed) * 100;
  }, [propPnlPercent, totalCapitalDeployed, totalBtc, currentPrice]);

  // 1. Time-Based Exit Countdown (Menuju Q3 2029 - 1 Juli 2029)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
  });

  useEffect(() => {
    const targetDate = new Date("2029-07-01T00:00:00Z").getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = Math.max(0, targetDate - now);

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft({ days, hours, minutes });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  // 2. Target 1: Return of Capital (RoC)
  // Target RoC tercapai saat floating PnL >= +100% (harga naik 2x lipat dari modal beli)
  const rocProgress = Math.min(100, Math.max(0, (calculatedPnlPercent / 100) * 100));
  const isRocReached = calculatedPnlPercent >= 100;
  // BTC yang dijual untuk mengembalikan 100% modal awal
  const btcToSellForCapital = totalCapitalDeployed > 0 && currentPrice > 0
    ? Number((totalCapitalDeployed / currentPrice).toFixed(8))
    : 0;

  // 3. Moonbag (15% dari total kepemilikan BTC)
  const moonbagBtc = Number((totalBtc * 0.15).toFixed(8));
  const moonbagValueIdr = Math.round(moonbagBtc * currentPrice);

  // 4. Target 2: Scale-Out Milestones (Vertical Stepper)
  const scaleOutSteps = useMemo(() => {
    // Alokasi jual bertahap:
    // Sisa setelah RoC & Moonbag dialokasikan ke milestone harga psikologis
    return [
      {
        id: "step-1",
        targetPrice: 1500000000, // Rp 1.5M
        actionText: "Jual 15%",
        percentToSell: 15,
        btcAmount: Number((totalBtc * 0.15).toFixed(8)),
        rationale: "Amankan profit awal saat menembus All-Time High siklus sebelumnya.",
      },
      {
        id: "step-2",
        targetPrice: 2000000000, // Rp 2.0M
        actionText: "Jual 15%",
        percentToSell: 15,
        btcAmount: Number((totalBtc * 0.15).toFixed(8)),
        rationale: "Level psikologis $120k-$130k USD. Amankan likuiditas untuk aset riil.",
      },
      {
        id: "step-3",
        targetPrice: 2500000000, // Rp 2.5M
        actionText: "Jual Sisa Alokasi TP",
        percentToSell: 55, // 100% - 15% (step 1) - 15% (step 2) - 15% (moonbag) = 55%
        btcAmount: Number((totalBtc * 0.55).toFixed(8)),
        rationale: "Puncak euforia retail Q3/Q4 2029. Sisakan hanya 15% Moonbag abadi.",
      },
    ];
  }, [totalBtc]);

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-28 text-slate-100 select-none">
      {/* 1. Time-Based Exit Countdown (Mobile Hero Card) */}
      <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-[#10172B] to-[#1E1B4B] border border-indigo-500/25 shadow-xl shadow-indigo-950/40">
        {/* Glow ambient background */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#F7931A]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header of Hero Card */}
        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-indigo-300">
              Siklus 4 Tahunan
            </span>
          </div>

          {/* Badge Status Siklus Saat Ini */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold whitespace-nowrap shadow-sm">
            <Sparkles className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            Accumulation Phase
          </span>
        </div>

        {/* Title & Target Year */}
        <div className="mt-3 relative z-10">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Target Exit Q3 2029
            </h2>
            <span className="text-xs font-bold text-amber-400 font-mono">
              (Juli 2029)
            </span>
          </div>
          <p className="text-xs text-slate-300/80 mt-0.5 leading-relaxed">
            Estimasi jendela puncak euforia *Bull Run* setelah Halving ke-5 (2028).
          </p>
        </div>

        {/* Countdown Digits Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 relative z-10">
          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-indigo-500/20 text-center">
            <span className="text-2xl sm:text-3xl font-black text-slate-100 font-mono tracking-tight block">
              {timeLeft.days}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
              Hari
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-indigo-500/20 text-center">
            <span className="text-2xl sm:text-3xl font-black text-slate-100 font-mono tracking-tight block">
              {timeLeft.hours}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
              Jam
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-indigo-500/20 text-center">
            <span className="text-2xl sm:text-3xl font-black text-slate-100 font-mono tracking-tight block">
              {timeLeft.minutes}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
              Menit
            </span>
          </div>
        </div>
      </div>

      {/* 2. Target 1: Return of Capital (RoC) */}
      <div
        className={`rounded-3xl p-4 sm:p-5 border transition-all duration-300 ${
          isRocReached
            ? "bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border-emerald-500/50 shadow-lg shadow-emerald-950/30"
            : "bg-slate-900/90 border-slate-800 shadow-md"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-9 h-9 shrink-0 rounded-2xl flex items-center justify-center font-bold ${
                isRocReached
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">
                Target 1: Return of Capital (RoC)
              </span>
              <h3 className="text-sm font-extrabold text-white truncate">
                Tarik Modal Awal 100%
              </h3>
            </div>
          </div>

          <span
            className={`text-xs font-black px-2.5 py-1 rounded-full whitespace-nowrap border shrink-0 ${
              isRocReached
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-slate-800 text-slate-300 border-slate-700"
            }`}
          >
            {formatPercent(calculatedPnlPercent)} / +100%
          </span>
        </div>

        {/* Progress Bar Tebal (High-contrast untuk outdoor mobile use) */}
        <div className="mt-3.5 space-y-1.5">
          <div className="w-full h-3.5 rounded-full bg-slate-950 p-0.5 border border-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isRocReached
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50"
                  : "bg-gradient-to-r from-amber-500 to-[#F7931A]"
              }`}
              style={{ width: `${Math.max(5, rocProgress)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold px-0.5">
            <span>Modal: {formatIdr(totalCapitalDeployed)}</span>
            <span>Target: 2x Lipat (+100%)</span>
          </div>
        </div>

        {/* Conditional Alert State */}
        {isRocReached ? (
          <div className="mt-3.5 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block text-emerald-300 font-extrabold text-xs">
                Target 1 Reached: Jual {btcToSellForCapital} BTC
              </strong>
              <span>
                Tarik modalmu sekarang! Sisa portofolio berstatus{" "}
                <span className="font-bold underline decoration-emerald-400 underline-offset-2">
                  Risk-Free (Modal Sudah Kembali 100%)
                </span>
                .
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-3.5 p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between gap-2">
            <span className="text-slate-400">Harga BTC untuk RoC (+100%):</span>
            <span className="font-extrabold text-amber-400 font-mono text-xs">
              {formatIdr(averageBuyPrice * 2)}
            </span>
          </div>
        )}
      </div>

      {/* 3. Target 2: Scale-Out Milestones (Vertical Stepper Timeline) */}
      <div className="rounded-3xl p-4 sm:p-5 bg-slate-900/90 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">
              Target 2: Scale-Out Plan
            </span>
            <h3 className="text-sm font-extrabold text-white">
              Tangga Exit Bertahap di Puncak
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
            Sisa 85% Alokasi TP
          </span>
        </div>

        {/* Stepper Container */}
        <div className="relative pl-5 space-y-3.5 before:content-[''] before:absolute before:left-[9px] before:top-2 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-amber-500 before:to-emerald-500">
          {scaleOutSteps.map((step, idx) => {
            const isPassed = currentPrice >= step.targetPrice;
            return (
              <div key={step.id} className="relative group">
                {/* Stepper Dot */}
                <div
                  className={`absolute -left-[20px] top-3.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isPassed
                      ? "bg-emerald-500 border-white ring-3 ring-emerald-500/20"
                      : "bg-slate-900 border-indigo-400/80 ring-2 ring-slate-800"
                  }`}
                >
                  {isPassed ? (
                    <div className="w-1 h-1 rounded-full bg-white" />
                  ) : (
                    <div className="w-1 h-1 rounded-full bg-indigo-400" />
                  )}
                </div>

                {/* Step Card (Comfortable Touch Target & Auto-Wrapping Layout) */}
                <div
                  className={`p-3 rounded-2xl border transition-all ${
                    isPassed
                      ? "bg-emerald-950/20 border-emerald-500/40 text-slate-200"
                      : "bg-slate-950/70 border-slate-800/90 hover:border-slate-700 text-slate-200"
                  }`}
                >
                  {/* Row 1: Target Header & Action Button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="px-1.5 py-0.5 rounded bg-slate-800/90 border border-slate-700/60 text-slate-300 font-mono text-[9px] uppercase font-bold shrink-0">
                        Step 0{idx + 1}
                      </div>
                      <span className="text-xs font-bold text-white tracking-tight truncate">
                        {formatIdr(step.targetPrice)}
                      </span>
                    </div>

                    {/* Action Button: Compact, No Overflow */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-black text-[10px] whitespace-nowrap shadow-sm min-h-[32px] ${
                          isPassed
                            ? "bg-emerald-500 text-black shadow-emerald-500/20"
                            : "bg-gradient-to-r from-[#F7931A] to-amber-500 text-black shadow-[#F7931A]/20"
                        }`}
                      >
                        <span>{step.actionText}</span>
                        <ArrowUpRight className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Rationale & Equivalent BTC Info */}
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-start justify-between gap-2 text-[10px] text-slate-400 leading-relaxed">
                    <p className="flex-1 pr-1 text-slate-300/80">
                      {step.rationale}
                    </p>
                    <span className="font-mono text-amber-400/90 font-semibold shrink-0 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      ≈ {step.btcAmount} ₿
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. The Moonbag Indicator (Alert Card Anti-FOMO) */}
      <div className="rounded-3xl p-3.5 sm:p-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/35 shadow-lg shadow-amber-500/10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-[#F7931A] to-amber-500 flex items-center justify-center text-black shadow-md shadow-[#F7931A]/20">
            <Lock className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-400">
                Golden Rule Siklus
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/25">
                Never Sell 100%
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-black text-white mt-0.5 truncate">
              🔒 15% Moonbag ({moonbagBtc} BTC)
            </h4>
            <p className="text-[10px] sm:text-[11px] text-slate-300/90 mt-0.5 leading-snug">
              Simpan abadi untuk siklus Halving ke-6 (2032+). Jangan pernah dijual habis!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default TakeProfitPlanner;

