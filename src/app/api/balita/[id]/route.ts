import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  balitaUpdateSchema, // <--- SKEMA LONGGAR: Mengizinkan data bolong untuk balita hasil impor
  toBalita,
  toRow,
  balitaErrorResponse,
  BALITA_SELECT_WITH_KADER,
} from "@/lib/supabase/balita-transform";
import { getCurrentKaderId } from "@/lib/supabase/current-kader";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("balita")
    .select(BALITA_SELECT_WITH_KADER)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { error: "Balita tidak ditemukan." },
        { status: 404 },
      );
    }
    const { status, body } = balitaErrorResponse(error);
    return NextResponse.json(body, { status });
  }

  return NextResponse.json({ data: toBalita(data) });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();

  // 1. Validasi Longgar (Mode Edit)
  // Hanya mengecek field yang dikirim. Kalau NIK/Gender kosong dari sananya, form tetap lolos!
  const parsed = balitaUpdateSchema.safeParse(body);
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

  // 2. Mapping ke DB dengan toRow yang sudah pintar (Otomatis handle NIK Ortu kosong -> null)
  //    updated_by disisipkan di sini, di luar toRow(), supaya tidak bisa datang dari body client.
  const { data, error } = await supabaseAdmin
    .from("balita")
    .update({ ...toRow(parsed.data), updated_by: kaderId })
    .eq("id", id)
    .select(BALITA_SELECT_WITH_KADER)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { error: "Balita tidak ditemukan." },
        { status: 404 },
      );
    }
    const { status, body: errBody } = balitaErrorResponse(error);
    return NextResponse.json(errBody, { status });
  }

  return NextResponse.json({ data: toBalita(data) });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  // Baris pengukuran anak ikut terhapus otomatis lewat ON DELETE CASCADE
  // yang sudah didefinisikan di DDL — tidak perlu dihapus manual di sini.
  const { error } = await supabaseAdmin.from("balita").delete().eq("id", id);

  if (error) {
    const { status, body } = balitaErrorResponse(error);
    return NextResponse.json(body, { status });
  }

  return NextResponse.json({ success: true });
}
