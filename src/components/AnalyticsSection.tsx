"use client";

import React from "react";
import {
  TrendingUp,
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Sparkles,
  BarChart3,
  CalendarDays,
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
import { formatIdr, formatSats, formatBtc, formatPercent, formatDate } from "@/lib/calculations";

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

    // Urutkan transaksi dari paling lampau ke terbaru
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
    <div className="space-y-4">
      {/* 4 Kartu Metrik Utama */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Nilai Portofolio & Floating PnL */}
        <div className="p-4 rounded-2xl glass-panel border border-slate-800 bg-[#0F172A]/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-blue-400" />
                Nilai Portofolio
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center ${
                  isProfit
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                }`}
              >
                {isProfit ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {formatPercent(analytics.floatingPnlPercent)}
              </span>
            </div>
            <div className="text-xl font-black text-slate-100 tracking-tight">
              {formatIdr(analytics.currentPortfolioValue)}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] flex items-center justify-between">
            <span className="text-slate-400">Floating PnL:</span>
            <span className={`font-bold ${isProfit ? "text-emerald-400" : "text-rose-400"}`}>
              {isProfit ? "+" : ""}
              {formatIdr(analytics.floatingPnlIdr)}
            </span>
          </div>
        </div>

        {/* Card 2: Total Modal Disetor */}
        <div className="p-4 rounded-2xl glass-panel border border-slate-800 bg-[#0F172A]/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-[#F7931A]" />
                Total Modal Disetor
              </span>
              <span className="text-[10px] font-medium text-slate-500">
                {analytics.transactionCount}x Beli
              </span>
            </div>
            <div className="text-xl font-black text-slate-100 tracking-tight">
              {formatIdr(analytics.totalCapitalDeployed)}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] flex items-center justify-between">
            <span className="text-slate-400">Total Satoshi:</span>
            <span className="font-extrabold text-[#F7931A]">
              +{formatSats(analytics.totalSats)}
            </span>
          </div>
        </div>

        {/* Card 3: Rata-Rata Input Nominal Beli (Fitur Utama PRD) */}
        <div className="col-span-2 p-4 rounded-2xl glass-panel border border-amber-500/20 bg-gradient-to-br from-[#121A2D] to-[#0A0E1A] shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Rata-Rata Input Nominal Beli (Habit Ticket)
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-100">
                  {formatIdr(analytics.averageHabitTicket)}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ transaksi DCA</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
          </div>

          {/* Indikator Min, Max, dan Total Bulan Ini */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800">
            <div className="p-2 rounded-lg bg-slate-900/60 text-center">
              <span className="text-[10px] text-slate-400 block font-medium">Nominal Min</span>
              <span className="text-xs font-bold text-slate-200">
                {formatIdr(analytics.minTicket)}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/60 text-center">
              <span className="text-[10px] text-slate-400 block font-medium">Nominal Max</span>
              <span className="text-xs font-bold text-slate-200">
                {formatIdr(analytics.maxTicket)}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/60 text-center">
              <span className="text-[10px] text-slate-400 block font-medium">Bulan Ini</span>
              <span className="text-xs font-bold text-emerald-400">
                {formatIdr(analytics.thisMonthTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Posisi Rata-Rata Harga Beli BTC vs Harga Pasar */}
        <div className="col-span-2 p-4 rounded-2xl glass-panel border border-slate-800 bg-[#0F172A]/70 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">
              Rata-Rata Harga Beli BTC Portofoliomu
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-extrabold text-slate-100">
                {formatIdr(analytics.averageBuyPrice)}
              </span>
              <span className="text-[11px] text-slate-400">/ 1 BTC</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Harga Pasar Saat Ini: {formatIdr(currentBtcPrice)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Posisi Tabungan</span>
            <span
              className={`text-xs font-black px-2 py-1 rounded-md inline-block mt-0.5 ${
                currentBtcPrice >= analytics.averageBuyPrice
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              }`}
            >
              {currentBtcPrice >= analytics.averageBuyPrice ? "Di Bawah Pasar (Untung)" : "Di Atas Pasar"}
            </span>
          </div>
        </div>
      </div>

      {/* Grafik Pertumbuhan Modal vs Nilai Portofolio (Recharts) */}
      {chartData.length > 1 && (
        <div className="p-4 rounded-2xl glass-panel border border-slate-800 bg-[#0F172A]/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#F7931A]" />
              <span className="text-xs font-bold text-slate-200">
                Pertumbuhan Kumulatif Portofolio vs Modal
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-500" /> Modal Disetor
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Nilai Portofolio
              </span>
            </div>
          </div>

          <div className="w-full h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `Rp${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0D1322",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    fontSize: "11px",
                    color: "#F8FAFC",
                  }}
                  formatter={(value: any) => [formatIdr(Number(value) || 0), ""]}
                  labelStyle={{ color: "#94A3B8", fontWeight: 600, marginBottom: "4px" }}
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
                  strokeWidth={2.5}
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
