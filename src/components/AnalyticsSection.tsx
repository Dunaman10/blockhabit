"use client";

import React, { useState } from "react";
import {
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  BarChart3,
  RefreshCw,
  SlidersHorizontal,
  Check,
  RotateCcw,
  CheckCircle2,
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
import { AnalyticsSummary, HabitTransaction, FloqSyncConfig } from "@/types";
import {
  formatIdr,
  formatSats,
  formatPercent,
  buildPortfolioChartSeries,
} from "@/lib/calculations";

interface FloqSyncParams {
  targetTotalBtc?: number;
  targetTotalAssetIdr?: number;
  targetFloqBtcPrice?: number;
  cashBalanceIdr?: number;
}

interface AnalyticsSectionProps {
  analytics: AnalyticsSummary;
  transactions: HabitTransaction[];
  currentBtcPrice: number;
  liveMarketPrice?: number;
  floqSync?: FloqSyncConfig;
  isRefreshingTicker?: boolean;
  onRefreshTicker?: () => void;
  onSyncHistoricalPrices?: () => void;
  onSyncWithFloq?: (params: FloqSyncParams) => void;
  onResetFloqSync?: () => void;
  onCalibrateAvgBuyPrice?: (targetAvgPriceIdr: number) => void;
}

export function AnalyticsSection({
  analytics,
  transactions,
  currentBtcPrice,
  liveMarketPrice,
  floqSync,
  isRefreshingTicker = false,
  onRefreshTicker,
  onSyncHistoricalPrices,
  onSyncWithFloq,
  onResetFloqSync,
  onCalibrateAvgBuyPrice,
}: AnalyticsSectionProps) {
  const isProfit = analytics.floatingPnlIdr > 0;
  const isLoss = analytics.floatingPnlIdr < 0;

  const baseMarketPrice = liveMarketPrice && liveMarketPrice > 0 ? liveMarketPrice : currentBtcPrice;
  const activeSpreadPct = floqSync?.priceSpreadPercent ?? 0;
  const hasFloqAdjustment =
    Math.abs(activeSpreadPct) >= 0.001 || (floqSync?.cashBalanceIdr ?? 0) > 0;

  const [showCalibrate, setShowCalibrate] = useState(false);
  const [calibrateMode, setCalibrateMode] = useState<"exactAsset" | "floqPrice" | "avgPrice">(
    "exactAsset"
  );
  const [inputTotalAssetIdr, setInputTotalAssetIdr] = useState("");
  const [inputBtc, setInputBtc] = useState("");
  const [inputCashIdr, setInputCashIdr] = useState("");
  const [inputFloqPrice, setInputFloqPrice] = useState("");
  const [inputAvgPrice, setInputAvgPrice] = useState("");

  // Siapkan data grafik pertumbuhan kumulatif modal aktif vs nilai portofolio
  const chartData = React.useMemo(() => {
    return buildPortfolioChartSeries(transactions, currentBtcPrice);
  }, [transactions, currentBtcPrice]);

  const openCalibrationPanel = () => {
    setInputTotalAssetIdr(
      analytics.totalAssetValue > 0 ? Math.round(analytics.totalAssetValue).toString() : ""
    );
    setInputBtc(analytics.totalBtc.toFixed(8));
    setInputCashIdr(
      analytics.cashBalanceIdr > 0 ? Math.round(analytics.cashBalanceIdr).toString() : "0"
    );
    setInputFloqPrice(Math.round(currentBtcPrice).toString());
    setInputAvgPrice(analytics.averageBuyPrice.toString());
    setShowCalibrate(true);
  };

  // Pratinjau estimasi spread harga FLOQ saat mengisi Mode "Samakan Total Aset"
  const previewExactAsset = React.useMemo(() => {
    const parsedAsset = parseInt(inputTotalAssetIdr.replace(/\D/g, ""), 10);
    const parsedCash = parseInt(inputCashIdr.replace(/\D/g, ""), 10) || 0;
    const parsedBtc = parseFloat(inputBtc.replace(",", "."));
    if (
      isNaN(parsedAsset) ||
      parsedAsset <= 0 ||
      isNaN(parsedBtc) ||
      parsedBtc <= 0 ||
      baseMarketPrice <= 0
    ) {
      return null;
    }
    const btcVal = Math.max(0, parsedAsset - parsedCash);
    const impliedPrice = btcVal / parsedBtc;
    const spreadPct = ((impliedPrice - baseMarketPrice) / baseMarketPrice) * 100;
    return {
      impliedPrice: Math.round(impliedPrice),
      spreadPct,
      btcVal,
    };
  }, [inputTotalAssetIdr, inputCashIdr, inputBtc, baseMarketPrice]);

  const handleApplyCalibration = (e: React.FormEvent) => {
    e.preventDefault();

    if (calibrateMode === "exactAsset" && onSyncWithFloq) {
      const parsedBtc = parseFloat(inputBtc.replace(",", "."));
      const parsedAsset = parseInt(inputTotalAssetIdr.replace(/\D/g, ""), 10);
      const parsedCash = parseInt(inputCashIdr.replace(/\D/g, ""), 10) || 0;

      const params: FloqSyncParams = {
        cashBalanceIdr: parsedCash,
      };
      if (!isNaN(parsedBtc) && parsedBtc >= 0) {
        params.targetTotalBtc = parsedBtc;
      }
      if (!isNaN(parsedAsset) && parsedAsset >= 0) {
        params.targetTotalAssetIdr = parsedAsset;
      }

      if (params.targetTotalBtc !== undefined || params.targetTotalAssetIdr !== undefined) {
        onSyncWithFloq(params);
        setShowCalibrate(false);
      }
    } else if (calibrateMode === "floqPrice" && onSyncWithFloq) {
      const parsedPrice = parseInt(inputFloqPrice.replace(/\D/g, ""), 10);
      if (!isNaN(parsedPrice) && parsedPrice > 0) {
        onSyncWithFloq({ targetFloqBtcPrice: parsedPrice });
        setShowCalibrate(false);
      }
    } else if (calibrateMode === "avgPrice" && onCalibrateAvgBuyPrice) {
      const cleaned = inputAvgPrice.replace(/\D/g, "");
      const parsed = parseInt(cleaned, 10);
      if (!isNaN(parsed) && parsed > 0) {
        onCalibrateAvgBuyPrice(parsed);
        setShowCalibrate(false);
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* 4 Kartu Metrik Utama */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Card 1: Total Aset / Portofolio & Floating PnL */}
        <div className="p-3 sm:p-4 rounded-2xl glass-panel border border-slate-800 bg-[#0F172A]/70 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between gap-1 text-slate-400 mb-1">
              <span className="text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 truncate">
                <Wallet className="w-3 h-3 text-blue-400 shrink-0" />
                <span className="truncate">Total Aset</span>
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center shrink-0 whitespace-nowrap ${
                  isProfit
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : isLoss
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {isProfit && <ArrowUpRight className="w-2.5 h-2.5 mr-0.5 shrink-0" />}
                {isLoss && <ArrowDownRight className="w-2.5 h-2.5 mr-0.5 shrink-0" />}
                {formatPercent(analytics.floatingPnlPercent)}
              </span>
            </div>
            <div className="text-base sm:text-xl font-black text-slate-100 tracking-tight truncate">
              {formatIdr(analytics.totalAssetValue)}
            </div>
            {analytics.cashBalanceIdr > 0 && (
              <p className="text-[9px] text-slate-400 mt-0.5 truncate">
                BTC {formatIdr(analytics.currentPortfolioValue)} + Kas{" "}
                {formatIdr(analytics.cashBalanceIdr)}
              </p>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] flex items-center justify-between gap-1">
            <span className="text-slate-400 shrink-0">PnL:</span>
            <span
              className={`font-bold truncate ${
                isProfit ? "text-emerald-400" : isLoss ? "text-rose-400" : "text-slate-400"
              }`}
            >
              {isProfit ? "+" : ""}
              {formatIdr(analytics.floatingPnlIdr)}
            </span>
          </div>
        </div>

        {/* Card 2: Total Modal Aktif */}
        <div className="p-3 sm:p-4 rounded-2xl glass-panel border border-slate-800 bg-[#0F172A]/70 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between gap-1 text-slate-400 mb-1">
              <span className="text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 truncate">
                <Coins className="w-3 h-3 text-[#F7931A] shrink-0" />
                <span className="truncate">
                  {analytics.sellCount > 0 ? "Modal Aktif" : "Total Modal"}
                </span>
              </span>
              <span className="text-[9px] font-medium text-slate-500 shrink-0 whitespace-nowrap">
                {analytics.buyCount}x Beli
                {analytics.sellCount > 0 ? ` • ${analytics.sellCount}x Jual` : ""}
              </span>
            </div>
            <div className="text-base sm:text-xl font-black text-slate-100 tracking-tight truncate">
              {formatIdr(analytics.totalCapitalDeployed)}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] flex items-center justify-between gap-1">
            <span className="text-slate-400 shrink-0">Sats:</span>
            <span className="font-extrabold text-[#F7931A] truncate">
              {formatSats(analytics.totalSats)} ({analytics.totalBtc.toFixed(8)} ₿)
            </span>
          </div>
        </div>

        {/* Card Ringkasan Penjualan & Withdraw (Muncul jika ada transaksi jual) */}
        {analytics.sellCount > 0 && (
          <div className="col-span-2 p-3.5 sm:p-4 rounded-2xl glass-panel border border-rose-500/25 bg-gradient-to-br from-rose-950/20 via-[#0F172A] to-[#0A0E1A] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Total Withdraw / Penjualan</span>
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-lg sm:text-xl font-black text-slate-100">
                    {formatIdr(analytics.totalWithdrawnIdr)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    ({analytics.sellCount}x jual • -{formatSats(analytics.totalSoldSats)})
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[9px] text-slate-400 block">Realized PnL</span>
                <span
                  className={`text-xs font-extrabold whitespace-nowrap ${
                    analytics.realizedPnlIdr > 0
                      ? "text-emerald-400"
                      : analytics.realizedPnlIdr < 0
                      ? "text-rose-400"
                      : "text-slate-300"
                  }`}
                >
                  {analytics.realizedPnlIdr > 0 ? "+" : ""}
                  {formatIdr(analytics.realizedPnlIdr)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[10px]">
              <div className="p-2 rounded-lg bg-slate-900/60 flex items-center justify-between gap-1">
                <span className="text-slate-400">Total Pernah Disetor</span>
                <span className="font-bold text-slate-200 truncate">
                  {formatIdr(analytics.totalBoughtIdr)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 flex items-center justify-between gap-1">
                <span className="text-slate-400">BTC Terjual</span>
                <span className="font-mono font-bold text-rose-300 truncate">
                  {analytics.totalSoldBtc.toFixed(8)} ₿
                </span>
              </div>
            </div>
          </div>
        )}

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

        {/* Card 4: Posisi Rata-Rata Harga Beli BTC vs Harga Pasar + Kalibrasi Presisi FLOQ */}
        <div className="col-span-2 p-3.5 sm:p-4 rounded-2xl glass-panel border border-slate-800 bg-[#0F172A]/70 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
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
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <p className="text-[10px] text-slate-500 truncate">
                  {hasFloqAdjustment ? "Harga Acuan FLOQ" : "Harga Pasar Live"}:{" "}
                  <span className="text-slate-300 font-semibold">
                    {formatIdr(Math.round(currentBtcPrice))}
                  </span>
                </p>
                {onRefreshTicker && (
                  <button
                    type="button"
                    onClick={onRefreshTicker}
                    disabled={isRefreshingTicker}
                    className="inline-flex items-center gap-0.5 text-[10px] text-sky-400 hover:text-sky-300 font-semibold"
                    title="Segarkan harga BTC live sekarang"
                  >
                    <RefreshCw
                      className={`w-2.5 h-2.5 ${isRefreshingTicker ? "animate-spin" : ""}`}
                    />
                    <span>Live</span>
                  </button>
                )}
              </div>
              {hasFloqAdjustment && (
                <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[9px] text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                  <span>
                    Tersinkron FLOQ ({formatPercent(activeSpreadPct)} vs Indodax)
                  </span>
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className="text-[9px] text-slate-400 block">Status Posisi</span>
              <span
                className={`text-[10px] font-black px-2 py-1 rounded-md inline-block mt-0.5 whitespace-nowrap ${
                  isProfit
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : isLoss
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {analytics.totalBtc === 0 && analytics.sellCount > 0
                  ? "Saldo Kosong"
                  : isProfit
                  ? "Untung"
                  : isLoss
                  ? "Sedang Rugi"
                  : "BEP / Impas"}
              </span>
            </div>
          </div>

          {/* Tombol Kalibrasi Presisi FLOQ & Sinkronisasi Harga Historis */}
          {transactions.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (showCalibrate) {
                      setShowCalibrate(false);
                    } else {
                      openCalibrationPanel();
                    }
                  }}
                  className="text-[11px] font-semibold text-[#F7931A] hover:underline flex items-center gap-1"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>
                    {showCalibrate
                      ? "Tutup Kalibrasi FLOQ"
                      : "Samakan Persis dengan Total Aset FLOQ"}
                  </span>
                </button>

                {onSyncHistoricalPrices && (
                  <button
                    type="button"
                    onClick={onSyncHistoricalPrices}
                    className="text-[10px] font-semibold text-sky-400 hover:underline flex items-center gap-1"
                    title="Sesuaikan harga beli transaksi lama dengan harga BTC historis pada tanggal tersebut"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sync Harga Historis</span>
                  </button>
                )}
              </div>

              {showCalibrate && (
                <form
                  onSubmit={handleApplyCalibration}
                  className="mt-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-2.5 animate-in fade-in duration-150"
                >
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Karena harga BTC di <strong>FLOQ</strong> memiliki sedikit selisih{" "}
                    <em>spread</em> dibanding Indodax, samakan langsung angkanya di sini agar{" "}
                    <strong>Total Aset &amp; Saldo BTC 100% identik dengan aplikasi FLOQ</strong>{" "}
                    dan tetap bergerak live!
                  </p>

                  <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setCalibrateMode("exactAsset")}
                      className={`py-1.5 px-1.5 rounded-md transition-all truncate ${
                        calibrateMode === "exactAsset"
                          ? "bg-[#F7931A] text-black"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Total Aset
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalibrateMode("floqPrice")}
                      className={`py-1.5 px-1.5 rounded-md transition-all truncate ${
                        calibrateMode === "floqPrice"
                          ? "bg-[#F7931A] text-black"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Harga FLOQ
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalibrateMode("avgPrice")}
                      className={`py-1.5 px-1.5 rounded-md transition-all truncate ${
                        calibrateMode === "avgPrice"
                          ? "bg-[#F7931A] text-black"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Avg Beli
                    </button>
                  </div>

                  {calibrateMode === "exactAsset" && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-slate-300 font-semibold block mb-1">
                          Total Aset di Aplikasi FLOQ saat ini (Rp):
                        </label>
                        <input
                          type="text"
                          value={inputTotalAssetIdr}
                          onChange={(e) => setInputTotalAssetIdr(e.target.value.replace(/\D/g, ""))}
                          placeholder="Contoh: 248350"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-[#F7931A]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">
                            Total Saldo BTC di FLOQ:
                          </label>
                          <input
                            type="text"
                            value={inputBtc}
                            onChange={(e) => setInputBtc(e.target.value)}
                            placeholder="0.00015230"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-[#F7931A]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">
                            Sisa Saldo IDR Tunai (Opsional):
                          </label>
                          <input
                            type="text"
                            value={inputCashIdr}
                            onChange={(e) => setInputCashIdr(e.target.value.replace(/\D/g, ""))}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-[#F7931A]"
                          />
                        </div>
                      </div>

                      {previewExactAsset && (
                        <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] flex items-center justify-between gap-2">
                          <span className="text-slate-400">
                            Harga Acuan FLOQ:{" "}
                            <strong className="text-slate-200">
                              {formatIdr(previewExactAsset.impliedPrice)}
                            </strong>
                          </span>
                          <span className="font-mono font-bold text-[#F7931A] shrink-0">
                            Spread {formatPercent(previewExactAsset.spreadPct)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {calibrateMode === "floqPrice" && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-300 font-semibold block">
                        Harga Live 1 BTC di Aplikasi FLOQ saat ini (Rp):
                      </label>
                      <input
                        type="text"
                        value={inputFloqPrice}
                        onChange={(e) => setInputFloqPrice(e.target.value.replace(/\D/g, ""))}
                        placeholder="Contoh: 1492500000"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-[#F7931A]"
                      />
                      <p className="text-[10px] text-slate-400">
                        Harga Indodax saat ini: {formatIdr(baseMarketPrice)}. Rasio selisih harga
                        akan otomatis tersimpan dan ikut bergerak live.
                      </p>
                    </div>
                  )}

                  {calibrateMode === "avgPrice" && (
                    <div>
                      <label className="text-[10px] text-slate-300 font-semibold block mb-1">
                        Harga Rata-Rata Beli BTC di FLOQ (Rp):
                      </label>
                      <input
                        type="text"
                        value={inputAvgPrice}
                        onChange={(e) => setInputAvgPrice(e.target.value.replace(/\D/g, ""))}
                        placeholder="Contoh: 1495000000"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-[#F7931A]"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 px-3 rounded-lg bg-[#F7931A] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-[0.99] transition-all"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Samakan dengan FLOQ</span>
                    </button>

                    {hasFloqAdjustment && onResetFloqSync && (
                      <button
                        type="button"
                        onClick={() => {
                          onResetFloqSync();
                          setShowCalibrate(false);
                        }}
                        className="py-2 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 shrink-0"
                        title="Kembalikan harga acuan ke Indodax murni (0% spread)"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}
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
                    <stop
                      offset="5%"
                      stopColor={isLoss ? "#F43F5E" : "#10B981"}
                      stopOpacity={0.5}
                    />
                    <stop
                      offset="95%"
                      stopColor={isLoss ? "#F43F5E" : "#10B981"}
                      stopOpacity={0}
                    />
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
                  formatter={(value) => [formatIdr(Number(value) || 0), ""]}
                  labelStyle={{ color: "#94A3B8", fontWeight: 600, marginBottom: "2px" }}
                />
                <Area
                  type="monotone"
                  dataKey="modalDisetor"
                  name="Modal Aktif"
                  stroke="#94A3B8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorModal)"
                />
                <Area
                  type="monotone"
                  dataKey="nilaiPortofolio"
                  name="Nilai Portofolio"
                  stroke={isLoss ? "#F43F5E" : "#10B981"}
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
