"use client";

import React, { useRef, useState } from "react";
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  FileCode,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
  Sliders,
} from "lucide-react";
import { BlockHabitStorage } from "@/types";
import { exportToJsonFile, exportToCsvFile, parseUploadedJsonFile } from "@/lib/storage";
import { SAMPLE_STORAGE, INITIAL_STORAGE } from "@/lib/constants";
import { formatDateTime } from "@/lib/calculations";

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  storageData: BlockHabitStorage;
  onRestoreData: (restored: BlockHabitStorage) => void;
  onUpdateProfile: (profile: BlockHabitStorage["profile"]) => void;
}

export function BackupModal({
  isOpen,
  onClose,
  storageData,
  onRestoreData,
  onUpdateProfile,
}: BackupModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Settings form state
  const [exchangeName, setExchangeName] = useState(storageData.profile.exchangeName || "FLOQ");
  const [targetHorizon, setTargetHorizon] = useState<3 | 5>(
    storageData.profile.targetHorizonYears || 3
  );

  if (!isOpen) return null;

  const handleExportJson = () => {
    exportToJsonFile(storageData);
  };

  const handleExportCsv = () => {
    exportToCsvFile(storageData.transactions);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorStatus(null);
      const restored = await parseUploadedJsonFile(file);
      onRestoreData(restored);
      setImportStatus(`Berhasil memulihkan ${restored.transactions.length} transaksi!`);
      setTimeout(() => {
        setImportStatus(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorStatus("File JSON tidak valid atau struktur rusak.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLoadSample = () => {
    if (confirm("Muat data simulasi demo (14 hari streak & transaksi realistis)?")) {
      onRestoreData(SAMPLE_STORAGE);
      setImportStatus("Data demo berhasil dimuat!");
      setTimeout(() => {
        setImportStatus(null);
        onClose();
      }, 1000);
    }
  };

  const handleResetData = () => {
    if (confirm("Yakin ingin mengosongkan seluruh data? Pastikan kamu sudah mengunduh file backup.")) {
      onRestoreData(INITIAL_STORAGE);
      setImportStatus("Data berhasil direset.");
      setTimeout(() => {
        setImportStatus(null);
        onClose();
      }, 1000);
    }
  };

  const handleSaveSettings = () => {
    onUpdateProfile({
      ...storageData.profile,
      exchangeName: exchangeName.trim() || "FLOQ",
      targetHorizonYears: targetHorizon,
    });
    setImportStatus("Pengaturan berhasil disimpan.");
    setTimeout(() => setImportStatus(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0D1322] border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header Modal */}
        <div className="sticky top-0 z-10 bg-[#0D1322]/95 backdrop-blur-md px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">Backup, Restore & Pengaturan</h2>
              <p className="text-[11px] text-slate-400">Data tersimpan aman di browser (localStorage)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 pb-8 sm:pb-5 space-y-5">
          {/* Status Alert */}
          {importStatus && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {errorStatus && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorStatus}</span>
            </div>
          )}

          {/* 1-Click Export Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              1-Click Cadangkan Data (Export)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportJson}
                className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-left transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <FileCode className="w-4 h-4 text-[#F7931A]" />
                  <span>Cadangkan JSON</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">
                  Format lengkap riwayat & streak untuk dipulihkan nanti
                </span>
              </button>

              <button
                onClick={handleExportCsv}
                className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-left transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Export CSV</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">
                  Untuk dibuka di Microsoft Excel atau Google Sheets
                </span>
              </button>
            </div>
          </div>

          {/* 1-Click Restore Section */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-300 block">
              1-Click Pulihkan Data (Restore)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4 text-sky-400" />
              <span>Unggah File Cadangan (.json)</span>
            </button>
          </div>

          {/* Profil & Pengaturan */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Sliders className="w-3.5 h-3.5 text-[#F7931A]" />
              <span>Pengaturan Profil DCA</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Exchange / Platform
                </label>
                <input
                  type="text"
                  value={exchangeName}
                  onChange={(e) => setExchangeName(e.target.value)}
                  placeholder="FLOQ"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-semibold focus:outline-none focus:border-[#F7931A]"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Target Siklus Horizon
                </label>
                <select
                  value={targetHorizon}
                  onChange={(e) => setTargetHorizon(parseInt(e.target.value) as 3 | 5)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-semibold focus:outline-none focus:border-[#F7931A]"
                >
                  <option value={3}>3 Tahun (2029 Bull Run)</option>
                  <option value={5}>5 Tahun (2031 Halving 6)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Simpan Pengaturan
            </button>
          </div>

          {/* Reset & Demo Section */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={handleLoadSample}
              className="text-[#F7931A] hover:underline flex items-center gap-1 font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Muat Data Demo (14 Hari Streak)</span>
            </button>

            <button
              onClick={handleResetData}
              className="text-rose-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kosongkan Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
