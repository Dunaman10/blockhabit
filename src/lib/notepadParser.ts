import { HabitTransaction } from "@/types";

export interface ParsedNotepadLine {
  id: string;
  rawText: string;
  dateStr: string;
  isoDate: string;
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

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
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
    let amountIdr = 0;
    let note = "Import Notepad";

    try {
      // 1. Ekstrak pola tanggal:
      // Pola A: YYYY-MM-DD atau YYYY/MM/DD
      const isoDateMatch = line.match(/\b(202\d)[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);

      // Pola B: DD/MM/YYYY atau DD-MM-YYYY
      const dmyDateMatch = line.match(/\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|1[0-2])[-/](202\d)\b/);

      // Pola C: DD [NamaBulan] YYYY (misal 15 Okt 2026)
      const textDateMatch = line.match(/\b(0?[1-9]|[12]\d|3[01])\s+([A-Za-z]{3,9})\s+(202\d)\b/i);

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

        // 2. Ekstrak nominal uang dari sisa baris
        // Hapus bagian tanggal dari teks agar tidak tertukar dengan angka tahun/tanggal
        const remainingText = line.replace(matchedDateSubstring, "").trim();

        // Cari pola angka rupiah seperti: "Rp 10.000", "9990", "15,000", "50000"
        // Regex menangkap angka yang mungkin mengandung titik/koma sebagai ribuan
        const amountMatch = remainingText.match(/(?:rp\.?|idr)?\s*(\d{1,3}(?:[.,]\d{3})*|\d{4,9})\b/i);

        if (amountMatch) {
          // Bersihkan titik dan koma ribuan
          const rawNum = amountMatch[1].replace(/[.,]/g, "");
          const num = parseInt(rawNum, 10);

          if (!isNaN(num) && num > 0) {
            amountIdr = num;
            isValid = true;

            // Sisa teks di luar angka dan tanggal dijadikan catatan jika ada
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
      amountIdr,
      note,
      isValid,
      errorMessage,
    });
  });

  return results;
}

/**
 * Konversi baris valid hasil parse menjadi HabitTransaction lengkap dengan btcPrice
 */
export function convertParsedToTransactions(
  parsedLines: ParsedNotepadLine[],
  btcPrice: number
): HabitTransaction[] {
  return parsedLines
    .filter((item) => item.isValid)
    .map((item, idx) => {
      const btcAmount = parseFloat((item.amountIdr / btcPrice).toFixed(8));
      const satsAmount = Math.round(btcAmount * 100_000_000);
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
