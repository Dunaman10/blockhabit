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

  // Bangun data kalender heatmap 12 minggu (84 hari) agar pas proporsional di mobile
  const heatmapDays = React.useMemo(() => {
    const days = [];
    const activeDates = new Set(transactions.map((tx) => getLocalDateString(tx.date)));

    for (let i = 83; i >= 0; i--) {
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
    <div className="relative overflow-hidden rounded-2xl glass-panel p-3.5 sm:p-5 border border-amber-500/20 shadow-lg bg-gradient-to-b from-[#121A2D] to-[#0A0F1D]">
      {/* Background Accent Flame Glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner: Streak Flame & Freezes */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-[#F7931A] shadow-md shadow-orange-500/20 flex items-center justify-center">
            <Flame className="w-6 h-6 text-white fill-white animate-flame" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-100 leading-none tracking-tight">
                {streak.currentStreak}
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 whitespace-nowrap">
                Hari Streak 🔥
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-1">
              {streak.currentStreak >= 30
                ? "Legenda DCA! Kebiasaanmu sekeras blok!"
                : streak.currentStreak >= 7
                ? "Konsistensi luar biasa! Pertahankan ritme!"
                : "Bangun kebiasaan menabung blok harian!"}
            </p>
          </div>
        </div>

        {/* Pelindung Streak Freeze Pill - 1 Baris Sejajar */}
        <div className="shrink-0 flex flex-col items-end">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold whitespace-nowrap">
            <Shield className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="whitespace-nowrap leading-none">{streak.streakFreezesAvailable} Freeze</span>
          </div>
          <span className="text-[9px] text-slate-500 mt-1 whitespace-nowrap">1x tiap 7 hari</span>
        </div>
      </div>

      {/* Stat Bar Kecil - 3 Kolom Proporsional */}
      <div className="grid grid-cols-3 gap-2 my-3 pt-3 border-t border-slate-800/80">
        <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800/90 text-center min-w-0">
          <span className="text-[10px] text-slate-400 block font-medium truncate">Rekor</span>
          <span className="text-xs font-extrabold text-slate-100 flex items-center justify-center gap-1 mt-0.5 whitespace-nowrap">
            <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
            <span>{streak.longestStreak} Hari</span>
          </span>
        </div>
        <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800/90 text-center min-w-0">
          <span className="text-[10px] text-slate-400 block font-medium truncate">Konsistensi 30H</span>
          <span className="text-xs font-extrabold text-emerald-400 mt-0.5 block whitespace-nowrap">
            {consistency30d}%
          </span>
        </div>
        <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800/90 text-center min-w-0">
          <span className="text-[10px] text-slate-400 block font-medium truncate">Status Hari Ini</span>
          <span
            className={`text-[10px] font-bold mt-0.5 inline-block px-2 py-0.5 rounded whitespace-nowrap ${
              hasLoggedToday
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
          >
            {hasLoggedToday ? "✓ Tercatat" : "Belum Stack"}
          </span>
        </div>
      </div>

      {/* Heatmap Kotak-Kotak (12 Minggu Penuh) */}
      <div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 gap-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-[#F7931A] shrink-0" />
            <span className="truncate">Block Habit Heatmap (12 Minggu)</span>
          </span>
          <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
            {heatmapDays.filter((d) => d.hasLogged).length} Hari Aktif
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="grid grid-rows-7 grid-flow-col justify-between gap-1">
            {heatmapDays.map((item, idx) => (
              <div
                key={idx}
                title={`${item.dateStr}: ${item.hasLogged ? "Stacked ₿" : "Kosong"}`}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[3px] transition-all ${
                  item.hasLogged
                    ? "bg-gradient-to-tr from-[#F7931A] to-amber-400 shadow-sm shadow-[#F7931A]/30"
                    : item.isToday
                    ? "border border-amber-500 bg-slate-800 animate-pulse"
                    : "bg-slate-800/60"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-900 text-[9px] text-slate-500">
            <span>Kurang Aktif</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-[2px] bg-slate-800" />
              <span className="w-2 h-2 rounded-[2px] bg-[#F7931A]/40" />
              <span className="w-2 h-2 rounded-[2px] bg-[#F7931A]" />
            </div>
            <span>Aktif Stack 🔥</span>
          </div>
        </div>
      </div>

      {/* Action Buttons: Stack Hari Ini & Bagikan Streak (1 Baris Rapi) */}
      <div className="mt-3 flex items-center gap-2">
        {!hasLoggedToday && (
          <button
            onClick={onOpenLogger}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#F7931A] to-amber-500 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#F7931A]/20 hover:brightness-110 active:scale-[0.98] transition-all whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 fill-black shrink-0" />
            <span>Stack Hari Ini</span>
          </button>
        )}
        <button
          onClick={onOpenShareCard}
          className={`${
            hasLoggedToday ? "w-full" : "flex-1"
          } py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all whitespace-nowrap`}
        >
          <Share2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Bagikan Streak 📸</span>
        </button>
      </div>
    </div>
  );
}
