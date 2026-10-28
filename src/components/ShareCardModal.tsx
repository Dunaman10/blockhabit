"use client";

import React, { useState, useRef } from "react";
import { X, Flame, Download, Eye, EyeOff, Share2, Sparkles, Check, Shield } from "lucide-react";
import { toPng } from "html-to-image";
import confetti from "canvas-confetti";
import { StreakMetadata, AnalyticsSummary } from "@/types";
import { formatIdr, formatSats, formatPercent } from "@/lib/calculations";

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: StreakMetadata;
  analytics: AnalyticsSummary;
  exchangeName?: string;
}

export function ShareCardModal({
  isOpen,
  onClose,
  streak,
  analytics,
  exchangeName = "FLOQ",
}: ShareCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hideBalance, setHideBalance] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: "#090D16",
      });

      const link = document.createElement("a");
      link.download = `blockhabit-streak-${streak.currentStreak}days.png`;
      link.href = dataUrl;
      link.click();

      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    } catch (err) {
      console.error("Gagal membuat gambar share card:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNativeShare = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#090D16",
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `blockhabit-streak-${streak.currentStreak}days.png`, {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `BlockHabit ${streak.currentStreak} Hari Streak!`,
          text: `Membangun kebiasaan menabung Bitcoin setiap hari tanpa putus dengan BlockHabit! 🔥`,
        });
      } else {
        // Fallback unduh jika native file share tidak didukung di browser ini
        handleDownloadImage();
      }
    } catch (err) {
      console.warn("Share API dibatalkan atau tidak didukung:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#0D1322] border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header Modal */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-100 text-sm">Bagikan Kartu Streak</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Container */}
        <div className="p-4 flex flex-col items-center space-y-4">
          {/* Privacy Toggle Switch */}
          <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              {hideBalance ? (
                <EyeOff className="w-4 h-4 text-amber-400" />
              ) : (
                <Eye className="w-4 h-4 text-emerald-400" />
              )}
              <span>{hideBalance ? "Saldo Rupiah Disembunyikan" : "Saldo Rupiah Ditampilkan"}</span>
            </div>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition-colors"
            >
              {hideBalance ? "Buka Sensor" : "Sensorkan"}
            </button>
          </div>

          {/* THE CARD TO EXPORT (Optimized for 9:16 / Story Preview) */}
          <div
            ref={cardRef}
            className="w-full aspect-[4/5] rounded-2xl bg-gradient-to-br from-[#090D16] via-[#121A2D] to-[#0D1322] p-5 border-2 border-amber-500/30 shadow-2xl relative flex flex-col justify-between overflow-hidden"
          >
            {/* Background Watermark Bitcoin Symbol */}
            <div className="absolute -right-8 -bottom-8 text-[#F7931A]/5 text-[180px] font-black select-none pointer-events-none leading-none">
              ₿
            </div>
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Card Header */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#F7931A] to-[#FFA726] flex items-center justify-center font-black text-black text-sm">
                  ₿
                </div>
                <div>
                  <span className="font-extrabold text-xs tracking-tight text-white block">
                    BlockHabit
                  </span>
                  <span className="text-[9px] text-slate-400 block -mt-0.5 font-medium">
                    Stack the Blocks
                  </span>
                </div>
              </div>

              <div className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] text-slate-300 font-medium">
                DCA {exchangeName}
              </div>
            </div>

            {/* Main Center: Big Flame & Streak Count */}
            <div className="my-auto py-2 text-center relative z-10">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-600/30 to-orange-500/30 border border-amber-500/40 mb-2">
                <Flame className="w-10 h-10 text-amber-500 fill-amber-500 animate-flame" />
              </div>
              <div className="text-4xl font-black text-white tracking-tight">
                {streak.currentStreak}{" "}
                <span className="text-amber-400 text-2xl font-extrabold">HARI</span>
              </div>
              <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mt-1">
                Streak DCA Tak Terputus 🔥
              </p>
            </div>

            {/* Card Stats Grid */}
            <div className="grid grid-cols-2 gap-2 relative z-10 pt-2 border-t border-slate-800/80">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Akumulasi</span>
                <span className="text-xs font-bold text-[#F7931A]">
                  +{formatSats(analytics.totalSats)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Pertumbuhan Portofolio</span>
                <span
                  className={`text-xs font-bold ${
                    analytics.floatingPnlPercent >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {formatPercent(analytics.floatingPnlPercent)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Rata-Rata Tiket DCA</span>
                <span className="text-xs font-bold text-slate-200">
                  {hideBalance ? "Rp ••••••" : formatIdr(analytics.averageHabitTicket)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Blok Ditumpuk</span>
                <span className="text-xs font-bold text-slate-200">
                  {analytics.transactionCount} Transaksi
                </span>
              </div>
            </div>

            {/* Card Footer Tagline */}
            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-400 relative z-10">
              <span>Mempersiapkan Siklus Halving 2028</span>
              <span className="font-semibold text-amber-400">#BlockHabit #BitcoinDCA</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGenerating ? "Membuat..." : "Simpan PNG"}</span>
            </button>

            <button
              onClick={handleNativeShare}
              disabled={isGenerating}
              className="py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-[#F7931A] text-black text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <Share2 className="w-3.5 h-3.5 text-black" />
              <span>Bagikan Story 🚀</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
