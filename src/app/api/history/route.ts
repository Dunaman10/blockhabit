import { NextResponse } from "next/server";

export async function GET() {
  try {
    const now = Math.floor(Date.now() / 1000);
    const from = now - 365 * 86400; // 1 tahun ke belakang
    const url = `https://indodax.com/tradingview/history_v2?symbol=BTCIDR&tf=1D&from=${from}&to=${now}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "BlockHabit-PWA/1.0" },
    });

    if (res.ok) {
      const candles = await res.json();
      if (Array.isArray(candles)) {
        // Petakan tanggal YYYY-MM-DD ke harga rata-rata harian (OHLC/4) & harga Close
        const priceByDate: Record<string, number> = {};

        candles.forEach((c: any) => {
          if (c?.Time && c?.Close) {
            const dateObj = new Date(c.Time * 1000);
            const yyyy = dateObj.getUTCFullYear();
            const mm = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
            const dd = String(dateObj.getUTCDate()).padStart(2, "0");
            const dateKey = `${yyyy}-${mm}-${dd}`;

            // Gunakan rata-rata (Open + High + Close) / 3 untuk merepresentasikan harga beli market ritel harian
            const avgDailyPrice = Math.round(
              (Number(c.Open || c.Close) + Number(c.High || c.Close) + Number(c.Close)) / 3
            );
            priceByDate[dateKey] = avgDailyPrice;
          }
        });

        return NextResponse.json({ priceByDate });
      }
    }
  } catch (err) {
    console.warn("Gagal mengambil history Indodax:", err);
  }

  return NextResponse.json({ priceByDate: {} });
}

