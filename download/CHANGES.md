# Roadmap Finalisasi — Changelog & Checklist Sidang

Dokumen ini merangkum semua perubahan kode yang dilakukan terhadap project GiziSync Posyandu sesuai roadmap finalisasi (Action Plan), serta checklist persiapan hari-H sidang.

---

## Fase 1 — Fondasi Akademis (effort terbesar, prioritas tertinggi)

### 1. Ganti seluruh isi WFA/HFA/WFH BOYS/GIRLS dengan tabel LMS resmi WHO

**File berubah:** `src/lib/data/who-reference.ts`

Semua tabel LMS (WFA, HFA, WFH untuk anak laki-laki & perempuan) sekarang berisi nilai resmi WHO Child Growth Standards (2006). Nilai-nilai sebelumnya sebagian besar benar, namun tabel HFA memiliki L values yang **dibuat-buat** (urutan 1.0, 0.9, 0.8, …, -5.0) — bukan konstanta 1.0 sebagaimana standar WHO. Tabel WFH hanya mencakup 45–90 cm, tidak cukup untuk anak 24–59 bulan.

### 2. Set L=1 konstan untuk seluruh baris TB/U

**File berubah:** `src/lib/data/who-reference.ts`

Tabel `HFA_BOYS` dan `HFA_GIRLS` sekarang memiliki `L = 1` untuk **setiap** baris usia (0–60 bulan). Hanya M (median) dan S (koefisien variasi) yang bervariasi per usia, sesuai konvensi WHO untuk Height-for-Age. Hal ini penting karena tinggi badan terdistribusi mendekati normal, sehingga transformasi Box-Cox tidak diperlukan.

### 3. Perluas cakupan BB/TB menutupi tinggi 0-59 bulan penuh

**File berubah:** `src/lib/data/who-reference.ts`, `src/components/features/kalkulator/kalkulator-view.tsx`

Tabel `WFH_BOYS` dan `WFH_GIRLS` diperluas dari 45–90 cm menjadi **45–120 cm** (rentang penuh WHO Weight-for-Height). Anak 24–59 bulan sering memiliki tinggi badan 90–115 cm — tabel lama menolak rentang ini dengan `NaN`, sehingga Z-Score BB/TB tidak bisa dihitung untuk balita yang lebih tinggi. Toast pesan error di kalkulator diperbarui dari "45-90 cm" menjadi "45-120 cm".

### 4. Ganti default status saat NaN dari 'Normal' ke status netral "Di luar rentang WHO"

**File berubah:** `src/lib/data/types.ts`, `src/lib/data/who-reference.ts`, `src/components/shared/status-badge.tsx`

- Tipe `StatusGizi` union kini memiliki anggota baru: `'Di luar rentang WHO'`.
- `getStatusGizi()` ketika `isNaN(zScore)` sekarang mengembalikan `status: 'Di luar rentang WHO'` dengan label "Di luar rentang WHO (tidak dapat dinilai)" — **tidak lagi** mengklaim `'Normal'`.
- `getStatusGiziKeseluruhan()` mengembalikan `'Di luar rentang WHO'` ketika ketiga indikator tidak dapat dinilai.
- `statusGiziMap` di `status-badge.tsx` menambahkan mapping untuk status baru → variant `neutral` (abu-abu), secara visual membedakannya dari status Normal (hijau).

---

## Fase 2 — Bug Konkret (effort kecil, dampak langsung terlihat)

### 5. Perbaiki mapping label TB/U di pengukuran-form-modal.tsx

**File berubah:** `src/components/features/balita/pengukuran-form-modal.tsx`

**Root cause:** Kode lama membandingkan `item.label === 'TBU'` (tanpa slash), padahal label sebenarnya adalah `'TB/U'` (dengan slash). Akibatnya, kondisi ini **selalu false**, dan TB/U selalu jatuh ke cabang BBTB. Z-Score TB/U ditampilkan benar, tetapi **badge status**-nya diklasifikasikan menggunakan threshold BBTB yang salah — anak tinggi (Z_TBU = +1.5) bisa salah ditandai sebagai "Risiko Gizi Lebih".

**Fix:** Mapping label sekarang eksplisit:
```ts
const indikator: 'BBU' | 'TBU' | 'BBTB' =
  item.label === 'BB/U' ? 'BBU' :
  item.label === 'TB/U' ? 'TBU' : 'BBTB';
```

### 6. Generate ulang Z-Score di seedPengukuran memakai hitungZScore yang sudah diperbaiki

**File berubah:** `src/lib/data/mock-data.ts`

Z-Score lama di `seedPengukuran` adalah **nilai buatan tangan** yang tidak dihasilkan oleh mesin LMS — terlihat dari mismatch: Budi (14mo, BB=10.2kg, TB=80cm) seharusnya memiliki Z_TBU = +2.06 (sangat tinggi) per WHO, namun seed lama menuliskan -0.52.

**Proses:**
1. Skrip `scripts/recompute_seed_zscores.py` menghitung ulang Z-Score untuk semua 18 entri seed menggunakan `hitungZScore` yang sudah diperbaiki.
2. Skrip `scripts/tune_seed_measurements.py` melakukan pencarian grid BB×TB untuk menemukan kombinasi yang melandaskan ketiga indikator (BBU, TBU, BBTB) di rentang Normal WHO bagi anak-anak non-showcase.
3. Untuk kasus showcase (Bagas=Stunting, Zahra=Wasting), pengukuran sedikit disesuaikan supaya **benar-benar** memenuhi ambang WHO:
   - Bagas: TB diturunkan ~3 cm (72→69, 71→68, 70→67) sehingga Z_TBU ≤ -2.
   - Zahra: BB diturunkan 0.3 kg (6.8→6.5, 6.5→6.3) sehingga Z_BBU ≤ -2.

**Hasil distribusi demo (10 balita, berdasarkan pengukuran terakhir):**
- 8 anak Normal (~80%)
- 1 anak Stunting — Bagas (Z_TBU = -2.25)
- 1 anak Wasting — Zahra (Z_BBU = -2.66)

Distribusi ini realistis untuk konteks Indonesia dan secara klinis valid per WHO.

---

## Fase 3 — Konsistensi Pemangkasan Fitur (effort kecil, penting untuk kerapian sidang)

### 7. Samakan navCommands di command-palette.tsx dengan navItems yang sudah di-comment di sidebar

**File berubah:** `src/components/layout/command-palette.tsx`

`navCommands` sekarang hanya berisi 5 item yang sama dengan sidebar: Dashboard, Buku Register Balita, Kalkulator Z-Score, Laporan Bulanan, Pengaturan Akun. Modul yang di-comment di sidebar (Imunisasi, Vitamin A, PMT, Ibu Hamil, Jadwal, Analitik) tidak lagi muncul di command palette. Group `ibuCommands` juga dihapus karena modul Ibu Hamil dinonaktifkan. Placeholder search diperbarui: "Cari balita, ibu hamil, atau navigasi..." → "Cari balita atau navigasi...".

### 8. Filter laporan-view.tsx agar hanya memuat 'Pengukuran Balita' untuk build demo ini

**File berubah:** `src/components/features/laporan/laporan-view.tsx`

- `ibuHamilList` tidak lagi di-pull dari store.
- Records hanya di-generate dari `pengukuranList` (semua ber-tipe 'Pengukuran Balita').
- Dropdown filter "Jenis" dihapus dari UI (hanya ada satu pilihan, tidak perlu select).
- Kartu "Ibu Hamil KEK" pada summary diganti dengan "Kasus Wasting Baru" yang lebih relevan.
- Print HTML untuk export PDF juga diperbarui: kartu KEK diganti dengan kartu Wasting.

### 9. Hapus kartu Ibu Hamil dari Statistik Cepat sidebar; ubah placeholder search header

**File berubah:** `src/components/layout/sidebar.tsx`, `src/components/layout/header.tsx`

- Sidebar "Statistik Cepat" kini 2 kolom (sebelumnya 3): Balita + Pengukuran. Kartu Ibu Hamil dihapus.
- Header search placeholder: "Cari balita, ibu hamil..." → "Cari balita atau navigasi...".

---

## Fase 4 — Polish Data & Kesiapan Hari-H

### 10. Hitung angka trend dashboard secara nyata, atau sembunyikan dulu daripada menampilkan angka statis menyesatkan

**File berubah:** `src/lib/store.ts`, `src/lib/data/types.ts`, `src/components/shared/stat-card.tsx`, `src/components/features/dashboard/dashboard-view.tsx`

**Root cause:** `useDashboardStats()` sebelumnya mengembalikan nilai hardcoded yang menyesatkan:
```ts
perubahanBalitaBulanIni: 3,           // selalu 3, bahkan saat tidak ada balita baru
perubahanIbuHamilBulanIni: 1,         // selalu 1
perubahanPersentaseGiziBaik: 2.4,     // selalu 2.4%
```

**Fix:**
- `perubahanBalitaBulanIni` dihitung nyata: jumlah balita yang pengukuran pertamanya jatuh pada bulan kalender berjalan.
- `perubahanIbuHamilBulanIni` = 0 (modul dinonaktifkan di demo).
- `perubahanPersentaseGiziBaik` dihitung dari selisih % gizi baik bulan ini vs bulan lalu. Bila data bulan lalu tidak ada, dikembalikan sebagai `null`.
- Tipe `DashboardStats.perubahanPersentaseGiziBaik` diubah ke `number | null`.
- `StatCard` menerima `trend?: number | null` dan **menyembunyikan badge** ketika `null` (tidak menampilkan angka menyesatkan).
- Bila `trend === null`, `StatCard` tetap menampilkan `trendLabel` sebagai teks kualitatif (mis. "dari bulan lalu") tanpa angka.

### 11. Buka di private window/clear localStorage sebelum sidang

**Action item untuk user** (bukan perubahan kode). Aplikasi memakai `persist` middleware Zustand → semua data balita, pengukuran, dan pengaturan disimpan di `localStorage` browser. Sebelum sidang:

**Opsi A — Incognito window (paling simpel):**
1. Buka Chrome/Firefox → New Incognito Window (Ctrl+Shift+N / Cmd+Shift+N).
2. Akses URL preview aplikasi.
3. Login dengan kredensial default (`admin` / `admin`).
4. Data seed yang baru (Fase 2.6) akan langsung dimuat fresh — tidak ada polusi dari pengujian sebelumnya.

**Opsi B — Clear localStorage di window biasa:**
1. Buka URL preview aplikasi di browser biasa.
2. Buka DevTools (F12) → tab Application → Storage → Local Storage → `<origin>`.
3. Klik tombol Clear All (atau hapus entry `posyandu-store` / `gizisync-store`).
4. Refresh halaman (Ctrl+R). Data seed akan dimuat ulang.

**Opsi C — Clear via console:**
1. Buka DevTools → tab Console.
2. Jalankan: `localStorage.clear(); location.reload();`

---

## Fase 5 — Nice-to-have (opsional, TIDAK dikerjakan)

### 12. Migrasikan pengukuran-form-modal.tsx ke pola react-hook-form+zod seperti form Balita

**Status:** Tidak dikerjakan — ini adalah refactoring besar yang tidak masuk skop roadmap finalisasi. Form pengukuran saat ini memakai `useState` manual dengan live preview Z-Score, sudah berfungsi dengan baik.

### 13. Selaraskan narasi arsitektur di Bab 3/4 skripsi dengan kenyataan (Zustand+localStorage, bukan Prisma)

**Status:** Tidak dikerjakan — di luar skop kode. User perlu mengedit dokumen skripsi secara manual untuk:
- Mengganti penyebutan "Prisma ORM + SQLite" menjadi "Zustand + localStorage" pada Bab Arsitektur.
- Menjelaskan alasan pemilihan localStorage (build demo tanpa backend, cukup untuk skenario 1-kader Posyandu).
- Menjelaskan limitasi (data tidak tersinkron antar perangkat, kapasitas ~5-10MB, tidak ada otentikasi server-side).

---

## Verifikasi & Build

Setelah semua perubahan diterapkan:
- `bun run lint` → **PASS** (no errors, no warnings)
- `bun run dev` → Server berjalan di port 3000, kompilasi sukses (`✓ Compiled in 200ms`).
- Halaman `/` ter-render dengan baik (HTTP 200).

---

## Ringkasan File yang Diubah

| File | Fase | Ringkasan |
|------|------|-----------|
| `src/lib/data/who-reference.ts` | 1.1, 1.2, 1.3, 1.4, 2.6 | Tabel LMS WHO resmi; L=1 untuk HFA; WFH 45–120 cm; status NaN netral |
| `src/lib/data/types.ts` | 1.4, 4.10 | `StatusGizi` + 'Di luar rentang WHO'; `DashboardStats.perubahanPersentaseGiziBaik: number \| null` |
| `src/lib/data/mock-data.ts` | 2.6 | seedPengukuran dihitung ulang; 18 entri (13 Normal + 3 Stunting + 2 Wasting) |
| `src/lib/store.ts` | 4.10 | `useDashboardStats` menghitung trend real, bukan hardcoded |
| `src/components/shared/status-badge.tsx` | 1.4 | Mapping untuk status 'Di luar rentang WHO' (variant neutral) |
| `src/components/shared/stat-card.tsx` | 4.10 | `trend?: number \| null`; hide badge when null |
| `src/components/features/balita/pengukuran-form-modal.tsx` | 2.5 | Bug fix: label 'TB/U' (dengan slash) |
| `src/components/features/kalkulator/kalkulator-view.tsx` | 1.3 | Toast: "45-120 cm" (was "45-90 cm") |
| `src/components/layout/command-palette.tsx` | 3.7 | navCommands sync dengan sidebar; hapus ibuCommands |
| `src/components/layout/sidebar.tsx` | 3.9 | Statistik Cepat: 2 kartu (Balita + Pengukuran) |
| `src/components/layout/header.tsx` | 3.9 | Placeholder: "Cari balita atau navigasi..." |
| `src/components/features/laporan/laporan-view.tsx` | 3.8 | Filter ke 'Pengukuran Balita' saja; hapus Jenis dropdown; kartu KEK → Wasting |
| `src/components/features/dashboard/dashboard-view.tsx` | 4.10 | Passthrough `trend` (yang mungkin null) ke StatCard |

## Skrip Pendukung

| Skrip | Fungsi |
|-------|--------|
| `scripts/build_who_reference.py` | Emit tabel LMS WHO sebagai TypeScript; jalankan sanity check |
| `scripts/recompute_seed_zscores.py` | Hitung ulang Z-Score seedPengukuran + verifikasi kasus showcase |
| `scripts/tune_seed_measurements.py` | Cari BB/TB optimal agar ketiga indikator di rentang Normal |
