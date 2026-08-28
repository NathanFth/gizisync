/**
 * scripts/sync-zscore-legacy.ts
 *
 * Backfill Z-Score BB/U, TB/U, BB/TB, IMT/U dan status gizi untuk baris pengukuran
 * lama (hasil impor Excel) yang belum sempat dihitung saat migrasi awal —
 * perhitungan waktu itu sengaja dipindah ke server (POST/PUT route)
 * SETELAH migrasi, sehingga hanya pengukuran BARU yang otomatis terhitung.
 *
 * TIDAK mengubah cara hitung sama sekali — memanggil hitungZScore() dan
 * getStatusGiziKeseluruhan() yang identik dengan yang dipakai
 * app/api/balita/[id]/pengukuran/route.ts.
 *
 * Mode default: DRY-RUN. Wajib --commit untuk menulis sungguhan.
 *
 * Cara pakai:
 *   npx ts-node scripts/sync-zscore-legacy.ts
 *   npx ts-node scripts/sync-zscore-legacy.ts --commit
 */

import { createClient } from "@supabase/supabase-js";
import {
  hitungZScore,
  getStatusGiziKeseluruhan,
} from "../src/lib/data/who-reference"; // Sesuaikan path jika perlu

// Mengambil environment variables (pastikan file .env.local atau di environment sistem sudah ada)
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diset.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  const isDryRun = !process.argv.includes("--commit");
  console.log(
    `Mode: ${isDryRun ? "🔍 DRY-RUN (tidak menulis)" : "✍️  COMMIT (menulis sungguhan)"}\n`,
  );

  // Ambil semua pengukuran yang Z-Score BBU-nya masih kosong (null),
  // sekaligus join dengan tabel balita untuk mengambil jenis kelamin.
  const { data: rows, error } = await supabase
    .from("pengukuran")
    .select(
      "id, usia_bulan, berat_badan_kg, tinggi_badan_cm, balita:balita_id (jenis_kelamin)",
    )
    .is("z_score_bb_u", null);

  if (error) {
    console.error("Gagal mengambil data:", error.message);
    process.exit(1);
  }

  console.log(
    `Ditemukan ${rows!.length} baris pengukuran dengan Z-Score kosong.\n`,
  );

  let dihitung = 0;
  let dilewati = 0;
  const updates: {
    id: string;
    z_score_bb_u: number;
    z_score_tb_u: number;
    z_score_bb_tb: number;
    z_score_imt_u: number; // Tambahan untuk IMT/U (hanya untuk log jika belum ada di database)
    status_gizi: string;
  }[] = [];

  for (const row of rows as any[]) {
    // Penanganan relasi join Supabase yang bisa mengembalikan array atau object
    let jenisKelaminRaw = null;
    if (Array.isArray(row.balita)) {
      jenisKelaminRaw = row.balita[0]?.jenis_kelamin;
    } else {
      jenisKelaminRaw = row.balita?.jenis_kelamin;
    }

    const jenisKelamin = jenisKelaminRaw as "Laki-laki" | "Perempuan" | null;

    if (!jenisKelamin) {
      dilewati++;
      continue;
    }

    const beratBadanKg = Number(row.berat_badan_kg);
    const tinggiBadanCm = Number(row.tinggi_badan_cm);

    // Perhitungan Z-Score menggunakan fungsi yang sama dengan API
    const zScoreBBU = hitungZScore(
      jenisKelamin,
      "BBU",
      row.usia_bulan,
      beratBadanKg,
    );
    const zScoreTBU = hitungZScore(
      jenisKelamin,
      "TBU",
      row.usia_bulan,
      tinggiBadanCm,
      tinggiBadanCm,
    );
    const zScoreBBTB = hitungZScore(
      jenisKelamin,
      "BBTB",
      row.usia_bulan,
      beratBadanKg,
      tinggiBadanCm,
    );
    // Tambahan: Menghitung IMT/U
    const zScoreIMTU = hitungZScore(
      jenisKelamin,
      "IMTU",
      row.usia_bulan,
      beratBadanKg,
      tinggiBadanCm,
    );

    const statusGizi = getStatusGiziKeseluruhan(
      zScoreBBU,
      zScoreTBU,
      zScoreBBTB,
    );

    updates.push({
      id: row.id,
      z_score_bb_u: zScoreBBU,
      z_score_tb_u: zScoreTBU,
      z_score_bb_tb: zScoreBBTB,
      z_score_imt_u: zScoreIMTU,
      status_gizi: statusGizi,
    });
    dihitung++;
  }

  console.log("=== RINGKASAN ===");
  console.log(`  Berhasil dihitung : ${dihitung}`);
  console.log(`  Dilewati (jenis kelamin balita masih kosong) : ${dilewati}`);

  if (isDryRun) {
    console.log("\nContoh 3 hasil pertama:");
    updates.slice(0, 3).forEach((u) => console.log(" ", u));
    console.log(
      '\nBelum ada yang ditulis. Cocokkan angka "Dilewati" di atas dengan jumlah',
    );
    console.log(
      "balita ber-jenisKelamin kosong dari Gap Analysis (seharusnya sekitar 18).",
    );
    console.log(
      "Kalau cocok, kabari Kak Gem sebelum menjalankan ulang dengan --commit.",
    );
    return;
  }

  // --- BLOK PENULISAN (Hanya jalan jika --commit diberikan) ---
  console.log("\n=== MENULIS KE SUPABASE ===");
  let sukses = 0,
    gagal = 0;
  for (const u of updates) {
    const { error: updateErr } = await supabase
      .from("pengukuran")
      .update({
        z_score_bb_u: u.z_score_bb_u,
        z_score_tb_u: u.z_score_tb_u,
        z_score_bb_tb: u.z_score_bb_tb,
        z_score_imt_u: u.z_score_imt_u,
        status_gizi: u.status_gizi,
      })
      .eq("id", u.id);

    if (updateErr) {
      console.error(`  ✗ Gagal update ${u.id}:`, updateErr.message);
      gagal++;
    } else {
      sukses++;
    }
  }
  console.log(`\nSelesai. Berhasil: ${sukses}, Gagal: ${gagal}`);
}

main();
