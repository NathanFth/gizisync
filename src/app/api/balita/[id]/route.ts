import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  balitaUpdateSchema, // <--- SKEMA LONGGAR: Mengizinkan data bolong untuk balita hasil impor
  toBalita,
  toRow,
  balitaErrorResponse,
} from "@/lib/supabase/balita-transform";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("balita")
    .select("*")
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

  // 2. Mapping ke DB dengan toRow yang sudah pintar (Otomatis handle NIK Ortu kosong -> null)
  const { data, error } = await supabaseAdmin
    .from("balita")
    .update(toRow(parsed.data))
    .eq("id", id)
    .select("*")
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
