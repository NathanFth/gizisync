import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  pengukuranInputSchema,
  toPengukuran,
  pengukuranErrorResponse,
  PENGUKURAN_SELECT_WITH_KADER,
} from "@/lib/supabase/pengukuran-transform";
import { getCurrentKaderId } from "@/lib/supabase/current-kader";
import {
  hitungZScore,
  getStatusGiziKeseluruhan,
} from "@/lib/data/who-reference";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { id: balitaId } = await params;
  const body = await request.json();
  const parsed = pengukuranInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", detail: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // AUDIT TRAIL: identitas kader diambil dari sesi server, BUKAN dari body.
  const kaderId = await getCurrentKaderId();
  if (!kaderId) {
    return NextResponse.json(
      { error: "Akses Ditolak. Silakan login." },
      { status: 401 },
    );
  }

  // Perlu jenisKelamin balita untuk mencari tabel rujukan WHO yang benar.
  const { data: balitaRow, error: balitaErr } = await supabaseAdmin
    .from("balita")
    .select("jenis_kelamin")
    .eq("id", balitaId)
    .single();

  if (balitaErr || !balitaRow) {
    return NextResponse.json(
      { error: "Balita tidak ditemukan." },
      { status: 404 },
    );
  }

  const {
    tanggalPengukuran,
    usiaBulan,
    beratBadanKg,
    tinggiBadanCm,
    lingkarKepalaCm,
    lilaCm,
  } = parsed.data;

  const jenisKelamin = balitaRow.jenis_kelamin as
    | "Laki-laki"
    | "Perempuan"
    | null;

  // Sama seperti di store.ts sebelumnya: tanpa jenisKelamin, Z-Score memang
  // tidak bisa dihitung — bukan celah yang lolos, ini keputusan yang sama
  // ditegakkan sekarang di server, bukan cuma di client.
  let zScoreBBU: number | null = null;
  let zScoreTBU: number | null = null;
  let zScoreBBTB: number | null = null;
  let zScoreIMTU: number | null = null;
  let zScoreLKA: number | null = null;
  let zScoreLILA: number | null = null;
  let statusGizi: string | null = null;

  if (jenisKelamin) {
    zScoreBBU = hitungZScore(jenisKelamin, "BBU", usiaBulan, beratBadanKg);
    zScoreTBU = hitungZScore(
      jenisKelamin,
      "TBU",
      usiaBulan,
      tinggiBadanCm,
      tinggiBadanCm,
    );
    zScoreBBTB = hitungZScore(
      jenisKelamin,
      "BBTB",
      usiaBulan,
      beratBadanKg,
      tinggiBadanCm,
    );

    // IMT/U selalu dihitung karena BB dan TB wajib ada
    zScoreIMTU = hitungZScore(
      jenisKelamin,
      "IMTU",
      usiaBulan,
      beratBadanKg,
      tinggiBadanCm,
    );

    // LKA dan LiLA dihitung hanya jika ukurannya diberikan (opsional)
    if (lingkarKepalaCm != null) {
      zScoreLKA = hitungZScore(jenisKelamin, "LKA", usiaBulan, lingkarKepalaCm);
    }

    if (lilaCm != null) {
      zScoreLILA = hitungZScore(jenisKelamin, "LILA", usiaBulan, lilaCm);
    }

    statusGizi = getStatusGiziKeseluruhan(zScoreBBU, zScoreTBU, zScoreBBTB);
  }

  const { data, error } = await supabaseAdmin
    .from("pengukuran")
    .insert({
      balita_id: balitaId,
      tanggal_pengukuran: tanggalPengukuran,
      usia_bulan: usiaBulan,
      berat_badan_kg: beratBadanKg,
      tinggi_badan_cm: tinggiBadanCm,
      lingkar_kepala_cm: lingkarKepalaCm ?? null,
      lingkar_lengan_cm: lilaCm ?? null,
      z_score_bb_u: zScoreBBU,
      z_score_tb_u: zScoreTBU,
      z_score_bb_tb: zScoreBBTB,
      z_score_imt_u: zScoreIMTU,
      z_score_lka_u: zScoreLKA,
      z_score_lila_u: zScoreLILA,
      status_gizi: statusGizi,
      created_by: kaderId, // AUDIT TRAIL: hanya diisi saat INSERT
    })
    .select(PENGUKURAN_SELECT_WITH_KADER)
    .single();

  if (error) {
    const { status, body: errBody } = pengukuranErrorResponse(error);
    return NextResponse.json(errBody, { status });
  }

  return NextResponse.json({ data: toPengukuran(data) }, { status: 201 });
}
