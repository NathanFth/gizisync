/**
 * scripts/impor-excel.ts
 *
 * Migrasi satu-kali data balita dari Excel rekapitulasi manual Posyandu RW 06
 * ke Supabase (tabel `balita` dan `pengukuran`).
 *
 * Mode default: DRY-RUN (hanya mencetak ringkasan, TIDAK menulis ke database).
 * Untuk benar-benar menulis, jalankan ulang dengan flag --commit secara eksplisit.
 *
 * Cara pakai:
 *   npx ts-node scripts/impor-excel.ts                          -> dry-run, file default
 *   npx ts-node scripts/impor-excel.ts ./Data_Balita_Posyandu.xlsx   -> dry-run, file custom
 *   npx ts-node scripts/impor-excel.ts ./Data_Balita_Posyandu.xlsx --commit -> tulis sungguhan
 */

import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";

// ============================================================
// KONSTANTA
// ============================================================

// Dikonfirmasi manual: kolom Jan..Des pada sheet ini merepresentasikan tahun 2026.
const TAHUN_DATA = 2026;

const MONTH_COLUMNS: { key: string; monthIndex: number }[] = [
  { key: "Jan", monthIndex: 1 },
  { key: "Feb", monthIndex: 2 },
  { key: "Mar", monthIndex: 3 },
  { key: "Apr", monthIndex: 4 },
  { key: "Mei", monthIndex: 5 },
  { key: "Jun", monthIndex: 6 },
  { key: "Jul", monthIndex: 7 },
  { key: "Ags", monthIndex: 8 },
  { key: "Sep", monthIndex: 9 },
  { key: "Okt", monthIndex: 10 },
  { key: "Nov", monthIndex: 11 },
  { key: "Des", monthIndex: 12 },
];

// ============================================================
// TIPE DATA
// ============================================================

interface BalitaInsert {
  nama_lengkap: string;
  tanggal_lahir: string; // ISO date (YYYY-MM-DD)
  nik: string | null;
  jenis_kelamin: "Laki-laki" | "Perempuan" | null;
  berat_lahir_kg: number | null;
  nama_ayah: string | null;
  nama_ibu: string | null;
  nik_ortu: string | null;
  kelompok_dasawisma: string | null;
  status: "Aktif" | "Lulus";
  sumber_data: "IMPOR_EXCEL";
  catatan_validasi: string | null;
}

interface PengukuranInsert {
  tanggal_pengukuran: string;
  usia_bulan: number;
  berat_badan_kg: number;
  tinggi_badan_cm: number;
  // lingkar_kepala_cm, lingkar_lengan_cm, dan seluruh z_score_* SENGAJA
  // tidak diisi di sini -> otomatis NULL di database, sesuai keputusan
  // "biarkan null untuk sementara" pada 3 indikator baru.
}

interface HasilTransformasi {
  noExcel: number;
  balita: BalitaInsert;
  pengukuran: PengukuranInsert[];
}

// ============================================================
// FUNGSI PARSER — masing-masing diuji terpisah agar mudah dilacak jika salah
// ============================================================

/** Excel menyimpan Tgl Lahir dalam DUA tipe berbeda: objek Date asli (14 baris)
 *  atau teks "DD-MM-YYYY" (78 baris). Fungsi ini mendeteksi tipe sebelum konversi. */
function parseTanggalLahir(raw: unknown): string | null {
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }
  if (typeof raw === "string") {
    const m = raw.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (m) {
      const [, dd, mm, yyyy] = m;
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  return null;
}

/** Menormalkan sel teks kosong / tanda "-" menjadi null. */
function kosongJadiNull(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  return s === "" || s === "-" ? null : s;
}

/** PENTING: kolom Jenis Kelamin di sumber data ternyata berisi kode singkat
 *  "L"/"P" (bukan "Laki-laki"/"Perempuan" penuh) — ditemukan lewat pengujian
 *  nyata terhadap file, bukan asumsi dari nama kolom. Fungsi ini menerima
 *  kedua bentuk supaya tetap aman jika sumber data berubah format nanti. */
function parseJenisKelamin(raw: unknown): "Laki-laki" | "Perempuan" | null {
  const s = kosongJadiNull(raw as string);
  if (!s) return null;
  const normalized = s.trim().toUpperCase();
  if (normalized === "L" || normalized === "LAKI-LAKI") return "Laki-laki";
  if (normalized === "P" || normalized === "PEREMPUAN") return "Perempuan";
  console.warn(
    `  ⚠️  Nilai Jenis Kelamin tidak dikenali, dianggap kosong: "${s}"`,
  );
  return null;
}

/** Berat Badan Lahir tersimpan campur: ada yang teks koma ("3,5"), ada yang
 *  angka Excel asli (3.1). Fungsi ini menormalkan keduanya jadi number. */
function parseAngkaDesimal(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (s === "" || s === "-") return null;
    const n = parseFloat(s.replace(",", "."));
    return isNaN(n) ? null : n;
  }
  return null;
}

type SelBulanan =
  | { tipe: "data"; beratKg: number; tinggiCm: number }
  | { tipe: "lulus" }
  | { tipe: "kosong" };

/** Inti parser kolom bulanan: memecah format gabungan "9,8/78" menjadi
 *  beratKg dan tinggiCm terpisah. Menangani 3 varian sel lain: "-" (kosong,
 *  belum diukur), "LULUS" (balita keluar cakupan program), dan benar-benar
 *  kosong (null). */
function parseSelBulanan(raw: unknown, konteks: string): SelBulanan {
  if (raw === null || raw === undefined) return { tipe: "kosong" };
  const s = String(raw).trim();
  if (s === "" || s === "-") return { tipe: "kosong" };
  if (s.toUpperCase().includes("LULUS")) return { tipe: "lulus" };

  const match = s.match(/^(-?\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)$/);
  if (!match) {
    console.warn(
      `  ⚠️  [${konteks}] Format sel bulanan tidak dikenali, dilewati: "${s}"`,
    );
    return { tipe: "kosong" };
  }
  return {
    tipe: "data",
    beratKg: parseFloat(match[1].replace(",", ".")),
    tinggiCm: parseFloat(match[2].replace(",", ".")),
  };
}

/** Usia dalam bulan penuh antara dua tanggal ISO. */
function hitungUsiaBulan(
  tanggalLahirISO: string,
  tanggalUkurISO: string,
): number {
  const lahir = new Date(tanggalLahirISO);
  const ukur = new Date(tanggalUkurISO);
  let bulan =
    (ukur.getFullYear() - lahir.getFullYear()) * 12 +
    (ukur.getMonth() - lahir.getMonth());
  if (ukur.getDate() < lahir.getDate()) bulan -= 1;
  return Math.max(0, bulan);
}

/** NIK ditandai (bukan ditolak) jika panjang digitnya bukan 16 — sesuai
 *  temuan 2 NIK rusak (17 & 10 digit) pada Gap Analysis sebelumnya. */
function validasiNik(nik: string | null): {
  nikBersih: string | null;
  catatan: string | null;
} {
  if (!nik) return { nikBersih: null, catatan: null };
  const digitOnly = nik.replace(/\D/g, "");
  if (digitOnly.length !== 16) {
    return {
      nikBersih: nik,
      catatan: `NIK sumber Excel ${digitOnly.length} digit, perlu verifikasi kader`,
    };
  }
  return { nikBersih: nik, catatan: null };
}

// ============================================================
// TRANSFORMASI 1 BARIS EXCEL -> { balita, pengukuran[] }
// ============================================================

function transformBaris(row: Record<string, unknown>): HasilTransformasi {
  const noExcel = Number(row["No"]);
  const namaLengkap = String(row["Nama"] ?? "").trim();

  const tanggalLahir = parseTanggalLahir(row["Tgl Lahir"]);
  if (!tanggalLahir) {
    throw new Error(
      `Baris No ${noExcel} ("${namaLengkap}"): Tgl Lahir tidak bisa diparse -> ${JSON.stringify(row["Tgl Lahir"])}`,
    );
  }

  const nikRaw = kosongJadiNull(row["NIK"] as string);
  const { nikBersih, catatan: catatanNik } = validasiNik(nikRaw);

  const jenisKelamin = parseJenisKelamin(row["Jenis Kelamin"]);

  const pengukuran: PengukuranInsert[] = [];
  let statusLulus = false;

  for (const { key, monthIndex } of MONTH_COLUMNS) {
    const sel = parseSelBulanan(row[key], `No ${noExcel} - ${key}`);
    if (sel.tipe === "lulus") {
      statusLulus = true;
      continue;
    }
    if (sel.tipe === "kosong") continue;

    const tanggalPengukuran = `${TAHUN_DATA}-${String(monthIndex).padStart(2, "0")}-01`;
    pengukuran.push({
      tanggal_pengukuran: tanggalPengukuran,
      usia_bulan: hitungUsiaBulan(tanggalLahir, tanggalPengukuran),
      berat_badan_kg: sel.beratKg,
      tinggi_badan_cm: sel.tinggiCm,
    });
  }

  const balita: BalitaInsert = {
    nama_lengkap: namaLengkap,
    tanggal_lahir: tanggalLahir,
    nik: nikBersih,
    jenis_kelamin: jenisKelamin,
    berat_lahir_kg: parseAngkaDesimal(row["Berat Badan Lahir"]),
    nama_ayah: kosongJadiNull(row["Nama Ayah"] as string),
    nama_ibu: kosongJadiNull(row["Nama Ibu"] as string),
    nik_ortu: kosongJadiNull(row["NIK Ortu"] as string),
    kelompok_dasawisma: kosongJadiNull(
      row["Kelompok Dasawisma (RT/RW)"] as string,
    ),
    status: statusLulus ? "Lulus" : "Aktif",
    sumber_data: "IMPOR_EXCEL",
    catatan_validasi: catatanNik,
  };

  return { noExcel, balita, pengukuran };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = !args.includes("--commit"); // AMAN SECARA DEFAULT: wajib --commit eksplisit untuk menulis
  const filePath =
    args.find((a) => !a.startsWith("--")) ??
    path.join(process.cwd(), "Data_Balita_Posyandu.xlsx");

  console.log(
    `Mode  : ${isDryRun ? "🔍 DRY-RUN (tidak menulis ke database)" : "✍️  COMMIT (menulis ke Supabase sungguhan)"}`,
  );
  console.log(`Berkas: ${filePath}\n`);

  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  });

  console.log(`Ditemukan ${rows.length} baris data.\n`);

  const hasil: HasilTransformasi[] = [];
  const errors: string[] = [];

  for (const row of rows) {
    try {
      hasil.push(transformBaris(row));
    } catch (e) {
      errors.push((e as Error).message);
    }
  }

  // ---------- Ringkasan (selalu ditampilkan, dry-run maupun commit) ----------
  const totalPengukuran = hasil.reduce(
    (sum, h) => sum + h.pengukuran.length,
    0,
  );
  const totalLulus = hasil.filter((h) => h.balita.status === "Lulus").length;
  const totalNikBermasalah = hasil.filter(
    (h) => h.balita.catatan_validasi,
  ).length;
  const totalNikKosong = hasil.filter((h) => h.balita.nik === null).length;
  const totalKelaminKosong = hasil.filter(
    (h) => h.balita.jenis_kelamin === null,
  ).length;
  const totalBeratLahirKosong = hasil.filter(
    (h) => h.balita.berat_lahir_kg === null,
  ).length;

  console.log("=== RINGKASAN HASIL PARSING ===");
  console.log(
    `  Baris balita berhasil diparse  : ${hasil.length} / ${rows.length}`,
  );
  console.log(`  Baris gagal diparse (error)    : ${errors.length}`);
  console.log(`  Total baris pengukuran dibuat  : ${totalPengukuran}`);
  console.log(`  Balita berstatus Lulus         : ${totalLulus}`);
  console.log(`  NIK ditandai catatan_validasi  : ${totalNikBermasalah}`);
  console.log(`  NIK kosong (null)              : ${totalNikKosong}`);
  console.log(`  Jenis kelamin kosong (null)    : ${totalKelaminKosong}`);
  console.log(`  Berat lahir kosong (null)      : ${totalBeratLahirKosong}`);

  if (errors.length > 0) {
    console.log("\n=== BARIS GAGAL DIPARSE ===");
    errors.forEach((e) => console.log(`  - ${e}`));
  }

  if (isDryRun) {
    console.log(
      "\nIni baru pratinjau — belum ada satu baris pun ditulis ke database.",
    );
    console.log(
      "Cocokkan angka di atas dengan Gap Analysis sebelumnya, lalu jalankan ulang",
    );
    console.log("dengan flag --commit untuk benar-benar menulis ke Supabase.");
    return;
  }

  // ---------- Tulis sungguhan ke Supabase ----------
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Environment variable SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diset sebelum --commit.",
    );
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let sukses = 0;
  let gagal = 0;

  console.log("\n=== MENULIS KE SUPABASE ===");
  for (const { noExcel, balita, pengukuran } of hasil) {
    const { data: balitaBaru, error: errBalita } = await supabase
      .from("balita")
      .insert(balita)
      .select("id")
      .single();

    if (errBalita || !balitaBaru) {
      console.error(
        `  ✗ No ${noExcel} "${balita.nama_lengkap}": gagal insert balita ->`,
        errBalita?.message,
      );
      gagal++;
      continue;
    }

    if (pengukuran.length > 0) {
      const pengukuranDenganId = pengukuran.map((p) => ({
        ...p,
        balita_id: balitaBaru.id,
      }));
      const { error: errPengukuran } = await supabase
        .from("pengukuran")
        .insert(pengukuranDenganId);
      if (errPengukuran) {
        console.error(
          `  ✗ No ${noExcel} "${balita.nama_lengkap}": balita tersimpan, pengukuran GAGAL ->`,
          errPengukuran.message,
        );
        gagal++;
        continue;
      }
    }
    sukses++;
  }

  console.log(`\n=== SELESAI ===`);
  console.log(`  Berhasil: ${sukses} balita`);
  console.log(`  Gagal   : ${gagal} balita`);
}

main().catch((e) => {
  console.error("\nMigrasi dihentikan karena error fatal:", e);
  process.exit(1);
});
