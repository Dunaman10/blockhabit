import { HabitTransaction } from "@/types";
import { getLocalDateString } from "./calculations";

export interface ParsedNotepadLine {
  id: string;
  rawText: string;
  dateStr: string;
  isoDate: string;
  dateKey: string; // YYYY-MM-DD
  amountIdr: number;
  note: string;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Parsing teks multiline dari Notepad menjadi daftar transaksi yang siap diimpor.
 * Mendukung format:
 * - 14/10/2026 - 9990
 * - 2026-10-15 20000
 * - 16-10-2026 : Rp 10.000
 * - 17/10/2026, 15000 FLOQ Order
 */
export function parseNotepadText(text: string): ParsedNotepadLine[] {
  if (!text || text.trim() === "") return [];

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const results: ParsedNotepadLine[] = [];

  const monthNamesId: Record<string, number> = {
    jan: 0, januari: 0,
    feb: 1, februari: 1,
    mar: 2, maret: 2,
    apr: 3, april: 3,
    mei: 4, may: 4,
    jun: 5, juni: 5,
    jul: 6, juli: 6,
    agu: 7, ags: 7, agustus: 7, aug: 7,
    sep: 8, september: 8,
    okt: 9, oktober: 9, oct: 9,
    nov: 10, november: 10,
    des: 11, desember: 11, dec: 11,
  };

  lines.forEach((line, index) => {
    const rawText = line;
    let isValid = false;
    let errorMessage: string | undefined;
    let dateStr = "";
    let isoDate = "";
    let dateKey = "";
    let amountIdr = 0;
    let note = "Import Notepad";

    try {
      const isoDateMatch = line.match(
        /\b(202\d)[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/
      );
      const dmyDateMatch = line.match(
        /\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|1[0-2])[-/](202\d)\b/
      );
      const textDateMatch = line.match(
        /\b(0?[1-9]|[12]\d|3[01])\s+([A-Za-z]{3,9})\s+(202\d)\b/i
      );

      let parsedDate: Date | null = null;
      let matchedDateSubstring = "";

      if (isoDateMatch) {
        matchedDateSubstring = isoDateMatch[0];
        const [_, y, m, d] = isoDateMatch;
        parsedDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 12, 0, 0);
      } else if (dmyDateMatch) {
        matchedDateSubstring = dmyDateMatch[0];
        const [_, d, m, y] = dmyDateMatch;
        parsedDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 12, 0, 0);
      } else if (textDateMatch) {
        matchedDateSubstring = textDateMatch[0];
        const [_, d, monthWord, y] = textDateMatch;
        const monthIndex = monthNamesId[monthWord.toLowerCase()];
        if (monthIndex !== undefined) {
          parsedDate = new Date(parseInt(y), monthIndex, parseInt(d), 12, 0, 0);
        }
      }

      if (!parsedDate || isNaN(parsedDate.getTime())) {
        isValid = false;
        errorMessage = "Format tanggal tidak terdeteksi (gunakan DD/MM/YYYY atau YYYY-MM-DD)";
      } else {
        dateStr = parsedDate.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        isoDate = parsedDate.toISOString();
        dateKey = getLocalDateString(parsedDate);

        const remainingText = line.replace(matchedDateSubstring, "").trim();
        const amountMatch = remainingText.match(
          /(?:rp\.?|idr)?\s*(\d{1,3}(?:[.,]\d{3})*|\d{4,9})\b/i
        );

        if (amountMatch) {
          const rawNum = amountMatch[1].replace(/[.,]/g, "");
          const num = parseInt(rawNum, 10);

          if (!isNaN(num) && num > 0) {
            amountIdr = num;
            isValid = true;

            const remainingNote = remainingText
              .replace(amountMatch[0], "")
              .replace(/[-:,;]/g, " ")
              .trim();
            if (remainingNote.length > 0) {
              note = remainingNote;
            }
          } else {
            isValid = false;
            errorMessage = "Nominal tidak valid atau 0";
          }
        } else {
          isValid = false;
          errorMessage = "Nominal uang tidak ditemukan";
        }
      }
    } catch {
      isValid = false;
      errorMessage = "Gagal memproses baris";
    }

    results.push({
      id: `parse-${index}-${Date.now()}`,
      rawText,
      dateStr,
      isoDate,
      dateKey,
      amountIdr,
      note,
      isValid,
      errorMessage,
    });
  });

  return results;
}

/**
 * Konversi baris valid hasil parse menjadi HabitTransaction lengkap dengan harga historis pada tanggal tersebut
 */
export function convertParsedToTransactions(
  parsedLines: ParsedNotepadLine[],
  fallbackBtcPrice: number,
  historicalPrices: Record<string, number> = {}
): HabitTransaction[] {
  return parsedLines
    .filter((item) => item.isValid)
    .map((item, idx) => {
      // Gunakan harga historis BTC/IDR pada tanggal transaksi jika tersedia
      const historicalPrice = historicalPrices[item.dateKey];
      const btcPrice = historicalPrice && historicalPrice > 0 ? historicalPrice : fallbackBtcPrice;

      // Hitung jumlah BTC presisi 8 desimal (pembulatan ke bawah seperti exchange pada umumnya)
      const rawBtc = item.amountIdr / btcPrice;
      const btcAmount = Math.floor(rawBtc * 100_000_000) / 100_000_000;
      const satsAmount = Math.floor(rawBtc * 100_000_000);

      return {
        id: `tx-import-${Date.now()}-${idx}`,
        date: item.isoDate,
        amountIdr: item.amountIdr,
        netValueIdr: item.amountIdr,
        btcPriceAtBuy: btcPrice,
        btcAmount,
        satsAmount,
        note: item.note || "Import Notepad",
      };
    });
}
