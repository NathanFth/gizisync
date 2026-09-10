import { z } from "zod";
import type { PengukuranBalita } from "@/lib/data/types";

export const pengukuranInputSchema = z.object({
  tanggalPengukuran: z.string().min(1, "Tanggal pengukuran wajib diisi"),
  usiaBulan: z.number().int().min(0),
  beratBadanKg: z.number().positive("Berat badan harus lebih dari 0"),
  tinggiBadanCm: z.number().positive("Tinggi badan harus lebih dari 0"),
  lingkarKepalaCm: z
    .number()
    .positive("Lingkar kepala harus lebih dari 0")
    .nullable()
    .optional(),
  lilaCm: z.number().positive("LiLA harus lebih dari 0").nullable().optional(),
});

export type PengukuranInput = z.infer<typeof pengukuranInputSchema>;

// ============================================================================
// AUDIT TRAIL: string select yang dipakai ulang semua route pengukuran supaya
// nama kader (created_by / updated_by) ikut ter-JOIN tanpa request tambahan.
// Hint "!pengukuran_created_by_fkey" / "!pengukuran_updated_by_fkey" WAJIB ada
// karena tabel pengukuran punya DUA foreign key ke kader.
// ============================================================================
export const PENGUKURAN_SELECT_WITH_KADER =
  "*, created_by_kader:kader!pengukuran_created_by_fkey(nama_lengkap), updated_by_kader:kader!pengukuran_updated_by_fkey(nama_lengkap)";

/** snake_case (baris Supabase, hasil JOIN PENGUKURAN_SELECT_WITH_KADER) -> camelCase (tipe PengukuranBalita aplikasi).
 *  Kolom numeric dibungkus Number() karena Supabase mengembalikannya sebagai
 *  string, bukan number murni. */
export function toPengukuran(row: Record<string, any>): PengukuranBalita {
  return {
    id: row.id,
    balitaId: row.balita_id,
    tanggalPengukuran: row.tanggal_pengukuran,
    usiaBulan: row.usia_bulan,
    beratBadanKg: Number(row.berat_badan_kg),
    tinggiBadanCm: Number(row.tinggi_badan_cm),
    lingkarKepalaCm:
      row.lingkar_kepala_cm != null ? Number(row.lingkar_kepala_cm) : null,
    lilaCm:
      row.lingkar_lengan_cm != null ? Number(row.lingkar_lengan_cm) : null,
    zScoreBBU: row.z_score_bb_u !== null ? Number(row.z_score_bb_u) : null,
    zScoreTBU: row.z_score_tb_u !== null ? Number(row.z_score_tb_u) : null,
    zScoreBBTB: row.z_score_bb_tb !== null ? Number(row.z_score_bb_tb) : null,
    zScoreIMTU: row.z_score_imt_u !== null ? Number(row.z_score_imt_u) : null,
    zScoreLKA: row.z_score_lka_u !== null ? Number(row.z_score_lka_u) : null,
    zScoreLILA: row.z_score_lila_u !== null ? Number(row.z_score_lila_u) : null,
    statusGizi: row.status_gizi,
    // --- AUDIT TRAIL ---
    createdAt: row.created_at,
    createdBy: row.created_by,
    createdByNama: row.created_by_kader?.nama_lengkap ?? null,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    updatedByNama: row.updated_by_kader?.nama_lengkap ?? null,
  };
}

export function pengukuranErrorResponse(error: {
  code?: string;
  message: string;
}) {
  console.error("[api/pengukuran]", error.message);
  return { status: 500, body: { error: "Gagal memproses data pengukuran." } };
}
