"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calculator,
  TrendingUp,
  Sparkles,
  Flame,
  Coins,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  Info,
  RotateCcw,
  Layers,
  ChevronRight,
} from "lucide-react";

/**
 * Utilitas pemformat mata uang Rupiah standar Indonesia
 */
export function formatIdr(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("IDR", "Rp")
    .trim();
}

/**
 * Format angka dengan titik pemisah ribuan untuk input teks (contoh: 25.000)
 */
function formatNumberWithDots(val: number): string {
  if (isNaN(val) || val <= 0) return "";
  return new Intl.NumberFormat("id-ID").format(val);
}

/**
 * Parsing string berformat titik menjadi angka murni
 */
function parseDotsToNumber(str: string): number {
  const clean = str.replace(/[^\d]/g, "");
  return clean ? parseInt(clean, 10) : 0;
}

interface ScenarioConfig {
  id: "conservative" | "moderate" | "aggressive";
  name: string;
  apy: number; // APY dalam desimal, misal 0.17
  tag: string;
  description: string;
  icon: React.ElementType;
  theme: {
    border: string;
    bgGradient: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    textHighlight: string;
    profitText: string;
    progressFill: string;
  };
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: "conservative",
    name: "Konservatif",
    apy: 0.17, // 17% APY
    tag: "17% APY",
    description: "Asumsi pertumbuhan Bitcoin stabil & matang (historis terendah siklus).",
    icon: ShieldCheck,
    theme: {
      border: "border-cyan-500/30 hover:border-cyan-500/50",
      bgGradient: "from-slate-900 via-slate-900 to-cyan-950/20",
      badgeBg: "bg-cyan-500/10",
      badgeText: "text-cyan-400",
      badgeBorder: "border-cyan-500/30",
      textHighlight: "text-cyan-300",
      profitText: "text-cyan-400",
      progressFill: "bg-cyan-500",
    },
  },
  {
    id: "moderate",
    name: "Moderat",
    apy: 0.25, // 25% APY
    tag: "25% APY • Base Case",
    description: "Rata-rata ekspektasi realistis siklus 4 tahunan Bitcoin (Halving).",
    icon: Sparkles,
    theme: {
      border: "border-emerald-500/40 hover:border-emerald-500/60 shadow-lg shadow-emerald-950/30",
      bgGradient: "from-slate-900 via-slate-900 to-emerald-950/25",
      badgeBg: "bg-emerald-500/15",
      badgeText: "text-emerald-400",
      badgeBorder: "border-emerald-500/35",
      textHighlight: "text-emerald-300",
      profitText: "text-emerald-400",
      progressFill: "bg-emerald-500",
    },
  },
  {
    id: "aggressive",
    name: "Agresif",
    apy: 0.5, // 50% APY
    tag: "50% APY • Bull Run",
    description: "Potensi fase super-cycle adopsi global & likuiditas moneter institusi.",
    icon: Flame,
    theme: {
      border: "border-orange-500/40 hover:border-orange-500/60",
      bgGradient: "from-slate-900 via-slate-900 to-orange-950/25",
      badgeBg: "bg-orange-500/15",
      badgeText: "text-orange-400",
      badgeBorder: "border-orange-500/35",
      textHighlight: "text-orange-300",
      profitText: "text-orange-400",
      progressFill: "bg-gradient-to-r from-amber-500 to-orange-500",
    },
  },
];

// Presets cepat untuk input harian
const QUICK_DAILY_AMOUNTS = [10000, 25000, 50000, 100000, 200000];

// Presets cepat untuk jangka waktu tahun
const QUICK_YEARS = [1, 3, 5, 10];

interface DCAProjectionCalculatorProps {
  initialDailyDca?: number;
  currentBtcPrice?: number;
}

export function DCAProjectionCalculator({
  initialDailyDca,
  currentBtcPrice,
}: DCAProjectionCalculatorProps = {}) {
  // State Input Utama
  const defaultInitial = initialDailyDca && initialDailyDca > 0 ? initialDailyDca : 25000;
  const [dailyDca, setDailyDca] = useState<number>(defaultInitial);
  const [dailyInputText, setDailyInputText] = useState<string>(formatNumberWithDots(defaultInitial));

  const [years, setYears] = useState<number>(5); // Default 5 Tahun
  const [yearsInputText, setYearsInputText] = useState<string>("5");

  // Dynamic slider upper bound jika user mengetik angka lebih besar dari default slider 100k
  const sliderMaxDca = useMemo(() => {
    return Math.max(100000, Math.ceil(dailyDca / 25000) * 25000);
  }, [dailyDca]);

  // Handler sinkronisasi input text harian
  const handleDailyTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseDotsToNumber(rawValue);

    setDailyInputText(numericValue > 0 ? formatNumberWithDots(numericValue) : rawValue);
    setDailyDca(numericValue);
  };

  // Handler slider harian
  const handleDailySliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setDailyDca(val);
    setDailyInputText(formatNumberWithDots(val));
  };

  // Handler quick chip harian
  const handleQuickDailySelect = (val: number) => {
    setDailyDca(val);
    setDailyInputText(formatNumberWithDots(val));
  };

  // Handler sinkronisasi input text tahun
  const handleYearsTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^\d]/g, "");
    if (!rawVal) {
      setYearsInputText("");
      setYears(0);
      return;
    }
    const num = Math.min(30, Math.max(1, parseInt(rawVal, 10)));
    setYearsInputText(String(num));
    setYears(num);
  };

  // Handler slider tahun
  const handleYearsSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setYears(val);
    setYearsInputText(String(val));
  };

  // Handler quick chip tahun
  const handleQuickYearsSelect = (val: number) => {
    setYears(val);
    setYearsInputText(String(val));
  };

  // Reset ke nilai default
  const handleReset = () => {
    setDailyDca(25000);
    setDailyInputText("25.000");
    setYears(5);
    setYearsInputText("5");
  };

  // Perhitungan Keuangan & Compound Interest (Real-time recalculation)
  const calculationResults = useMemo(() => {
    const safeDaily = Math.max(0, dailyDca || 0);
    const safeYears = Math.max(0, years || 0);

    // Konversi DCA harian ke setoran bulanan (Harian x 30)
    const monthlyDeposit = safeDaily * 30;
    const totalMonths = safeYears * 12;

    // Total Modal Disetor (Principal) = Monthly Deposit x Total Months
    const totalPrincipal = monthlyDeposit * totalMonths;

    // Kalkulasi Future Value Ordinary Annuity per Skenario
    const scenarios = SCENARIOS.map((scenario) => {
      if (totalMonths <= 0 || monthlyDeposit <= 0) {
        return {
          ...scenario,
          futureValue: 0,
          netProfit: 0,
          roiPercent: 0,
          multiplier: 1,
        };
      }

      // Suku bunga bulanan (r = APY / 12)
      const monthlyRate = scenario.apy / 12;

      // Rumus Future Value Annuity: FV = PMT * [ ((1 + r)^n - 1) / r ]
      const compoundingFactor = Math.pow(1 + monthlyRate, totalMonths);
      const futureValue = Math.round(
        monthlyDeposit * ((compoundingFactor - 1) / monthlyRate)
      );

      const netProfit = Math.max(0, futureValue - totalPrincipal);
      const roiPercent =
        totalPrincipal > 0 ? (netProfit / totalPrincipal) * 100 : 0;
      const multiplier =
        totalPrincipal > 0 ? Number((futureValue / totalPrincipal).toFixed(1)) : 1;

      return {
        ...scenario,
        futureValue,
        netProfit,
        roiPercent,
        multiplier,
      };
    });

    return {
      monthlyDeposit,
      totalMonths,
      totalPrincipal,
      scenarios,
    };
  }, [dailyDca, years]);

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-20 text-slate-100 select-none">
      {/* Header & Hero Simulator */}
      <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-[#0F172A] border border-slate-800 shadow-xl">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#F7931A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#F7931A]/15 border border-[#F7931A]/30 flex items-center justify-center text-[#F7931A] shadow-inner">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Kalkulator Proyeksi DCA
              </h1>
              <p className="text-[11px] text-slate-400">
                Simulasi Compound Interest Nabung Bitcoin
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            title="Reset ke default"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 border border-slate-750 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bagian Input Parameter Interaktif */}
      <div className="rounded-3xl p-5 bg-slate-900/90 border border-slate-800 shadow-lg space-y-5">
        {/* 1. Parameter Nominal DCA Harian */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-[#F7931A]" />
              Nominal DCA Harian
            </label>
            <span className="text-[11px] font-mono font-bold text-[#F7931A] px-2 py-0.5 rounded-full bg-[#F7931A]/10 border border-[#F7931A]/20">
              {formatIdr(dailyDca)} / hari
            </span>
          </div>

          {/* Manual Text Input Field */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={dailyInputText}
              onChange={handleDailyTextChange}
              placeholder="Contoh: 25.000"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-750 focus:border-[#F7931A] focus:ring-1 focus:ring-[#F7931A]/50 text-white font-mono font-bold text-sm outline-none transition-all"
            />
          </div>

          {/* Slider Range */}
          <div className="space-y-1 pt-1">
            <input
              type="range"
              min={10000}
              max={sliderMaxDca}
              step={5000}
              value={dailyDca || 10000}
              onChange={handleDailySliderChange}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#F7931A] touch-none"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Rp 10.000</span>
              <span>Rp 50.000</span>
              <span>{formatIdr(sliderMaxDca)}</span>
            </div>
          </div>

          {/* Quick Nominal Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {QUICK_DAILY_AMOUNTS.map((amt) => {
              const active = dailyDca === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickDailySelect(amt)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold font-mono transition-all shrink-0 border active:scale-95 ${
                    active
                      ? "bg-[#F7931A] text-slate-950 border-[#F7931A] shadow-sm shadow-[#F7931A]/30"
                      : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700/60"
                  }`}
                >
                  {formatIdr(amt)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Separator Garis Halus */}
        <div className="h-px bg-slate-800/80" />

        {/* 2. Parameter Horizon Waktu (Tahun) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Horizon Waktu (Tahun)
            </label>
            <span className="text-[11px] font-mono font-bold text-indigo-300 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              {years} Tahun ({years * 12} Bulan)
            </span>
          </div>

          {/* Manual Text Input Field untuk Tahun */}
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={yearsInputText}
              onChange={handleYearsTextChange}
              placeholder="1 - 15"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-750 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 text-white font-mono font-bold text-sm outline-none transition-all pr-16"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
              Tahun
            </span>
          </div>

          {/* Slider Range Tahun */}
          <div className="space-y-1 pt-1">
            <input
              type="range"
              min={1}
              max={15}
              step={1}
              value={years || 1}
              onChange={handleYearsSliderChange}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400 touch-none"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1 Thn</span>
              <span>5 Thn</span>
              <span>10 Thn</span>
              <span>15 Thn</span>
            </div>
          </div>

          {/* Quick Years Chips */}
          <div className="flex items-center gap-1.5">
            {QUICK_YEARS.map((yr) => {
              const active = years === yr;
              return (
                <button
                  key={yr}
                  type="button"
                  onClick={() => handleQuickYearsSelect(yr)}
                  className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold font-mono transition-all border active:scale-95 text-center ${
                    active
                      ? "bg-indigo-500 text-white border-indigo-400 shadow-sm shadow-indigo-500/30"
                      : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700/60"
                  }`}
                >
                  {yr} Tahun
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Card: Total Modal Disetor (Principal Benchmark) */}
      <div className="rounded-2xl p-4 bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Total Modal Disetor ({years} Thn)</span>
          </div>
          <div className="text-lg font-black font-mono text-white tracking-tight">
            {formatIdr(calculationResults.totalPrincipal)}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">Setoran Rutin</span>
          <span className="text-xs font-mono font-bold text-slate-300">
            {formatIdr(calculationResults.monthlyDeposit)} / bln
          </span>
        </div>
      </div>

      {/* 3 Skenario Proyeksi Kartu (Tersusun Vertikal untuk Mobile PWA) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-extrabold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#F7931A]" />
            Hasil Proyeksi Nilai Masa Depan
          </h2>
          <span className="text-[10px] text-slate-400 font-medium">
            Compound Bulanan
          </span>
        </div>

        {calculationResults.scenarios.map((scenario) => {
          const Icon = scenario.icon;
          const { theme } = scenario;

          return (
            <div
              key={scenario.id}
              className={`rounded-3xl p-5 bg-gradient-to-br ${theme.bgGradient} border ${theme.border} transition-all relative overflow-hidden`}
            >
              {/* Top Row: Skenario Badge & APY */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg ${theme.badgeBg} border ${theme.badgeBorder} flex items-center justify-center shrink-0`}
                  >
                    <Icon className={`w-4 h-4 ${theme.badgeText}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white leading-none">
                      Skenario {scenario.name}
                    </h3>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold font-mono border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                >
                  {scenario.tag}
                </span>
              </div>

              {/* Estimasi Nilai Akhir (Highlight Besar) */}
              <div className="my-2.5">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                  Estimasi Nilai Akhir Portofolio:
                </span>
                <div
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${theme.textHighlight}`}
                >
                  {formatIdr(scenario.futureValue)}
                </div>
              </div>

              {/* Total Keuntungan Bersih & ROI */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    Keuntungan Bersih
                  </span>
                  <div
                    className={`text-sm font-black font-mono flex items-center gap-1 ${theme.profitText}`}
                  >
                    <span>+{formatIdr(scenario.netProfit)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">
                    Pertumbuhan
                  </span>
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-xs font-mono font-bold text-slate-200">
                      +{scenario.roiPercent.toFixed(0)}%
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                      {scenario.multiplier}x Modal
                    </span>
                  </div>
                </div>
              </div>

              {/* Deskripsi Singkat Konteks Skenario */}
              <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                {scenario.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Catatan Edukasi & Disclaimer Mobile PWA */}
      <div className="rounded-2xl p-3.5 bg-slate-900/60 border border-slate-800/70 text-slate-400 text-[11px] leading-relaxed flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          Simulasi menggunakan rumus annuity bunga majemuk bulanan (Harian x 30).
          Kinerja historis Bitcoin bukan jaminan di masa depan, namun strategi
          DCA terbukti efektif meredam volatilitas jangka panjang.
        </p>
      </div>
    </div>
  );
}
export default DCAProjectionCalculator;

