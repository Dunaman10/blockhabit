"use client";

import React from "react";
import {
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { AnalyticsSummary, HabitTransaction } from "@/types";
import { formatIdr, formatSats, formatPercent, formatDate } from "@/lib/calculations";

interface AnalyticsSectionProps {
  analytics: AnalyticsSummary;
  transactions: HabitTransaction[];
  currentBtcPrice: number;
}

export function AnalyticsSection({
  analytics,
  transactions,
  currentBtcPrice,
}: AnalyticsSectionProps) {
  const isProfit = analytics.floatingPnlIdr >= 0;

  // Siapkan data grafik pertumbuhan kumulatif modal vs nilai portofolio
  const chartData = React.useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let cumulativeCapital = 0;
    let cumulativeBtc = 0;

    return sorted.map((tx) => {
      cumulativeCapital += Number(tx.amountIdr) || 0;
      cumulativeBtc += Number(tx.btcAmount) || 0;
      const portfolioValue = Math.round(cumulativeBtc * currentBtcPrice);

      return {
        dateStr: formatDate(tx.date),
        modalDisetor: cumulativeCapital,
        nilaiPortofolio: portfolioValue,
      };
    });
  }, [transactions, currentBtcPrice]);

  return (
    <div className="space-y-3">
      {/* 4 Kartu Metrik Utama */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Card 1: Nilai Portofolio & Floating PnL */}
        <div className="p-3 sm:p-4 rounded-2xl glass-panel border border-slate-800 bg-[#0F172A]/70 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between gap-1 text-slate-400 mb-1">
              <span className="text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 truncate">
                <Wallet className="w-3 h-3 text-blue-400 shrink-0" />
                <span className="truncate">Portofolio</span>
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center shrink-0 whitespace-nowrap ${
                  isProfit
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                }`}
              >
                {isProfit ? (
                  <ArrowUpRight className="w-2.5 h-2.5 mr-0.5 shrink-0" />
                ) : (
                  <ArrowDownRight className="w-2.5 h-2.5 mr-0.5 shrink-0" />
                )}
                {formatPercent(analytics.floatingPnlPercent)}
              </span>
            </div>
            <div className="text-base sm:text-xl font-black text-slate-100 tracking-tight truncate">
              {formatIdr(analytics.currentPortfolioValue)}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] flex items-center justify-between gap-1">
            <span className="text-slate-400 shrink-0">PnL:</span>
            <span className={`font-bold truncate ${isProfit ? "text-emerald-400" : "text-rose-400"}`}>
              {isProfit ? "+" : ""}
              {formatIdr(analytics.floatingPnlIdr)}
            </span>
          </div>
        </div>

        {/* Card 2: Total Modal Disetor */}
        <div className="p-3 sm:p-4 rounded-2xl glass-panel border border-slate-800 bg-[#0F172A]/70 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between gap-1 text-slate-400 mb-1">
              <span className="text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 truncate">
                <Coins className="w-3 h-3 text-[#F7931A] shrink-0" />
                <span className="truncate">Total Modal</span>
              </span>
              <span className="text-[9px] font-medium text-slate-500 shrink-0 whitespace-nowrap">
                {analytics.transactionCount}x Beli
              </span>
            </div>
            <div className="text-base sm:text-xl font-black text-slate-100 tracking-tight truncate">
              {formatIdr(analytics.totalCapitalDeployed)}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] flex items-center justify-between gap-1">
            <span className="text-slate-400 shrink-0">Sats:</span>
            <span className="font-extrabold text-[#F7931A] truncate">
              +{formatSats(analytics.totalSats)}
            </span>
          </div>
        </div>

        {/* Card 3: Rata-Rata Input Nominal Beli */}
        <div className="col-span-2 p-3.5 sm:p-4 rounded-2xl glass-panel border border-amber-500/20 bg-gradient-to-br from-[#121A2D] to-[#0A0E1A] shadow-md">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider block truncate">
                Rata-Rata Input Nominal Beli (Habit Ticket)
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-slate-100">
                  {formatIdr(analytics.averageHabitTicket)}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">/ transaksi</span>
              </div>
            </div>
            <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>

          {/* Indikator Min, Max, dan Total Bulan Ini */}
          <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2.5 border-t border-slate-800">
            <div className="p-2 rounded-lg bg-slate-900/60 text-center min-w-0">
              <span className="text-[9px] text-slate-400 block font-medium truncate">Min</span>
              <span className="text-[11px] font-bold text-slate-200 block truncate">
                {formatIdr(analytics.minTicket)}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/60 text-center min-w-0">
              <span className="text-[9px] text-slate-400 block font-medium truncate">Max</span>
              <span className="text-[11px] font-bold text-slate-200 block truncate">
                {formatIdr(analytics.maxTicket)}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/60 text-center min-w-0">
              <span className="text-[9px] text-slate-400 block font-medium truncate">Bulan Ini</span>
              <span className="text-[11px] font-bold text-emerald-400 block truncate">
                {formatIdr(analytics.thisMonthTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Posisi Rata-Rata Harga Beli BTC vs Harga Pasar */}
        <div className="col-span-2 p-3.5 sm:p-4 rounded-2xl glass-panel border border-slate-800 bg-[#0F172A]/70 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold block truncate">
              Rata-Rata Harga Beli BTC Portofoliomu
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-sm sm:text-lg font-extrabold text-slate-100 truncate">
                {formatIdr(analytics.averageBuyPrice)}
              </span>
              <span className="text-[10px] text-slate-400 shrink-0">/ BTC</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
              Harga Pasar: {formatIdr(currentBtcPrice)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[9px] text-slate-400 block">Posisi</span>
            <span
              className={`text-[10px] font-black px-2 py-1 rounded-md inline-block mt-0.5 whitespace-nowrap ${
                currentBtcPrice >= analytics.averageBuyPrice
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              }`}
            >
              {currentBtcPrice >= analytics.averageBuyPrice ? "Untung" : "Di Atas Pasar"}
            </span>
          </div>
        </div>
      </div>

      {/* Grafik Pertumbuhan Modal vs Nilai Portofolio (Recharts) */}
      {chartData.length > 1 && (
        <div className="p-3.5 sm:p-4 rounded-2xl glass-panel border border-slate-800 bg-[#0F172A]/80">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <BarChart3 className="w-3.5 h-3.5 text-[#F7931A] shrink-0" />
              <span className="text-xs font-bold text-slate-200 truncate">
                Pertumbuhan Portofolio vs Modal
              </span>
            </div>
            <div className="flex items-center gap-2 text-[9px] shrink-0">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-500" /> Modal
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Nilai
              </span>
            </div>
          </div>

          <div className="w-full h-44 sm:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorModal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#64748B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPorto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="dateStr"
                  stroke="#64748B"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `Rp${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0D1322",
                    borderColor: "#334155",
                    borderRadius: "10px",
                    fontSize: "11px",
                    color: "#F8FAFC",
                  }}
                  formatter={(value: any) => [formatIdr(Number(value) || 0), ""]}
                  labelStyle={{ color: "#94A3B8", fontWeight: 600, marginBottom: "2px" }}
                />
                <Area
                  type="monotone"
                  dataKey="modalDisetor"
                  name="Modal Disetor"
                  stroke="#94A3B8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorModal)"
                />
                <Area
                  type="monotone"
                  dataKey="nilaiPortofolio"
                  name="Nilai Portofolio"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPorto)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
