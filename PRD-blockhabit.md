# Product Requirements Document (PRD): BlockHabit

| Metadata Dokumen | Detail Spesifikasi |
| :--- | :--- |
| **Nama Produk** | **BlockHabit** — *Daily Bitcoin DCA & Habit Tracker* |
| **Tagline** | *"Build the Habit. Stack the Blocks. Harvest the Cycle."* |
| **Tipe Aplikasi** | Mobile-First Progressive Web App (PWA) |
| **Target Deployment** | Vercel (Serverless / Static Client-Side Rendering) |
| **Penyimpanan Data** | Browser `localStorage` (dengan fitur JSON/CSV Backup & Notepad Parser) |
| **Target Pengguna** | Investor ritel Bitcoin dengan strategi *Flexible Micro-DCA* (harian Rp10.000 – puluhan ribu rupiah) |

---

## 1. Ringkasan Eksekutif (Executive Summary)
**BlockHabit** adalah aplikasi web progresif (PWA) *mobile-first* yang dirancang untuk mengubah pencatatan pembelian Bitcoin manual di Notepad menjadi sistem pelacakan kebiasaan investasi (*Dollar-Cost Averaging* / DCA) yang terukur, tergamifikasi, dan *real-time*.

Mengusung filosofi bahwa setiap transaksi DCA harian adalah satu "blok" kebiasaan yang tak terputus, **BlockHabit** memudahkan pengguna mencatat pembelian dalam hitungan detik di *smartphone*, menghitung otomatis **rata-rata nominal uang yang dibelanjakan per transaksi**, melacak akumulasi modal vs. nilai pasar terkini, membangun *streak* harian yang adiktif, serta memantau informasi siklus *Halving* Bitcoin untuk menentukan waktu *Take Profit* terbaik.

---

## 2. Arsitektur & Tech Stack

Tech stack dipilih dengan prinsip **Zero-Cost, Zero-Backend Maintenance, & High Mobile UX Performance**:

* **Frontend Framework:** Next.js 14+ (App Router) dengan React 18 & TypeScript.
* **UI & Styling (Mobile-First):** Tailwind CSS + `shadcn/ui` + Lucide React Icons + `Framer Motion` (untuk animasi mikro saat *streak* bertambah).
  * *Tema Warna:* *Obsidian Dark* (`#090D16`), *Bitcoin Orange* (`#F7931A`), *Streak Flame Amber* (`#F59E0B`), dan *Profit Emerald* (`#10B981`).
* **Engine PWA:** `@ducanh2912/next-pwa` (Mendukung instalasi ke *Home Screen* Android/iOS, *offline caching*, dan tampilan *standalone* penuh layaknya aplikasi *native*).
* **State & Storage:** Custom React Hook (`useLocalStorage`) dengan validasi skema `Zod`.
* **Visualisasi Data & Share Card:** 
  * `Recharts` untuk grafik pertumbuhan Modal vs. Nilai Portofolio.
  * `html-to-image` untuk menghasilkan gambar kartu pamer *Streak* (*Shareable Streak Card*) ke media sosial/WhatsApp.
* **Integrasi API Publik (Gratis & Tanpa Kunci Rahasia):**
  * **Harga BTC/IDR Live:** Indodax Public Ticker API (`https://indodax.com/api/ticker/btcidr`) sebagai sumber utama Rupiah, dan CoinGecko Public API sebagai *fallback*.
  * **Data Blok & Halving:** Mempool.space Public API (`https://mempool.space/api/blocks/tip/height`) untuk melacak tinggi blok Bitcoin saat ini menuju blok *Halving* ke-5 (`1.050.000`).
* **Hosting & CI/CD:** Vercel (Integrasi otomatis via GitHub).

---

## 3. Spesifikasi Fitur Utama (Functional Requirements)

### 3.1. Modul "Habit Logger" — Pencatatan Cepat & Migrasi Notepad
1. **Input Transaksi Harian 1-Tap (Thumb-Friendly):**
   * **Tanggal & Waktu:** Otomatis terisi waktu saat ini (dapat diubah untuk input catatan lama/*backdate*).
   * **Input Nominal Beli (Rp):** Kolom input angka dilengkapi **Tombol Cepat (*Quick Nominal Chips*)**: `Rp9.990`, `Rp10.000`, `Rp15.000`, `Rp20.000`, `Rp30.000`, dan `Rp50.000`.
   * **Kalkulasi Satoshi Otomatis / Manual:** Secara *default* menghitung jumlah BTC/Satoshi yang didapat berdasarkan harga *live* saat itu, namun menyediakan mode input detail untuk menyesuaikan struk *exchange* (misal: harga eksekusi `Rp1.493.000.000`, nominal bersih `Rp9.988`, dan BTC diterima `0,00000668 BTC`)[cite: 1].
2. **Fitur "Notepad Bulk Importer" (Migrasi Catatan Lama):**
   * Pengguna dapat menempelkan (*copy-paste*) seluruh catatan lama dari Notepad (contoh format: `14/10/2026 - 9990` atau `2026-10-15 20000`).
   * *Parser* otomatis akan mengekstrak tanggal dan nominal beli, menghitung totalnya, dan menyimpannya ke `localStorage`.
3. **Tabel Riwayat Transaksi (CRUD):**
   * Menampilkan daftar riwayat lengkap (*Tanggal | Nominal Beli | Satoshi Didapat | Total Kumulatif*) dengan fitur *edit* dan hapus.

### 3.2. Modul "Average & Analytics Engine" — Kalkulasi Rata-Rata
Menjawab kebutuhan utama pelacakan rata-rata pengeluaran DCA harian:
1. **Total Modal Disetor (*Total Capital Deployed*):**
   * Rumus: $\sum \text{Nominal Beli Harian}$.
2. **Rata-Rata Input Nominal Beli (*Average Habit Ticket*):**
   * Rumus: $\frac{\text{Total Modal Disetor}}{\text{Total Frekuensi Transaksi}}$.
   * Menampilkan informasi langsung berapa rata-rata uang harian yang dikeluarkan pengguna (misal: rata-rata `Rp16.500 / transaksi`), dilengkapi indikator **Nominal Terkecil (Min)**, **Nominal Terbesar (Max)**, dan **Total Bulan Ini**.
3. **Rata-Rata Harga Beli BTC (*Average Buy Price*):**
   * Rumus: $\frac{\text{Total Modal Disetor}}{\text{Total BTC Terkumpul}}$.
   * Membandingkan posisi harga rata-rata tabungan pengguna terhadap harga pasar Bitcoin hari ini.
4. **Estimasi Nilai Portofolio & Floating PnL:**
   * Menghitung nilai Rupiah dari total Bitcoin yang dimiliki saat ini (`Total BTC × Harga Live BTC/IDR`) beserta selisih keuntungan dalam Rupiah (`Rp`) dan persentase (`%`).

### 3.3. Modul Gamifikasi "Block Streak" — Pemicu Konsistensi Harian
Dirancang khusus untuk menjaga kebiasaan menabung harian selama 3 hingga 5 tahun (1.095 – 1.825 hari):
1. **Daily Streak Counter (🔥):**
   * Menghitung jumlah hari berturut-turut pengguna mencatat pembelian Bitcoin tanpa putus.
   * Menampilkan kalender *heatmap* kotak-kotak (mirip kontribusi GitHub / *streak* Duolingo) yang menyala oranye setiap hari pengguna menabung.
2. **Streak Freeze (Pelindung Streak):**
   * Memberikan kuota 1x *Streak Freeze* setiap pengguna berhasil menabung 7 hari berturut-turut, agar *streak* tidak hangus jika suatu hari pengguna lupa mencatat.
3. **Shareable Streak Card (Fitur Pamer Streak):**
   * Tombol **"Bagikan Streak"** yang menghasilkan kartu visual keren berisi: *Jumlah Hari Streak 🔥*, *Konsistensi DCA*, dan *Persentase Pertumbuhan Portofolio* (nominal Rupiah asli dapat disembunyikan dengan *Privacy Toggle* agar tetap aman saat dipamerkan ke cerita WhatsApp/Instagram/TikTok).

### 3.4. Modul "Bitcoin Radar" — Informasi Pasar & Siklus Halving
Pusat informasi di dalam aplikasi untuk memandu keputusan strategi DCA:
1. **Live Market Ticker (BTC/IDR):**
   * Harga Bitcoin terkini dalam Rupiah, perubahan 24 jam (%), Harga Tertinggi/Terendah 24 jam, dan **Kalkulator Satoshi Instan** (*"Rp10.000 hari ini = ... Satoshi"*).
2. **Asisten Strategi Dynamic DCA (Rumus 10-20-30):**
   * Memberikan sinyal aksi harian berdasarkan perubahan harga 24 jam:
     * Harga naik `> +2%` (Hijau): **"Mode Rem Pucuk — Cukup Hajar Rp10.000"**
     * Harga stabil `-2% s/d +2%`: **"Mode Habit Normal — Hajar Rp10.000 - Rp20.000"**
     * Harga diskon `< -3%` (Merah): **"Mode Diskon — Hajar Rp30.000 - Rp50.000!"**
3. **Halving ke-5 Countdown & Peta Siklus 4 Tahunan:**
   * Menampilkan sisa blok dan hitung mundur waktu menuju *Halving* ke-5 (Estimasi Maret/April 2028 di blok `1.050.000`).
   * Menampilkan indikator fase siklus saat ini (*Fase Akumulasi 2026–2027 → Pre-Halving 2028 → Zona Take Profit Bull Run 2029*).
4. **Simulator Proyeksi 3 Tahun & 5 Tahun Dinamis:**
   * Mengambil angka **Rata-Rata Input Nominal Beli** asli milik pengguna, lalu memproyeksikan hasil akhirnya untuk horizon **3 Tahun (2029)** dan **5 Tahun (2031)** dalam 3 skema: **Konservatif (17% p.a.)**, **Moderat (25% p.a.)**, dan **Agresif (50% p.a.)** dibandingkan **Deposito/RDPU (3,75% p.a.)**.

### 3.5. Modul Keamanan Data (`localStorage` Backup & Restore)
1. **1-Click Export JSON & CSV:** Mengunduh seluruh data transaksi ke memori HP sebagai cadangan.
2. **1-Click Restore Data:** Mengunggah file `.json` untuk memulihkan seluruh riwayat dan *streak* jika pengguna ganti HP atau menghapus *cache browser*.

---

## 4. Skema Data (`localStorage` Data Model)

Seluruh data disimpan di sisi klien pada kunci `blockhabit_data_v1` dengan struktur TypeScript berikut:

```typescript
interface HabitTransaction {
  id: string;               // UUID unik transaksi
  date: string;             // Format ISO: "2026-10-14T05:36:00.000Z"
  amountIdr: number;        // Nominal uang yang dikeluarkan (contoh: 9990 atau 20000)
  netValueIdr?: number;     // Nilai bersih diterima setelah pembulatan (contoh: 9988)
  btcPriceAtBuy: number;    // Harga 1 BTC dalam IDR saat beli (contoh: 1493000000)
  btcAmount: number;        // Jumlah BTC didapat (contoh: 0.00000668)
  satsAmount: number;       // Jumlah Satoshi bulat (contoh: 668)
  note?: string;            // Catatan opsional (contoh: "Order Market FLOQ")
}

interface StreakMetadata {
  currentStreak: number;    // Jumlah hari berturut-turut saat ini
  longestStreak: number;    // Rekor streak terpanjang
  lastLoggedDate: string;   // Tanggal terakhir input ("YYYY-MM-DD")
  streakFreezesAvailable: number;
}

interface BlockHabitStorage {
  profile: {
    startDate: string;
    targetHorizonYears: 3 | 5;
    dailyFloorIdr: number;  // Default: 10000
    exchangeName: string;   // Default: "FLOQ"
    hideBalanceOnShare: boolean;
  };
  streak: StreakMetadata;
  transactions: HabitTransaction[];
  lastBackupDate: string | null;
}