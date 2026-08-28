"use client";

import { cn } from "@/lib/utils";
import { useStore, type AppView } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Baby,
  Calculator,
  HeartPulse,
  FileBarChart,
  Settings,
  X,
  Heart,
  Syringe,
  LogOut,
  Droplet,
  Utensils,
  Calendar,
  BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  view: AppView;
  icon: LucideIcon;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", view: "dashboard", icon: LayoutDashboard },
  { label: "Buku Data Balita", view: "balita", icon: Baby },
  { label: "Pengukuran Z-Score", view: "kalkulator", icon: Calculator },
  // { label: 'Imunisasi', view: 'imunisasi', icon: Syringe },
  // { label: 'Vitamin A', view: 'vitamin-a', icon: Droplet },
  // { label: 'PMT', view: 'pmt', icon: Utensils },
  // { label: "Data Ibu Hamil", view: "ibu-hamil", icon: HeartPulse },
  // { label: 'Jadwal Posyandu', view: 'jadwal', icon: Calendar },
  { label: "Laporan Bulanan", view: "laporan", icon: FileBarChart },
  // { label: 'Analitik', view: 'analitik', icon: BarChart3 },
];

const bottomNavItems: NavItem[] = [
  // FASE 3.7: Menu Pengaturan dinonaktifkan (di-comment) karena tidak masuk scope skripsi
  // { label: "Pengaturan", view: "pengaturan", icon: Settings },
];

export function Sidebar() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const logoutState = useStore((s) => s.logout);

  // FASE 3.7: Ambil user asli dari Supabase Auth via Zustand
  const user = useStore((s) => s.user);

  const totalBalita = useStore((s) => s.balitaList.length);
  const totalPengukuran = useStore((s) => s.pengukuranList.length);

  // Fungsi Logout Mutlak ke Supabase Server
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    logoutState(); // Bersihkan state lokal
    window.location.href = "/login"; // Hard redirect ke login
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
              <Heart className="h-5 w-5 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-sidebar-foreground">
                GiziSync
              </h1>
              <p className="text-[10px] font-medium text-muted-foreground">
                Posyandu RW 06
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent lg:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Menu Utama
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active =
                view === item.view ||
                (item.view === "balita" && view === "balita-detail") ||
                (item.view === "ibu-hamil" && view === "ibu-hamil-detail");
              return (
                <li key={item.view}>
                  <button
                    type="button"
                    onClick={() => setView(item.view)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        active ? "text-primary-foreground" : "",
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {bottomNavItems.length > 0 && (
            <>
              <p className="px-3 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sistem
              </p>
              <ul className="space-y-1">
                {bottomNavItems.map((item) => {
                  const active = view === item.view;
                  return (
                    <li key={item.view}>
                      <button
                        type="button"
                        onClick={() => setView(item.view)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5 shrink-0",
                            active ? "text-primary-foreground" : "",
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </nav>

        {/* Quick Stats */}
        <div className="border-t border-sidebar-border px-3 py-3">
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Statistik Cepat
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded-lg bg-sidebar-accent/50 p-2 text-center">
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {totalBalita}
              </p>
              <p className="text-[9px] text-muted-foreground">Balita</p>
            </div>
            <div className="rounded-lg bg-sidebar-accent/50 p-2 text-center">
              <p className="text-base font-bold text-sky-600 dark:text-sky-400">
                {totalPengukuran}
              </p>
              <p className="text-[9px] text-muted-foreground">Pengukuran</p>
            </div>
          </div>
        </div>

        {/* User profile */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white uppercase">
              {/* Menampilkan huruf pertama dari nama kader asli */}
              {user?.namaLengkap?.charAt(0) || "K"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-sidebar-foreground capitalize">
                {/* Menampilkan nama kader asli */}
                {user?.namaLengkap || "Kader Posyandu"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.peran || "Admin"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-destructive"
              aria-label="Keluar"
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
