"use client";

import React, { useState } from "react";
import {
  History,
  Search,
  Filter,
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

  // Filter & Search
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
      {/* Header bar: Title, Search, Sort */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#F7931A]" />
          <h3 className="font-extrabold text-sm text-slate-100">
            Riwayat Blok DCA ({transactions.length})
          </h3>
        </div>

        <button
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
        >
          <ArrowUpDown className="w-3 h-3" />
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
          placeholder="Cari transaksi berdasarkan tanggal, nominal, atau catatan..."
          className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#F7931A]"
        />
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="p-8 text-center rounded-2xl glass-panel border border-slate-800 text-slate-400 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500">
            <Layers className="w-6 h-6" />
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
          {filteredTransactions.map((tx, idx) => {
            return (
              <div
                key={tx.id || idx}
                className="p-3.5 rounded-2xl glass-panel border border-slate-800/90 hover:border-slate-700 transition-all flex items-center justify-between bg-[#0F172A]/70"
              >
                {/* Left side: Date, Amount, Note */}
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-100">
                      {formatIdr(tx.amountIdr)}
                    </span>
                    <span className="text-[11px] font-bold text-[#F7931A]">
                      +{formatSats(tx.satsAmount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {formatDateTime(tx.date)}
                    </span>
                    {tx.note && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 truncate max-w-[130px] text-[10px]">
                        {tx.note}
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Harga Beli: {formatIdr(tx.btcPriceAtBuy)} • ({tx.btcAmount.toFixed(8)} BTC)
                  </div>
                </div>

                {/* Right side: Actions (Edit & Delete) */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditTransaction(tx)}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Ubah Transaksi"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus transaksi ${formatIdr(tx.amountIdr)} pada tanggal ${formatDateTime(tx.date)}?`)) {
                        onDeleteTransaction(tx.id);
                      }
                    }}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Hapus Transaksi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
