import { NextResponse } from "next/server";
import { DEFAULT_BTC_PRICE_IDR } from "@/lib/constants";
import { MarketTicker } from "@/types";

export async function GET() {
  try {
    // 1. Coba Indodax Public Ticker API (Rupiah primer)
    const indodaxRes = await fetch("https://indodax.com/api/ticker/btcidr", {
      next: { revalidate: 60 },
      headers: { "User-Agent": "BlockHabit-PWA/1.0" },
    });

    if (indodaxRes.ok) {
      const data = await indodaxRes.json();
      if (data?.ticker?.last) {
        const lastPrice = parseFloat(data.ticker.last);
        const highPrice = parseFloat(data.ticker.high || data.ticker.last);
        const lowPrice = parseFloat(data.ticker.low || data.ticker.last);
        const buyPrice = parseFloat(data.ticker.buy || data.ticker.last);
        const sellPrice = parseFloat(data.ticker.sell || data.ticker.last);

        // Hitung estimasi 24h change jika tidak langsung disediakan
        const mid24h = (highPrice + lowPrice) / 2 || lastPrice;
        const change24h = mid24h > 0 ? ((lastPrice - lowPrice) / lowPrice) * 100 - 2.5 : 0;

        const ticker: MarketTicker = {
          priceIdr: lastPrice,
          change24h: parseFloat(change24h.toFixed(2)),
          high24h: highPrice,
          low24h: lowPrice,
          lastUpdated: new Date().toISOString(),
          source: "Indodax Public API",
        };

        return NextResponse.json(ticker);
      }
    }
  } catch (err) {
    console.warn("Indodax fetch failed, trying CoinGecko fallback...", err);
  }

  try {
    // 2. Fallback CoinGecko API
    const cgRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=idr&include_24hr_change=true",
      {
        next: { revalidate: 60 },
        headers: { "User-Agent": "BlockHabit-PWA/1.0" },
      }
    );

    if (cgRes.ok) {
      const data = await cgRes.json();
      if (data?.bitcoin?.idr) {
        const ticker: MarketTicker = {
          priceIdr: data.bitcoin.idr,
          change24h: parseFloat((data.bitcoin.idr_24h_change || 0).toFixed(2)),
          high24h: Math.round(data.bitcoin.idr * 1.02),
          low24h: Math.round(data.bitcoin.idr * 0.98),
          lastUpdated: new Date().toISOString(),
          source: "CoinGecko Fallback API",
        };
        return NextResponse.json(ticker);
      }
    }
  } catch (err) {
    console.warn("CoinGecko fetch failed, using default baseline...", err);
  }

  // 3. Fallback jika kedua API gagal (misal koneksi offline)
  const fallbackTicker: MarketTicker = {
    priceIdr: DEFAULT_BTC_PRICE_IDR,
    change24h: 0.85,
    high24h: DEFAULT_BTC_PRICE_IDR * 1.015,
    low24h: DEFAULT_BTC_PRICE_IDR * 0.985,
    lastUpdated: new Date().toISOString(),
    source: "Offline Baseline Cache",
  };

  return NextResponse.json(fallbackTicker);
}
