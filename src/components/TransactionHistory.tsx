"use client";

import React, { useState } from "react";
import {
  History,
  Search,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  ArrowUpDown,
  Plus,
} from "lucide-react";
import { HabitTransaction } from "@/types";
import { formatIdr, formatSats, formatDateTime } from "@/lib/calculations";

interface TransactionHistoryProps {
  transactions: HabitTransaction[];
  onEditTransaction: (tx: HabitTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenLogger: () => void;
}

export function TransactionHistory({
  transactions,
  onEditTransaction,
  onDeleteTransaction,
  onOpenLogger,
}: TransactionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const filteredTransactions = React.useMemo(() => {
    let result = [...transactions];

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.date.toLowerCase().includes(q) ||
          (tx.note && tx.note.toLowerCase().includes(q)) ||
          tx.amountIdr.toString().includes(q)
      );
    }

    result.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [transactions, searchQuery, sortOrder]);

  return (
    <div className="space-y-3">
      {/* Header bar: Title, Sort */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <History className="w-4 h-4 text-[#F7931A] shrink-0" />
          <h3 className="font-extrabold text-xs sm:text-sm text-slate-100 truncate">
            Riwayat Blok DCA ({transactions.length})
          </h3>
        </div>

        <button
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-semibold hover:bg-slate-700 transition-colors shrink-0"
        >
          <ArrowUpDown className="w-3 h-3 shrink-0" />
          <span>{sortOrder === "desc" ? "Terbaru" : "Terlama"}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari tanggal, nominal, atau catatan..."
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#F7931A]"
        />
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="p-6 text-center rounded-2xl glass-panel border border-slate-800 text-slate-400 space-y-2.5">
          <div className="w-10 h-10 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300">Belum ada transaksi ditemukan</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Mulai tumpuk blok Bitcoin pertamamu hari ini!
            </p>
          </div>
          <button
            onClick={onOpenLogger}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7931A] text-black text-xs font-bold shadow-md shadow-[#F7931A]/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Beli Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((tx, idx) => (
            <div
              key={tx.id || idx}
              className="p-3 rounded-xl glass-panel border border-slate-800/90 hover:border-slate-700 transition-all flex items-center justify-between gap-2 bg-[#0F172A]/70"
            >
              {/* Left side: Date, Amount, Note */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-100 whitespace-nowrap">
                    {formatIdr(tx.amountIdr)}
                  </span>
                  <span className="text-[11px] font-bold text-[#F7931A] whitespace-nowrap">
                    +{formatSats(tx.satsAmount)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1 font-mono whitespace-nowrap">
                    <Calendar className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                    {formatDateTime(tx.date)}
                  </span>
                  {tx.note && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 truncate max-w-[110px] text-[9px]">
                      {tx.note}
                    </span>
                  )}
                </div>

                <div className="text-[9px] text-slate-500 mt-0.5 truncate">
                  Harga: {formatIdr(tx.btcPriceAtBuy)} • ({tx.btcAmount.toFixed(8)} BTC)
                </div>
              </div>

              {/* Right side: Actions (Edit & Delete) */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onEditTransaction(tx)}
                  className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
                  title="Ubah Transaksi"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Hapus transaksi ${formatIdr(tx.amountIdr)} pada tanggal ${formatDateTime(
                          tx.date
                        )}?`
                      )
                    ) {
                      onDeleteTransaction(tx.id);
                    }
                  }}
                  className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
                  title="Hapus Transaksi"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
