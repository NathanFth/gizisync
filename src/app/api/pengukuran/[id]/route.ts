import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  pengukuranInputSchema,
  toPengukuran,
  pengukuranErrorResponse,
} from "@/lib/supabase/pengukuran-transform";
import {
  hitungZScore,
  getStatusGiziKeseluruhan,
} from "@/lib/data/who-reference";

function hitungUsiaBulan(
  tanggalLahir: string,
  tanggalPengukuran: string,
): number {
  const tglLahir = new Date(tanggalLahir);
  const tglUkur = new Date(tanggalPengukuran);
  let bulan = (tglUkur.getFullYear() - tglLahir.getFullYear()) * 12;
  bulan -= tglLahir.getMonth();
  bulan += tglUkur.getMonth();
  if (tglUkur.getDate() < tglLahir.getDate()) {
    bulan--;
  }
  return Math.max(0, bulan); // Usia tidak boleh negatif
}

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();
  // Zod .partial() membuat field yang tidak dikirim menjadi 'undefined'
  const parsed = pengukuranInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", detail: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Ambil baris lama dulu untuk tahu balita_id-nya + nilai yang tidak dikirim ulang.
  // FIX: Tarik juga tanggal_lahir untuk menghitung ulang umur secara mutlak di server!
  const { data: existing, error: existErr } = await supabaseAdmin
    .from("pengukuran")
    .select("*, balita:balita_id (jenis_kelamin, tanggal_lahir)")
    .eq("id", id)
    .single();

  if (existErr || !existing) {
    return NextResponse.json(
      { error: "Data pengukuran tidak ditemukan." },
      { status: 404 },
    );
  }

  // FIX: Ambil identitas balita dari hasil query
  const jenisKelamin = (existing as any).balita?.jenis_kelamin as
    | "Laki-laki"
    | "Perempuan"
    | null;
  const tanggalLahir = (existing as any).balita?.tanggal_lahir as string;

  // FIX: Tentukan tanggal pengukuran yang dipakai (baru atau lama)
  const tanggalPengukuranFinal =
    parsed.data.tanggalPengukuran ?? existing.tanggal_pengukuran;

  // FIX: Hitung umur akurat secara absolut dari Server! Tolak umur dari Client.
  const usiaBulanAkurat = tanggalLahir
    ? hitungUsiaBulan(tanggalLahir, tanggalPengukuranFinal)
    : (parsed.data.usiaBulan ?? existing.usia_bulan);

  // Gabungkan data lama dan baru. Khusus untuk LKA dan LiLA, kita cek terhadap 'undefined'
  // agar jika user sengaja mengirim 'null' (mengosongkan nilai), nilainya tetap tersimpan sebagai null.
  const merged = {
    usia_bulan: usiaBulanAkurat, // <-- Menggunakan umur hasil racikan server
    berat_badan_kg: parsed.data.beratBadanKg ?? existing.berat_badan_kg,
    tinggi_badan_cm: parsed.data.tinggiBadanCm ?? existing.tinggi_badan_cm,
    tanggal_pengukuran: tanggalPengukuranFinal,
    lingkar_kepala_cm:
      parsed.data.lingkarKepalaCm !== undefined
        ? parsed.data.lingkarKepalaCm
        : existing.lingkar_kepala_cm,
    lingkar_lengan_cm:
      parsed.data.lilaCm !== undefined
        ? parsed.data.lilaCm
        : existing.lingkar_lengan_cm,
  };
  let zScoreBBU: number | null = null;
  let zScoreTBU: number | null = null;
  let zScoreBBTB: number | null = null;
  let zScoreIMTU: number | null = null;
  let zScoreLKA: number | null = null;
  let zScoreLILA: number | null = null;
  let statusGizi: string | null = null;

  if (jenisKelamin) {
    // 4 Indikator Dasar & IMTU (Wajib dihitung karena BB dan TB wajib ada)
    zScoreBBU = hitungZScore(
      jenisKelamin,
      "BBU",
      merged.usia_bulan,
      merged.berat_badan_kg,
    );
    zScoreTBU = hitungZScore(
      jenisKelamin,
      "TBU",
      merged.usia_bulan,
      merged.tinggi_badan_cm,
      merged.tinggi_badan_cm,
    );
    zScoreBBTB = hitungZScore(
      jenisKelamin,
      "BBTB",
      merged.usia_bulan,
      merged.berat_badan_kg,
      merged.tinggi_badan_cm,
    );
    zScoreIMTU = hitungZScore(
      jenisKelamin,
      "IMTU",
      merged.usia_bulan,
      merged.berat_badan_kg,
      merged.tinggi_badan_cm,
    );

    // LKA dan LiLA hanya dihitung jika nilainya ada (tidak null)
    if (merged.lingkar_kepala_cm != null) {
      zScoreLKA = hitungZScore(
        jenisKelamin,
        "LKA",
        merged.usia_bulan,
        merged.lingkar_kepala_cm,
      );
    }

    if (merged.lingkar_lengan_cm != null) {
      zScoreLILA = hitungZScore(
        jenisKelamin,
        "LILA",
        merged.usia_bulan,
        merged.lingkar_lengan_cm,
      );
    }

    statusGizi = getStatusGiziKeseluruhan(zScoreBBU, zScoreTBU, zScoreBBTB);
  }

  const { data, error } = await supabaseAdmin
    .from("pengukuran")
    .update({
      ...merged,
      z_score_bb_u: zScoreBBU,
      z_score_tb_u: zScoreTBU,
      z_score_bb_tb: zScoreBBTB,
      z_score_imt_u: zScoreIMTU,
      z_score_lka_u: zScoreLKA,
      z_score_lila_u: zScoreLILA,
      status_gizi: statusGizi,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    const { status, body: errBody } = pengukuranErrorResponse(error);
    return NextResponse.json(errBody, { status });
  }

  return NextResponse.json({ data: toPengukuran(data) });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const { error } = await supabaseAdmin
    .from("pengukuran")
    .delete()
    .eq("id", id);

  if (error) {
    const { status, body } = pengukuranErrorResponse(error);
    return NextResponse.json(body, { status });
  }

  return NextResponse.json({ success: true });
}
