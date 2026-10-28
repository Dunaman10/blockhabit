import { NextResponse } from "next/server";
import { HALVING_TARGET_BLOCK, HALVING_PREVIOUS_BLOCK } from "@/lib/constants";
import { HalvingData } from "@/types";

export async function GET() {
  let currentBlock = 880000; // Estimasi default tahun 2026

  try {
    const mempoolRes = await fetch("https://mempool.space/api/blocks/tip/height", {
      next: { revalidate: 300 },
      headers: { "User-Agent": "BlockHabit-PWA/1.0" },
    });

    if (mempoolRes.ok) {
      const height = parseInt(await mempoolRes.text(), 10);
      if (!isNaN(height) && height > 800000) {
        currentBlock = height;
      }
    }
  } catch (err) {
    console.warn("Mempool fetch failed, using realistic current block calculation...", err);
  }

  const remainingBlocks = Math.max(0, HALVING_TARGET_BLOCK - currentBlock);
  // Tiap blok ~ 10 menit
  const remainingMinutes = remainingBlocks * 10;
  const daysRemaining = Math.round(remainingMinutes / (60 * 24));
  
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysRemaining);

  const totalCycleBlocks = HALVING_TARGET_BLOCK - HALVING_PREVIOUS_BLOCK;
  const completedCycleBlocks = currentBlock - HALVING_PREVIOUS_BLOCK;
  const progressPercent = Math.min(
    100,
    Math.max(0, parseFloat(((completedCycleBlocks / totalCycleBlocks) * 100).toFixed(1)))
  );

  // Tentukan fase siklus saat ini
  let cyclePhase: "Akumulasi" | "Pre-Halving" | "Bull Run Take Profit" = "Akumulasi";
  if (daysRemaining <= 180) {
    cyclePhase = "Pre-Halving";
  } else if (daysRemaining > 600) {
    cyclePhase = "Akumulasi";
  } else {
    cyclePhase = "Akumulasi";
  }

  const halvingData: HalvingData = {
    currentBlock,
    targetBlock: HALVING_TARGET_BLOCK,
    remainingBlocks,
    estimatedDate: targetDate.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    }),
    daysRemaining,
    progressPercent,
    cyclePhase,
  };

  return NextResponse.json(halvingData);
}
