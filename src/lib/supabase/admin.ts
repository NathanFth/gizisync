import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diset di environment variable server.');
}

// PENTING: file ini HANYA boleh diimpor dari kode sisi server (API routes).
// service_role key melewati RLS sepenuhnya — jika sampai ter-bundle ke kode
// client (browser), seluruh data balita/pengukuran akan terekspos tanpa
// proteksi apa pun. Jangan pernah beri prefix NEXT_PUBLIC_ pada variabel ini.
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});