import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { toBalita, balitaErrorResponse } from "@/lib/supabase/balita-transform";
import { z } from "zod";
import type { Balita } from "@/lib/data/types";

// ============================================================================
// SKEMA KETAT KHUSUS UNTUK CREATE (POST) - Pendaftaran Balita Baru
// ============================================================================
const balitaCreateSchema = z.object({
  nik: z.string().regex(/^\d{16}$/, "NIK harus 16 digit angka"),
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
  // BARU: Kolom riwayatPenyakit diganti jadi noTelp dengan validasi HP
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
  // sumberData dihapus agar diisi otomatis oleh default value Supabase
  catatanValidasi: z.string().nullable().optional(),
});

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("balita")
    .select("*")
    .order("nama_lengkap", { ascending: true });

  if (error) {
    const { status, body } = balitaErrorResponse(error);
    return NextResponse.json(body, { status });
  }

  const balitaList: Balita[] = (data ?? []).map(toBalita);
  return NextResponse.json({ data: balitaList });
}

export async function POST(request: Request) {
  const body = await request.json();

  const parsed = balitaCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", detail: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const rowToInsert = {
    nik: parsed.data.nik,
    nama_lengkap: parsed.data.namaLengkap,
    tanggal_lahir: parsed.data.tanggalLahir,
    jenis_kelamin: parsed.data.jenisKelamin,
    nama_ibu: parsed.data.namaIbu,
    nama_ayah: parsed.data.namaAyah,
    nik_ortu: parsed.data.nikOrtu || null,
    berat_lahir_kg: parsed.data.beratLahirKg,
    panjang_lahir_cm: parsed.data.panjangLahirCm,
    no_telp: parsed.data.noTelp || null, // BARU: Mapping ke DB no_telp
    alamat: null,
    kelompok_dasawisma: parsed.data.kelompokDasawisma,
    status: parsed.data.status,
    // sumber_data dihapus dari payload insert
    catatan_validasi: parsed.data.catatanValidasi || null,
  };

  const { data, error } = await supabaseAdmin
    .from("balita")
    .insert(rowToInsert)
    .select("*")
    .single();

  if (error) {
    const { status, body: errBody } = balitaErrorResponse(error);
    return NextResponse.json(errBody, { status });
  }

  return NextResponse.json({ data: toBalita(data) }, { status: 201 });
}
