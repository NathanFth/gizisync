import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  toPengukuran,
  pengukuranErrorResponse,
} from "@/lib/supabase/pengukuran-transform";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("pengukuran")
    .select("*")
    .order("tanggal_pengukuran", { ascending: false });

  if (error) {
    const { status, body } = pengukuranErrorResponse(error);
    return NextResponse.json(body, { status });
  }

  return NextResponse.json({ data: (data ?? []).map(toPengukuran) });
}
