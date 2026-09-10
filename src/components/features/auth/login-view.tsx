"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  Heart,
  Lock,
  Mail,
  Baby,
  FileBarChart,
  Activity,
  TrendingUp,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/* ─────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────── */

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-[2.5px] border-white/30 border-t-white" />
  );
}

function GlassFeaturePill({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Heart;
  title: string;
  desc: string;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-md transition-all duration-200 hover:border-white/35 hover:bg-white/18">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/10 transition-colors group-hover:bg-white/28">
        <Icon className="h-[15px] w-[15px] text-white" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[12.5px] font-semibold leading-none text-white">
          {title}
        </p>
        <p className="mt-[3px] truncate text-[10.5px] leading-none text-emerald-100/75">
          {desc}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Organic SVG Background — desktop only (tidak berubah)
───────────────────────────────────────────────────────────── */
function OrganicBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 hidden lg:block"
      aria-hidden="true"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0"
      >
        <defs>
          <linearGradient id="lp-grad" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="45%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
          <radialGradient id="lp-glow" cx="30%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0" />
          </radialGradient>
          <filter id="soft-blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
          </filter>
        </defs>

        <path
          d="M 0 0
             L 62 0
             C 52 8,  72 22, 58 38
             C 44 54, 68 66, 56 82
             C 48 93, 58 100, 58 100
             L 0 100
             Z"
          fill="url(#lp-grad)"
        />
        <path
          d="M 0 0
             L 62 0
             C 52 8,  72 22, 58 38
             C 44 54, 68 66, 56 82
             C 48 93, 58 100, 58 100
             L 0 100
             Z"
          fill="url(#lp-glow)"
        />
        <path
          d="M 62 0
             C 52 8,  72 22, 58 38
             C 44 54, 68 66, 56 82
             C 48 93, 58 100, 58 100"
          fill="none"
          stroke="white"
          strokeWidth="0.15"
          strokeOpacity="0.22"
          filter="url(#soft-blur)"
        />
      </svg>

      {/* Glassmorphism ambient blobs */}
      <div className="absolute -left-16 -top-20 h-80 w-80 rounded-full bg-emerald-300/25 blur-[64px]" />
      <div className="absolute left-[18%] top-[12%] h-60 w-60 rounded-full bg-teal-300/18 blur-[48px]" />
      <div className="absolute bottom-4 left-[8%] h-72 w-72 rounded-full bg-emerald-400/20 blur-[56px]" />
      <div className="absolute bottom-[28%] left-[32%] h-40 w-40 rounded-full bg-teal-200/15 blur-[36px]" />

      {/* Geometric glass accents */}
      <div className="absolute left-[30%] top-[16%] h-28 w-28 rotate-[28deg] rounded-3xl border border-white/12 bg-white/5 backdrop-blur-sm" />
      <div className="absolute bottom-[22%] left-[7%] h-20 w-20 rounded-full border border-white/12 bg-white/5 backdrop-blur-sm" />
      <div className="absolute left-[38%] top-[52%] h-14 w-14 rotate-[15deg] rounded-2xl border border-white/10 bg-white/4 backdrop-blur-sm" />
      <div className="absolute left-[15%] top-[48%] h-10 w-10 rounded-xl border border-white/10 bg-white/4 backdrop-blur-sm" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Mobile hero background
   Gradient lives INSIDE the hero <section>, so it can never
   drift under the login form — heading & subtitle always sit
   on clean white and stay readable.
───────────────────────────────────────────────────────────── */
function MobileHeroBackground() {
  return (
    <div className="absolute inset-0 lg:hidden" aria-hidden="true">
      {/* Base gradient — senada dengan desktop (emerald → teal) */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-teal-700" />

      {/* Soft radial glow untuk kedalaman */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_20%_0%,rgba(52,211,153,0.30),transparent_60%)]" />

      {/* Ambient blobs */}
      <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-emerald-300/25 blur-[52px]" />
      <div className="absolute -left-12 bottom-16 h-40 w-40 rounded-full bg-teal-300/20 blur-[44px]" />

      {/* Aksen kaca */}
      <div className="absolute right-7 top-24 h-14 w-14 rotate-[18deg] rounded-2xl border border-white/15 bg-white/[0.07]" />
      <div className="absolute right-24 top-11 h-7 w-7 rounded-full border border-white/15 bg-white/10" />

      {/* Gelombang organik di dasar hero — transisi mulus ke area putih */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 block h-14 w-full"
      >
        <path
          d="M 0 100 L 0 58 C 14 34, 32 70, 50 52 C 68 34, 84 64, 100 44 L 100 100 Z"
          fill="#ffffff"
        />
        <path
          d="M 0 58 C 14 34, 32 70, 50 52 C 68 34, 84 64, 100 44"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main LoginView
───────────────────────────────────────────────────────────── */
export function LoginView() {
  const setUser = useStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Mohon isi email dan kata sandi");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Login gagal", {
          description:
            error.message === "Invalid login credentials"
              ? "Email atau kata sandi salah."
              : error.message,
        });
        setLoading(false);
        return;
      }

      if (data.user) {
        toast.success("Selamat datang kembali!", {
          description: "Login berhasil",
        });

        // Ambil nama asli dari tabel kader, bukan dari auth metadata
        const { data: kaderData } = await supabase
          .from("kader")
          .select("nama_lengkap")
          .eq("id", data.user.id)
          .single();

        setUser({
          username: data.user.email!,
          namaLengkap:
            kaderData?.nama_lengkap || data.user.email!.split("@")[0],
          peran: "Kader Posyandu",
          loginAt: new Date().toISOString(),
        });

        window.location.href = "/";
      }
    } catch {
      toast.error("Terjadi kesalahan sistem", {
        description: "Tidak dapat terhubung ke server.",
      });
      setLoading(false);
    }
  };

  return (
    /* Mobile: halaman mengalir & bisa di-scroll (min-h-screen).
       Desktop: split-screen tetap full-viewport. */
    <div className="relative min-h-screen w-full bg-white lg:h-screen lg:overflow-hidden">
      {/* ── Desktop background ── */}
      <OrganicBackground />

      <div className="relative z-10 flex min-h-screen flex-col lg:h-full lg:flex-row">
        {/* ══ LEFT: Mobile hero + Desktop branding ══ */}
        <section className="relative flex flex-col overflow-hidden px-7 pb-16 pt-7 lg:w-[57%] lg:justify-between lg:overflow-visible lg:px-14 lg:py-14">
          <MobileHeroBackground />

          {/* ── Mobile hero content ── */}
          <div className="relative animate-in fade-in slide-in-from-bottom-3 duration-500 lg:hidden">
            {/* Brand row */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/25 backdrop-blur-sm">
                <Heart className="h-[18px] w-[18px] text-white" fill="white" />
              </div>
              <div>
                <p className="text-[17px] font-bold leading-none tracking-tight text-white">
                  GiziSync
                </p>
                <p className="mt-1 text-[10px] leading-none text-emerald-100/80">
                  Sistem Informasi Posyandu
                </p>
              </div>
            </div>

            {/* Headline */}
            <h2 className="mt-6 text-[27px] font-bold leading-[1.16] tracking-tight text-white">
              Manajemen Data Gizi
              <br />
              <span className="text-emerald-200">Lebih Mudah</span>
            </h2>
            <p className="mt-2.5 max-w-[300px] text-[12px] leading-[1.6] text-emerald-100/75">
              Pantau tumbuh kembang balita dan deteksi stunting dini berstandar
              WHO.
            </p>

            {/* Feature pills 2×2 */}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <GlassFeaturePill
                icon={Activity}
                title="Z-Score WHO"
                desc="Perhitungan LMS akurat"
              />
              <GlassFeaturePill
                icon={TrendingUp}
                title="Growth Tracking"
                desc="Grafik pertumbuhan"
              />
              <GlassFeaturePill
                icon={Baby}
                title="Register Balita"
                desc="Data balita real-time"
              />
              <GlassFeaturePill
                icon={FileBarChart}
                title="Laporan Bulanan"
                desc="Ekspor PDF & Excel"
              />
            </div>
          </div>

          {/* ── Desktop full brand content ── */}
          <div className="hidden h-full animate-in flex-col justify-between fade-in duration-700 lg:flex">
            {/* Top: logo + badge */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/25 backdrop-blur-sm">
                <Heart className="h-6 w-6 text-white" fill="white" />
              </div>
              <div>
                <p className="text-xl font-bold leading-none tracking-tight text-white">
                  GiziSync
                </p>
                <p className="mt-[3px] text-[11px] leading-none text-emerald-100/85">
                  Sistem Informasi Posyandu
                </p>
              </div>
              <span className="ml-2 flex items-center gap-1 rounded-full border border-white/20 bg-white/12 px-2.5 py-1 text-[9.5px] font-medium text-emerald-100 backdrop-blur-sm">
                <Sparkles className="h-2.5 w-2.5" />
                Cempaka 6 · v1.0
              </span>
            </div>

            {/* Middle: headline + copy + pills */}
            <div className="max-w-[310px]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/65">
                Platform Kesehatan Anak
              </p>
              <h2 className="mt-3.5 text-[38px] font-bold leading-[1.13] tracking-tight text-white">
                Manajemen
                <br />
                Data Gizi
                <br />
                <span className="text-emerald-200">Lebih Mudah</span>
              </h2>
              <p className="mt-4 text-[13px] leading-[1.65] text-emerald-100/72">
                Pantau tumbuh kembang balita, deteksi stunting dini berstandar
                WHO, dan kelola laporan Posyandu dalam satu platform
                terintegrasi.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-2.5">
                <GlassFeaturePill
                  icon={Activity}
                  title="Z-Score WHO"
                  desc="Perhitungan LMS akurat"
                />
                <GlassFeaturePill
                  icon={TrendingUp}
                  title="Growth Tracking"
                  desc="Grafik pertumbuhan"
                />
                <GlassFeaturePill
                  icon={Baby}
                  title="Register Balita"
                  desc="Data balita real-time"
                />
                <GlassFeaturePill
                  icon={FileBarChart}
                  title="Laporan Bulanan"
                  desc="Ekspor PDF & Excel"
                />
              </div>
            </div>

            {/* Bottom: footer */}
            <p className="text-[11px] text-emerald-200/45">
              © 2026 GiziSync · Posyandu Cempaka 6 · v1.0
            </p>
          </div>
        </section>

        {/* ══ RIGHT: Form panel ══ */}
        {/*
          Mobile: selalu di bawah hero → heading & subtitle
          dijamin berada di atas background putih.
          Desktop: kartu form tetap di tengah area putih.
        */}
        <section className="relative flex flex-1 items-start justify-center px-6 pb-10 pt-5 lg:items-center lg:overflow-y-auto lg:px-14 lg:py-0">
          <div className="w-full max-w-[340px] animate-in fade-in slide-in-from-bottom-3 fill-mode-both [animation-delay:120ms]">
            {/* Form heading — kini selalu terlihat di mobile */}
            <div className="mb-7">
              <h1 className="text-[26px] font-bold leading-tight tracking-tight text-gray-900">
                Selamat Datang
              </h1>
              <p className="mt-1.5 text-[13.5px] leading-snug text-gray-500">
                Masuk untuk mengelola data posyandu Anda.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email field */}
              <div className="space-y-[7px]">
                <Label
                  htmlFor="email"
                  className="text-[12.5px] font-semibold text-gray-700"
                >
                  Email Kader
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kader@gizisync.id"
                    className="h-11 rounded-xl border-gray-200 bg-gray-50/60 pl-10 text-[13.5px] transition-all placeholder:text-gray-400/80 focus-visible:border-emerald-500 focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-emerald-500/18"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-[7px]">
                <Label
                  htmlFor="password"
                  className="text-[12.5px] font-semibold text-gray-700"
                >
                  Kata Sandi
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="h-11 rounded-xl border-gray-200 bg-gray-50/60 pl-10 pr-11 text-[13.5px] transition-all placeholder:text-gray-400/80 focus-visible:border-emerald-500 focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-emerald-500/18"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-gray-400 transition-colors hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                    aria-label={
                      showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"
                    }
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit button — gradient senada tema */}
              <Button
                type="submit"
                disabled={loading}
                className="mt-1 h-11 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-[13.5px] font-semibold tracking-wide text-white shadow-lg shadow-emerald-600/30 transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-emerald-700/35 active:scale-[0.988] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Spinner />
                    Memproses…
                  </span>
                ) : (
                  "Masuk ke Akun"
                )}
              </Button>
            </form>

            {/* Security trust badge */}
            <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
              <ShieldCheck className="h-[15px] w-[15px] shrink-0 text-emerald-500" />
              <p className="text-[11px] leading-snug text-gray-500">
                Dilindungi enkripsi end-to-end{" "}
                <span className="font-semibold text-gray-700">
                  Supabase Auth
                </span>
              </p>
            </div>

            {/* Mobile footer */}
            <p className="mt-5 text-center text-[10px] text-gray-400 lg:hidden">
              © 2026 GiziSync · Posyandu Cempaka 6 · v1.0
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
