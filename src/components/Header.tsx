"use client";

import React from "react";
import { Flame, FileText, Download, Shield, Sparkles } from "lucide-react";
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
  onOpenLogger,
  onOpenImporter,
  onOpenShareCard,
  onOpenBackup,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#090D16]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#F7931A] to-[#FFA726] p-0.5 shadow-md shadow-[#F7931A]/20 flex items-center justify-center font-bold text-black text-lg">
            ₿
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                BlockHabit
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-[#F7931A]/15 text-[#F7931A] border border-[#F7931A]/30">
                PWA
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Stack the Blocks. Harvest the Cycle.</p>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2">
          {/* Streak Badge */}
          <button
            onClick={onOpenShareCard}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-400 hover:border-amber-400 transition-all text-xs font-bold shadow-sm"
            title="Lihat & Bagikan Kartu Streak"
          >
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-flame" />
            <span>{streak.currentStreak} Hari</span>
            {streak.streakFreezesAvailable > 0 && (
              <span className="flex items-center text-[10px] text-cyan-400 font-medium ml-0.5">
                <Shield className="w-3 h-3 inline mr-0.5" />
                {streak.streakFreezesAvailable}
              </span>
            )}
          </button>

          {/* Notepad Importer Button */}
          <button
            onClick={onOpenImporter}
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-all text-xs"
            title="Import Catatan Notepad"
          >
            <FileText className="w-4 h-4 text-slate-300" />
          </button>

          {/* Backup & Settings Button */}
          <button
            onClick={onOpenBackup}
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-all text-xs"
            title="Backup Data & Pengaturan"
          >
            <Download className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>
    </header>
  );
}
