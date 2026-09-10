import { createClient } from "@/lib/supabase/server";

/**
 * Mengambil ID kader yang sedang login dari sesi (cookie-aware Supabase client).
 *
 * PENTING: created_by / updated_by TIDAK PERNAH boleh diambil dari body request —
 * harus selalu dari sesi server-side seperti ini, supaya kader tidak bisa
 * menyamar sebagai kader lain lewat payload API.
 *
 * middleware.ts sudah memblokir request tanpa sesi valid sebelum sampai ke route
 * handler manapun, jadi return null di sini seharusnya tidak pernah terjadi pada
 * alur normal. Tetap dicek eksplisit di setiap route sebagai defense-in-depth,
 * bukan untuk menggantikan middleware.
 */
export async function getCurrentKaderId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}
