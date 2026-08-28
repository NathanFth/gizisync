"use client";

// BARU: Tambahkan useRef
import { useEffect, useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { DashboardView } from "@/components/features/dashboard/dashboard-view";
import { BalitaRegisterView } from "@/components/features/balita/balita-register-view";
import { BalitaDetailView } from "@/components/features/balita/balita-detail-view";
import { KalkulatorView } from "@/components/features/kalkulator/kalkulator-view";
import { IbuHamilView } from "@/components/features/ibu-hamil/ibu-hamil-view";
import { IbuHamilDetailView } from "@/components/features/ibu-hamil/ibu-hamil-detail-view";
import { LaporanView } from "@/components/features/laporan/laporan-view";
import { PengaturanView } from "@/components/features/pengaturan/pengaturan-view";
import { ImunisasiView } from "@/components/features/imunisasi/imunisasi-view";
import { VitaminAView } from "@/components/features/vitamin-a/vitamin-a-view";
// import { PMTView } from "@/components/features/pmt/pmt-view";
import { JadwalView } from "@/components/features/jadwal/jadwal-view";
import { AnalitikView } from "@/components/features/analitik/analitik-view";
import { LoginView } from "@/components/features/auth/login-view";
import { NotificationsDropdown } from "@/components/layout/notifications-dropdown";
import { CommandPalette } from "@/components/layout/command-palette";
import { ShortcutsHelpModal } from "@/components/layout/shortcuts-help";

export default function Home() {
  const view = useStore((s) => s.view);
  const theme = useStore((s) => s.theme);
  const user = useStore((s) => s.user);
  const commandPaletteOpen = useStore((s) => s.commandPaletteOpen);
  const toggleTheme = useStore((s) => s.toggleTheme);

  // Ekstrak fetch dari store agar bisa dipanggil
  const fetchBalitaList = useStore((s) => s.fetchBalitaList);
  const fetchPengukuranList = useStore((s) => s.fetchPengukuranList);

  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // BARU: Referensi untuk wadah scroll
  const mainRef = useRef<HTMLElement>(null);

  // BARU: Efek pemicu scroll-to-top otomatis setiap kali view berubah
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [view]);

  // Efek Pemicu Utama: Memanggil data dari Supabase begitu user berhasil login
  useEffect(() => {
    if (user) {
      fetchBalitaList();
      fetchPengukuranList();
    }
  }, [user, fetchBalitaList, fetchPengukuranList]);

  // Apply theme on mount and when it changes.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input/textarea
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Cmd+K / Ctrl+K — Command palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useStore
          .getState()
          .setCommandPaletteOpen(!useStore.getState().commandPaletteOpen);
        return;
      }

      // Skip other shortcuts if typing
      if (isTyping) return;

      // ? — Help modal
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
        return;
      }

      // T — Toggle theme
      if (e.key.toLowerCase() === "t" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toggleTheme();
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleTheme]);

  // Auth gate
  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <Header />
        <NotificationsDropdown />
        {/* BARU: Memasang ref ke tag main */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 lg:p-6">
          {view === "dashboard" && <DashboardView />}
          {view === "balita" && <BalitaRegisterView />}
          {view === "balita-detail" && <BalitaDetailView />}
          {view === "kalkulator" && <KalkulatorView />}
          {view === "ibu-hamil" && <IbuHamilView />}
          {view === "ibu-hamil-detail" && <IbuHamilDetailView />}
          {view === "laporan" && <LaporanView />}
          {view === "pengaturan" && <PengaturanView />}
          {view === "imunisasi" && <ImunisasiView />}
          {view === "vitamin-a" && <VitaminAView />}
          {/* {view === "pmt" && <PMTView />} */}
          {view === "jadwal" && <JadwalView />}
          {view === "analitik" && <AnalitikView />}
        </main>
      </div>
      {commandPaletteOpen && <CommandPalette />}
      <ShortcutsHelpModal
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </div>
  );
}