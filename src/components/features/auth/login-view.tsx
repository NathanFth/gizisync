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
  User,
  Baby,
  FileBarChart,
  Activity,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function LoginView() {
  const setUser = useStore((s) => s.setUser);
  // Default kosong agar kader mengisi sendiri email aslinya
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
        email: email,
        password: password,
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

        // Simpan sesi ke Zustand agar UI langsung ter-update (Nama kader muncul)
        setUser({
          username: data.user.email!,
          namaLengkap:
            data.user.user_metadata?.nama_lengkap ||
            data.user.email!.split("@")[0],
          peran: "Kader Posyandu",
          loginAt: new Date().toISOString(),
        });

        // Redirect ke dashboard secara hard-reload agar middleware membaca cookie baru
        window.location.href = "/";
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem", {
        description: "Tidak dapat terhubung ke server.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel - decorative */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-12 text-white lg:flex">
        {/* Decorative circles */}
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute right-1/3 top-1/4 h-40 w-40 rounded-full bg-teal-300/20 blur-2xl" />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Heart className="h-6 w-6 text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">GiziSync</h1>
            <p className="text-xs text-emerald-100">
              Sistem Informasi Posyandu
            </p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold leading-tight">
            Manajemen Data Gizi Posyandu jadi Lebih Mudah
          </h2>
          <p className="mt-4 text-emerald-50">
            Pantau tumbuh kembang balita, deteksi dini stunting dengan standar
            WHO, dan kelola laporan bulanan Posyandu dalam satu platform
            terintegrasi.
          </p>

          {/* Feature pills */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            <FeaturePill
              icon={Activity}
              title="Z-Score WHO"
              desc="Perhitungan LMS akurat"
            />
            <FeaturePill
              icon={TrendingUp}
              title="Growth Tracking"
              desc="Grafik pertumbuhan"
            />
            <FeaturePill
              icon={Baby}
              title="Register Balita"
              desc="Data balita real-time"
            />
            <FeaturePill
              icon={FileBarChart}
              title="Laporan Bulanan"
              desc="Ekspor PDF & Excel"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-emerald-100">
          <span>© 2026 GiziSync · Posyandu Melati RW 06</span>
          <span>v2.0.0</span>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
              <Heart className="h-6 w-6 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                GiziSync
              </h1>
              <p className="text-xs text-muted-foreground">
                Sistem Informasi Posyandu
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Masuk ke Akun
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Selamat datang kembali. Silakan masuk untuk melanjutkan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Kader</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh: siti@gizisync.com"
                  className="pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Kata Sandi</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="px-9"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={
                    showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-emerald-600 py-2.5 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Memproses...
                </span>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Sistem Informasi GiziSync dilindungi oleh enkripsi Supabase Auth.
          </p>
        </div>
      </div>
    </div>
  );
}

function FeaturePill({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Heart;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-white/10 p-3 backdrop-blur-sm">
      <Icon className="h-5 w-5 shrink-0 text-emerald-100" />
      <div>
        <p className="text-xs font-semibold">{title}</p>
        <p className="text-[10px] text-emerald-100/80">{desc}</p>
      </div>
    </div>
  );
}
