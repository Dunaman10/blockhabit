"use client";

import React, { useState } from "react";
import { X, FileText, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, Upload } from "lucide-react";
import { parseNotepadText, convertParsedToTransactions, ParsedNotepadLine } from "@/lib/notepadParser";
import { HabitTransaction } from "@/types";
import { formatIdr, formatSats } from "@/lib/calculations";
import { DEFAULT_BTC_PRICE_IDR } from "@/lib/constants";

interface NotepadImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (newTransactions: HabitTransaction[]) => void;
  currentBtcPrice: number;
}

const SAMPLE_NOTEPAD_TEXT = `14/10/2026 - 9990 FLOQ
15/10/2026 10000 FLOQ
16/10/2026 - Rp 15.000
2026-10-17 20000 Weekend dip
18 Okt 2026 : 10000 FLOQ`;

export function NotepadImporterModal({
  isOpen,
  onClose,
  onImportSuccess,
  currentBtcPrice = DEFAULT_BTC_PRICE_IDR,
}: NotepadImporterModalProps) {
  const [inputText, setInputText] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedNotepadLine[]>([]);

  if (!isOpen) return null;

  const handleTextChange = (text: string) => {
    setInputText(text);
    const parsed = parseNotepadText(text);
    setParsedRows(parsed);
  };

  const handleLoadSample = () => {
    handleTextChange(SAMPLE_NOTEPAD_TEXT);
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);
  const totalImportIdr = validRows.reduce((acc, curr) => acc + curr.amountIdr, 0);

  const handleCommitImport = () => {
    if (validRows.length === 0) return;
    const transactions = convertParsedToTransactions(parsedRows, currentBtcPrice);
    onImportSuccess(transactions);
    setInputText("");
    setParsedRows([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#0D1322] border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header Modal */}
        <div className="sticky top-0 z-10 bg-[#0D1322]/95 backdrop-blur-md px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">Notepad Bulk Importer</h2>
              <p className="text-[11px] text-slate-400">Salin & tempel catatan lama dari Notepad HP-mu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Instruksi & Tombol Sample */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">
              Tempel teks catatanmu di bawah ini:
            </span>
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs text-[#F7931A] hover:underline flex items-center gap-1 font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Isi Format Contoh
            </button>
          </div>

          {/* Text Area */}
          <div className="relative">
            <textarea
              rows={5}
              value={inputText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={`Contoh:\n14/10/2026 - 9990\n2026-10-15 20000\n16/10/2026: Rp 10.000`}
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-[#F7931A] resize-none"
            />
          </div>

          {/* Ringkasan Ekstraksi */}
          {parsedRows.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Baris Terdeteksi:</span>
                <span className="font-bold text-slate-200">{parsedRows.length} baris</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Baris Valid:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {validRows.length} data
                </span>
              </div>
              {invalidRows.length > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Baris Gagal / Dilewati:</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {invalidRows.length} baris
                  </span>
                </div>
              )}
              <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Total Nominal Terkumpul:</span>
                <span className="font-extrabold text-[#F7931A] text-sm">
                  {formatIdr(totalImportIdr)}
                </span>
              </div>
            </div>
          )}

          {/* Tabel Pratinjau Parsed Lines */}
          {parsedRows.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-300">Pratinjau Hasil Ekstraksi:</p>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {parsedRows.map((row, idx) => (
                  <div
                    key={row.id || idx}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                      row.isValid
                        ? "bg-slate-900/60 border-slate-800 text-slate-200"
                        : "bg-red-950/20 border-red-900/40 text-red-300"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          #{idx + 1}
                        </span>
                        {row.isValid ? (
                          <span className="font-semibold text-slate-200">{row.dateStr}</span>
                        ) : (
                          <span className="font-mono text-red-400 truncate">{row.rawText}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {row.isValid ? row.note || "Import Notepad" : row.errorMessage}
                      </p>
                    </div>
                    <div>
                      {row.isValid ? (
                        <span className="font-bold text-[#F7931A] whitespace-nowrap">
                          {formatIdr(row.amountIdr)}
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-red-400 whitespace-nowrap">
                          Error
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tombol Aksi Impor */}
          <button
            type="button"
            disabled={validRows.length === 0}
            onClick={handleCommitImport}
            className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              validRows.length > 0
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:brightness-110 active:scale-[0.99] shadow-blue-500/20 cursor-pointer"
                : "bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>
              {validRows.length > 0
                ? `Impor ${validRows.length} Transaksi ke BlockHabit`
                : "Masukkan Catatan Valid Terlebih Dahulu"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
