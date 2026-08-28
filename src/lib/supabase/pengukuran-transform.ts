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

/** snake_case (baris Supabase) -> camelCase (tipe PengukuranBalita aplikasi).
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
  };
}

export function pengukuranErrorResponse(error: {
  code?: string;
  message: string;
}) {
  console.error("[api/pengukuran]", error.message);
  return { status: 500, body: { error: "Gagal memproses data pengukuran." } };
}
