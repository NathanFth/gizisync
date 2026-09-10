import { z } from "zod";
import { hitungUsiaBulan } from "@/lib/data/mock-data";
import type { Balita } from "@/lib/data/types";

// ============================================================================
// 1. SKEMA KETAT (CREATE) - Dipakai saat mendaftarkan balita baru via POST
// ============================================================================
export const balitaCreateSchema = z.object({
  nik: z.string().regex(/^\d{16}$/, "NIK Balita harus 16 digit angka"),
  namaLengkap: z.string().min(2, "Nama minimal 2 karakter"),
  tanggalLahir: z.string().min(1, "Tanggal lahir wajib diisi"),
  jenisKelamin: z.enum(["Laki-laki", "Perempuan"]),
  namaIbu: z.string().min(2, "Nama ibu minimal 2 karakter"),
  namaAyah: z.string().min(2, "Nama ayah minimal 2 karakter"),
  nikOrtu: z
    .string()
    .regex(/^\d{16}$/, "NIK Orang Tua harus 16 digit angka")
    .or(z.literal(""))
    .optional()
    .nullable(),
  beratLahirKg: z.coerce.number().min(0.5).max(6),
  panjangLahirCm: z.coerce.number().min(30).max(60),
  // BARU: Regex validasi khusus untuk Format Nomor HP Indonesia
  noTelp: z
    .string()
    .regex(
      /^(?:\+62|62|0)[2-9]\d{7,11}$/,
      "Format nomor HP tidak valid (contoh: 0812...)",
    )
    .or(z.literal(""))
    .optional()
    .nullable(),
  kelompokDasawisma: z.string().min(1, "Kelompok Dasawisma wajib diisi"),
  status: z
    .enum(["Aktif", "Tidak Aktif", "Lulus", "Pindah", "Meninggal"])
    .default("Aktif"),
  catatanValidasi: z.string().nullable().optional(),
});

// ============================================================================
// 2. SKEMA LONGGAR (EDIT) - Dipakai saat update balita lama via PUT
// ============================================================================
export const balitaUpdateSchema = balitaCreateSchema.partial();

export type BalitaCreateInput = z.infer<typeof balitaCreateSchema>;
export type BalitaUpdateInput = z.infer<typeof balitaUpdateSchema>;

// ============================================================================
// AUDIT TRAIL: string select yang dipakai ulang semua route balita supaya nama
// kader (created_by / updated_by) ikut ter-JOIN tanpa request tambahan.
// Hint "!balita_created_by_fkey" / "!balita_updated_by_fkey" WAJIB ada karena
// tabel balita punya DUA foreign key ke kader — tanpa hint ini PostgREST tidak
// tahu FK mana yang harus dipakai untuk masing-masing alias.
// ============================================================================
export const BALITA_SELECT_WITH_KADER =
  "*, created_by_kader:kader!balita_created_by_fkey(nama_lengkap), updated_by_kader:kader!balita_updated_by_fkey(nama_lengkap)";

/** camelCase (aplikasi) -> snake_case (kolom Supabase)
 *  CATATAN: created_by/updated_by SENGAJA tidak pernah dipetakan di sini.
 *  Keduanya wajib diisi di route handler dari sesi kader yang login
 *  (lib/supabase/current-kader.ts), tidak boleh datang dari body request. */
export function toRow(input: BalitaCreateInput | BalitaUpdateInput) {
  const row: Record<string, unknown> = {};
  if (input.namaLengkap !== undefined) row.nama_lengkap = input.namaLengkap;
  if (input.tanggalLahir !== undefined) row.tanggal_lahir = input.tanggalLahir;
  if (input.nik !== undefined) row.nik = input.nik;
  if (input.jenisKelamin !== undefined) row.jenis_kelamin = input.jenisKelamin;
  if (input.beratLahirKg !== undefined) row.berat_lahir_kg = input.beratLahirKg;
  if (input.panjangLahirCm !== undefined)
    row.panjang_lahir_cm = input.panjangLahirCm;
  if (input.namaAyah !== undefined) row.nama_ayah = input.namaAyah;
  if (input.namaIbu !== undefined) row.nama_ibu = input.namaIbu;
  if (input.nikOrtu !== undefined)
    row.nik_ortu = input.nikOrtu === "" ? null : input.nikOrtu;
  if (input.kelompokDasawisma !== undefined)
    row.kelompok_dasawisma = input.kelompokDasawisma;
  // BARU: Pemetaan ke kolom no_telp database (bisa string kosong)
  if (input.noTelp !== undefined)
    row.no_telp = input.noTelp === "" ? null : input.noTelp;

  row.alamat = null;
  if (input.status !== undefined) row.status = input.status;
  if (input.catatanValidasi !== undefined)
    row.catatan_validasi = input.catatanValidasi;
  return row;
}

/** snake_case (baris Supabase, hasil JOIN BALITA_SELECT_WITH_KADER) -> camelCase (tipe Balita aplikasi) */
export function toBalita(row: Record<string, any>): Balita {
  return {
    id: row.id,
    nik: row.nik,
    namaLengkap: row.nama_lengkap,
    tanggalLahir: row.tanggal_lahir,
    usiaBulan: hitungUsiaBulan(row.tanggal_lahir),
    jenisKelamin: row.jenis_kelamin,
    namaIbu: row.nama_ibu,
    namaAyah: row.nama_ayah,
    beratLahirKg: row.berat_lahir_kg,
    panjangLahirCm: row.panjang_lahir_cm,
    noTelp: row.no_telp, // <-- BARU: Mengambil dari kolom DB
    alamat: row.alamat,
    nikOrtu: row.nik_ortu,
    kelompokDasawisma: row.kelompok_dasawisma,
    status: row.status,
    sumberData: row.sumber_data,
    catatanValidasi: row.catatan_validasi,
    // --- AUDIT TRAIL ---
    createdAt: row.created_at,
    createdBy: row.created_by,
    createdByNama: row.created_by_kader?.nama_lengkap ?? null,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    updatedByNama: row.updated_by_kader?.nama_lengkap ?? null,
  };
}

/** Menerjemahkan error Supabase/Postgres jadi respons HTTP yang jelas. */
export function balitaErrorResponse(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    return {
      status: 409,
      body: { error: "NIK sudah terdaftar pada balita lain." },
    };
  }
  console.error("[api/balita]", error.message);
  return { status: 500, body: { error: "Gagal memproses data balita." } };
}
