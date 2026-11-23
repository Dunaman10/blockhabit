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
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { HabitTransaction } from "@/types";
import {
  formatIdr,
  formatSats,
  formatDateTime,
  isSellTransaction,
} from "@/lib/calculations";

interface TransactionHistoryProps {
  transactions: HabitTransaction[];
  onEditTransaction: (tx: HabitTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenLogger: () => void;
  onOpenSellLogger?: () => void;
}

export function TransactionHistory({
  transactions,
  onEditTransaction,
  onDeleteTransaction,
  onOpenLogger,
  onOpenSellLogger,
}: TransactionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [typeFilter, setTypeFilter] = useState<"all" | "buy" | "sell">("all");

  const buyCount = React.useMemo(
    () => transactions.filter((tx) => !isSellTransaction(tx)).length,
    [transactions]
  );
  const sellCount = transactions.length - buyCount;

  const filteredTransactions = React.useMemo(() => {
    let result = [...transactions];

    if (typeFilter === "buy") {
      result = result.filter((tx) => !isSellTransaction(tx));
    } else if (typeFilter === "sell") {
      result = result.filter((tx) => isSellTransaction(tx));
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter((tx) => {
        const typeLabel = isSellTransaction(tx) ? "jual withdraw tarik" : "beli buy stack dca";
        return (
          tx.date.toLowerCase().includes(q) ||
          (tx.note && tx.note.toLowerCase().includes(q)) ||
          tx.amountIdr.toString().includes(q) ||
          typeLabel.includes(q)
        );
      });
    }

    result.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [transactions, searchQuery, sortOrder, typeFilter]);

  return (
    <div className="space-y-3">
      {/* Header bar: Title, Quick Sell, Sort */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <History className="w-4 h-4 text-[#F7931A] shrink-0" />
          <h3 className="font-extrabold text-xs sm:text-sm text-slate-100 truncate">
            Riwayat Transaksi ({transactions.length})
          </h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenSellLogger && (
            <button
              onClick={onOpenSellLogger}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/35 text-rose-300 text-[11px] font-bold hover:bg-rose-500/25 transition-colors shrink-0"
            >
              <ArrowUpRight className="w-3 h-3 shrink-0" />
              <span>Catat Jual</span>
            </button>
          )}
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-semibold hover:bg-slate-700 transition-colors shrink-0"
          >
            <ArrowUpDown className="w-3 h-3 shrink-0" />
            <span>{sortOrder === "desc" ? "Terbaru" : "Terlama"}</span>
          </button>
        </div>
      </div>

      {/* Filter Pills: Semua / Beli / Jual */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-bold">
        <button
          type="button"
          onClick={() => setTypeFilter("all")}
          className={`py-1.5 px-2 rounded-lg transition-all ${
            typeFilter === "all"
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Semua ({transactions.length})
        </button>
        <button
          type="button"
          onClick={() => setTypeFilter("buy")}
          className={`py-1.5 px-2 rounded-lg transition-all ${
            typeFilter === "buy"
              ? "bg-[#F7931A] text-black"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Beli ({buyCount})
        </button>
        <button
          type="button"
          onClick={() => setTypeFilter("sell")}
          className={`py-1.5 px-2 rounded-lg transition-all ${
            typeFilter === "sell"
              ? "bg-rose-500 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Jual ({sellCount})
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari tanggal, nominal, beli/jual, atau catatan..."
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
            <p className="text-xs font-semibold text-slate-300">
              {typeFilter === "sell"
                ? "Belum ada catatan penjualan / withdraw"
                : "Belum ada transaksi ditemukan"}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {typeFilter === "sell"
                ? "Jika kamu menarik modal atau take profit, catat di sini agar saldo tetap akurat."
                : "Mulai tumpuk blok Bitcoin pertamamu hari ini!"}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            {typeFilter === "sell" && onOpenSellLogger ? (
              <button
                onClick={onOpenSellLogger}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-500/20"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Catat Jual / Withdraw</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogger}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7931A] text-black text-xs font-bold shadow-md shadow-[#F7931A]/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catat Beli Sekarang</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((tx, idx) => {
            const isSell = isSellTransaction(tx);
            const displayedIdr =
              isSell && tx.netValueIdr !== undefined && tx.netValueIdr > 0
                ? tx.netValueIdr
                : tx.amountIdr;

            return (
              <div
                key={tx.id || idx}
                className={`p-3 rounded-xl glass-panel border transition-all flex items-center justify-between gap-2 ${
                  isSell
                    ? "border-rose-500/30 hover:border-rose-500/50 bg-rose-950/15"
                    : "border-slate-800/90 hover:border-slate-700 bg-[#0F172A]/70"
                }`}
              >
                {/* Left side: Badge, Date, Amount, Note */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide shrink-0 ${
                        isSell
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          : "bg-amber-500/15 text-[#F7931A] border border-amber-500/30"
                      }`}
                    >
                      {isSell ? (
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      ) : (
                        <ArrowDownLeft className="w-2.5 h-2.5" />
                      )}
                      {isSell ? "Jual" : "Beli"}
                    </span>
                    <span className="text-xs font-extrabold text-slate-100 whitespace-nowrap">
                      {formatIdr(displayedIdr)}
                    </span>
                    <span
                      className={`text-[11px] font-bold whitespace-nowrap ${
                        isSell ? "text-rose-400" : "text-[#F7931A]"
                      }`}
                    >
                      {isSell ? "-" : "+"}
                      {formatSats(tx.satsAmount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 font-mono whitespace-nowrap">
                      <Calendar className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                      {formatDateTime(tx.date)}
                    </span>
                    {tx.note && (
                      <span
                        className={`px-1.5 py-0.5 rounded truncate max-w-[140px] text-[9px] ${
                          isSell
                            ? "bg-rose-950/60 text-rose-200 border border-rose-500/25"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {tx.note}
                      </span>
                    )}
                  </div>

                  <div className="text-[9px] text-slate-500 mt-0.5 truncate">
                    {isSell ? "Harga Jual" : "Harga Beli"}: {formatIdr(tx.btcPriceAtBuy)} • (
                    {tx.btcAmount.toFixed(8)} BTC)
                    {isSell && tx.netValueIdr !== undefined && tx.netValueIdr !== tx.amountIdr
                      ? ` • Kotor: ${formatIdr(tx.amountIdr)}`
                      : ""}
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
                          `Hapus transaksi ${isSell ? "jual" : "beli"} ${formatIdr(
                            displayedIdr
                          )} pada tanggal ${formatDateTime(tx.date)}?`
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
            );
          })}
        </div>
      )}
    </div>
  );
}
