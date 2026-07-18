'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Heart, Lock, User, ShieldCheck, Activity, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export function LoginView() {
  const login = useStore((s) => s.login);
  const [username, setUsername] = useState('admin.rw06');
  const [password, setPassword] = useState('posyandu123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Mohon isi username dan password');
      return;
    }
    setLoading(true);
    // Simulate auth delay
    setTimeout(() => {
      const ok = login(username, password);
      if (ok) {
        toast.success('Selamat datang kembali!', { description: 'Login berhasil' });
      } else {
        toast.error('Login gagal', { description: 'Periksa kembali kredensial Anda' });
      }
      setLoading(false);
    }, 600);
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
            <p className="text-xs text-emerald-100">Sistem Informasi Posyandu</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold leading-tight">
            Manajemen Data Gizi Posyandu jadi Lebih Mudah
          </h2>
          <p className="mt-4 text-emerald-50">
            Pantau tumbuh kembang balita, deteksi dini stunting dengan standar WHO, dan kelola data ibu hamil dalam satu platform terintegrasi.
          </p>

          {/* Feature pills */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            <FeaturePill icon={Activity} title="Z-Score WHO" desc="Perhitungan LMS akurat" />
            <FeaturePill icon={TrendingUp} title="Growth Tracking" desc="Grafik pertumbuhan" />
            <FeaturePill icon={ShieldCheck} title="Imunisasi" desc="Jadwal PD3I" />
            <FeaturePill icon={Heart} title="Ibu Hamil" desc="Deteksi KEK" />
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
              <h1 className="text-xl font-bold tracking-tight text-foreground">GiziSync</h1>
              <p className="text-xs text-muted-foreground">Sistem Informasi Posyandu</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Masuk ke Akun</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Selamat datang kembali. Silakan masuk untuk melanjutkan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin.rw06"
                  className="pl-9"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Kata Sandi</Label>
                <button type="button" className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
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
                  aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-input text-emerald-600 focus:ring-emerald-500/20" />
              Ingat saya selama 30 hari
            </label>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 py-2.5 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Memproses...
                </span>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/30 p-3.5">
            <p className="text-xs font-medium text-muted-foreground">Demo kredensial:</p>
            <p className="mt-1 font-mono text-xs text-foreground">
              Username: <span className="font-semibold text-emerald-600 dark:text-emerald-400">admin.rw06</span>
              {' · '}
              Password: <span className="font-semibold text-emerald-600 dark:text-emerald-400">posyandu123</span>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Dengan masuk, Anda menyetujui Syarat & Ketentuan dan Kebijakan Privasi GiziSync.
          </p>
        </div>
      </div>
    </div>
  );
}

function FeaturePill({ icon: Icon, title, desc }: { icon: typeof Heart; title: string; desc: string }) {
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
