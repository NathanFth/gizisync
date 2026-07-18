'use client';

import { useState } from 'react';
import { useStore, useUnreadNotifikasiCount } from '@/lib/store';
import { NotificationsPanel } from '@/components/layout/notifications-dropdown';
import { ShortcutsHelpModal } from '@/components/layout/shortcuts-help';
import { Menu, Sun, Moon, Bell, Search, Command, Keyboard } from 'lucide-react';

const viewTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Ringkasan data Posyandu hari ini' },
  balita: { title: 'Buku Register Balita', subtitle: 'Daftar balita terdaftar di Posyandu' },
  'balita-detail': { title: 'Detail Anak', subtitle: 'Profil dan riwayat pengukuran balita' },
  kalkulator: { title: 'Kalkulator Z-Score', subtitle: 'Hitung status gizi berdasarkan standar WHO' },
  // 'ibu-hamil': { title: 'Data Ibu Hamil', subtitle: 'Pemantauan ibu hamil dan risiko KEK' },
  // 'ibu-hamil-detail': { title: 'Detail Ibu Hamil', subtitle: 'Riwayat ANC dan pemantauan kehamilan' },
  // imunisasi: { title: 'Imunisasi', subtitle: 'Pencatatan dan jadwal imunisasi balita' },
  // 'vitamin-a': { title: 'Vitamin A', subtitle: 'Pencatatan distribusi kapsul Vitamin A' },
  // pmt: { title: 'PMT', subtitle: 'Pemberian Makanan Tambahan untuk balita gizi kurang' },
  // jadwal: { title: 'Jadwal Posyandu', subtitle: 'Jadwal kegiatan Posyandu mendatang' },
  laporan: { title: 'Laporan Bulanan', subtitle: 'Rekapitulasi pemeriksaan bulanan Posyandu' },
  // analitik: { title: 'Analitik', subtitle: 'Analisis data dan insight Posyandu' },
  pengaturan: { title: 'Pengaturan Akun', subtitle: 'Kelola profil dan data Posyandu' },
};

export function Header() {
  const view = useStore((s) => s.view);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const namaLengkap = useStore((s) => s.pengaturan.profil.namaLengkap);
  const setCommandPaletteOpen = useStore((s) => s.setCommandPaletteOpen);
  const unreadCount = useUnreadNotifikasiCount();
  const [notifOpen, setNotifOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const config = viewTitles[view] ?? { title: 'GiziSync', subtitle: '' };

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded-md p-2 text-muted-foreground hover:bg-accent lg:hidden"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">{config.title}</h2>
          <p className="hidden text-xs text-muted-foreground sm:block">{config.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Command palette trigger */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="flex h-9 items-center gap-2 rounded-lg border border-input bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted md:w-48 lg:w-60"
          aria-label="Buka pencarian"
        >
          <Search className="h-4 w-4" />
          <span className="hidden flex-1 text-left md:block">Cari balita, ibu hamil...</span>
          <kbd className="hidden items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium sm:flex">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        <p className="hidden text-xs font-medium text-muted-foreground xl:block">{today}</p>

        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Ganti tema"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        <button
          type="button"
          onClick={() => setShortcutsOpen(true)}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Bantuan pintasan keyboard"
          title="Pintasan keyboard (?)"
        >
          <Keyboard className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Notifikasi"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white">
          {namaLengkap.charAt(0)}
        </div>
      </div>

      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      <ShortcutsHelpModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </header>
  );
}
