"use client";

import React from "react";
import { Flame, Shield, Share2, Trophy, Calendar, Sparkles } from "lucide-react";
import { StreakMetadata, HabitTransaction } from "@/types";
import { getLocalDateString } from "@/lib/calculations";

interface StreakSectionProps {
  streak: StreakMetadata;
  transactions: HabitTransaction[];
  onOpenShareCard: () => void;
  onOpenLogger: () => void;
  referenceDate?: Date;
}

export function StreakSection({
  streak,
  transactions,
  onOpenShareCard,
  onOpenLogger,
  referenceDate,
}: StreakSectionProps) {
  const activeToday = referenceDate || new Date("2026-10-28T00:00:00.000Z");

  // Bangun data kalender heatmap (misal 10 minggu terakhir = 70 hari)
  const heatmapDays = React.useMemo(() => {
    const days = [];
    const activeDates = new Set(transactions.map((tx) => getLocalDateString(tx.date)));

    // Generate 70 hari ke belakang (10 minggu)
    for (let i = 69; i >= 0; i--) {
      const d = new Date(activeToday);
      d.setDate(activeToday.getDate() - i);
      const dateStr = getLocalDateString(d);
      const hasLogged = activeDates.has(dateStr);
      const isToday = i === 0;

      days.push({
        date: d,
        dateStr,
        hasLogged,
        isToday,
      });
    }
    return days;
  }, [transactions, activeToday]);

  // Konsistensi 30 hari terakhir (%)
  const consistency30d = React.useMemo(() => {
    const last30 = heatmapDays.slice(-30);
    const loggedCount = last30.filter((d) => d.hasLogged).length;
    return Math.round((loggedCount / 30) * 100);
  }, [heatmapDays]);

  const hasLoggedToday = React.useMemo(() => {
    const todayStr = getLocalDateString(activeToday);
    return transactions.some((tx) => getLocalDateString(tx.date) === todayStr);
  }, [transactions, activeToday]);

  return (
    <div className="relative overflow-hidden rounded-2xl glass-panel p-5 border border-amber-500/20 shadow-xl bg-gradient-to-b from-[#121A2D] to-[#0A0F1D]">
      {/* Background Accent Flame Glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner: Streak Flame & Freezes */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-[#F7931A] shadow-lg shadow-orange-500/25">
            <Flame className="w-8 h-8 text-white fill-white animate-flame" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-100 tracking-tight">
                {streak.currentStreak}
              </span>
              <span className="text-sm font-extrabold uppercase tracking-wider text-amber-400">
                Hari Streak 🔥
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {streak.currentStreak >= 30
                ? "Legenda DCA! Kebiasaanmu sekeras blok Bitcoin!"
                : streak.currentStreak >= 7
                ? "Konsistensi Luar Biasa! Terus pertahankan ritme!"
                : "Ayo bangun kebiasaan menabung blok tak terputus!"}
            </p>
          </div>
        </div>

        {/* Pelindung Streak Freeze Pill */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>{streak.streakFreezesAvailable} Freeze</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">1x tiap 7 hari streak</span>
        </div>
      </div>

      {/* Stat Bar Kecil */}
      <div className="grid grid-cols-3 gap-2 my-4 pt-3 border-t border-slate-800/80">
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 block font-medium">Rekor Terpanjang</span>
          <span className="text-sm font-extrabold text-slate-200 flex items-center justify-center gap-1 mt-0.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            {streak.longestStreak} Hari
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 block font-medium">Konsistensi 30H</span>
          <span className="text-sm font-extrabold text-emerald-400 mt-0.5 block">
            {consistency30d}%
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 block font-medium">Status Hari Ini</span>
          <span
            className={`text-xs font-bold mt-1 inline-block px-1.5 py-0.5 rounded ${
              hasLoggedToday
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
          >
            {hasLoggedToday ? "✓ Tercatat" : "Belum Stack"}
          </span>
        </div>
      </div>

      {/* Heatmap Kotak-Kotak (Mirip GitHub / Duolingo) */}
      <div className="mt-2">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#F7931A]" />
            Block Habit Heatmap (10 Minggu Terakhir)
          </span>
          <span className="text-[11px] text-slate-500">
            {heatmapDays.filter((d) => d.hasLogged).length} Hari Aktif
          </span>
        </div>

        {/* Grid Heatmap 10 kolom x 7 baris */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 overflow-x-auto">
          <div className="grid grid-rows-7 grid-flow-col gap-1.5 w-max">
            {heatmapDays.map((item, idx) => (
              <div
                key={idx}
                title={`${item.dateStr}: ${item.hasLogged ? "Stacked ₿" : "Tidak ada transaksi"}`}
                className={`w-3.5 h-3.5 rounded-sm transition-all duration-150 cursor-pointer ${
                  item.hasLogged
                    ? "bg-gradient-to-tr from-[#F7931A] to-amber-400 shadow-sm shadow-[#F7931A]/40 scale-100"
                    : item.isToday
                    ? "border-2 border-amber-500/80 bg-slate-800/80 animate-pulse"
                    : "bg-slate-800/60 hover:bg-slate-700/60"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900 text-[10px] text-slate-500">
            <span>Kurang Aktif</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-800" />
              <span className="w-2.5 h-2.5 rounded-sm bg-[#F7931A]/40" />
              <span className="w-2.5 h-2.5 rounded-sm bg-[#F7931A]" />
            </div>
            <span>Aktif Stack 🔥</span>
          </div>
        </div>
      </div>

      {/* Action Buttons: Stack Hari Ini & Bagikan Streak */}
      <div className="mt-4 flex items-center gap-2.5">
        {!hasLoggedToday && (
          <button
            onClick={onOpenLogger}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#F7931A] to-amber-500 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#F7931A]/20 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 fill-black" />
            <span>Stack Hari Ini (+1 Hari)</span>
          </button>
        )}
        <button
          onClick={onOpenShareCard}
          className={`${
            hasLoggedToday ? "w-full" : "flex-1"
          } py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-sm`}
        >
          <Share2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Bagikan Kartu Streak 📸</span>
        </button>
      </div>
    </div>
  );
}
