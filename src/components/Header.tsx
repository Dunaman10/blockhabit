"use client";

import React from "react";
import { Flame, FileText, Download, Shield } from "lucide-react";
import { StreakMetadata } from "@/types";

interface HeaderProps {
  streak: StreakMetadata;
  onOpenLogger: () => void;
  onOpenImporter: () => void;
  onOpenShareCard: () => void;
  onOpenBackup: () => void;
}

export function Header({
  streak,
  onOpenImporter,
  onOpenShareCard,
  onOpenBackup,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#090D16]/95 backdrop-blur-md border-b border-slate-800/80 px-3 py-2.5">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo - Compact & Single-Line on Mobile */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-tr from-[#F7931A] to-[#FFA726] flex items-center justify-center font-black text-black text-base shadow-sm shadow-[#F7931A]/20">
            ₿
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white truncate">
                BlockHabit
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#F7931A]/15 text-[#F7931A] border border-[#F7931A]/30 shrink-0">
                PWA
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate hidden sm:block">
              Stack the Blocks. Harvest the Cycle.
            </p>
          </div>
        </div>

        {/* Action Pills - Guaranteed Single Line */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Streak + Freeze Badge */}
          <button
            onClick={onOpenShareCard}
            className="h-8 px-2.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:border-amber-400 transition-all inline-flex items-center gap-1.5 text-[11px] font-bold whitespace-nowrap shrink-0 shadow-sm"
            title="Lihat & Bagikan Kartu Streak"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <span className="whitespace-nowrap leading-none">{streak.currentStreak} Hari</span>
            {streak.streakFreezesAvailable > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-cyan-400 font-semibold pl-1.5 border-l border-amber-500/25 whitespace-nowrap leading-none">
                <Shield className="w-3 h-3 shrink-0" />
                <span>{streak.streakFreezesAvailable}</span>
              </span>
            )}
          </button>

          {/* Notepad Importer Button */}
          <button
            onClick={onOpenImporter}
            className="w-8 h-8 shrink-0 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all"
            title="Import Catatan Notepad"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>

          {/* Backup & Settings Button */}
          <button
            onClick={onOpenBackup}
            className="w-8 h-8 shrink-0 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all"
            title="Backup Data & Pengaturan"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
