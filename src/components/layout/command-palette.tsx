'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Search, Baby, Calculator, FileBarChart, LayoutDashboard, Settings, ArrowRight, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';


interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  action: () => void;
  group: string;
}

export function CommandPalette() {
  const setCommandPaletteOpen = useStore((s) => s.setCommandPaletteOpen);
  const setView = useStore((s) => s.setView);
  const viewBalitaDetail = useStore((s) => s.viewBalitaDetail);
  const balitaList = useStore((s) => s.balitaList);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const navCommands: CommandItem[] = [
    // Fase 3.7: sync with sidebar navItems (sidebar.tsx). Removed modules
    // (Imunisasi, Vitamin A, PMT, Ibu Hamil, Jadwal, Analitik) are not exposed
    // in the command palette for the demo build — this matches the sidebar
    // where those entries are commented out.
    { id: 'nav-dashboard', label: 'Dashboard', description: 'Lihat ringkasan data', icon: LayoutDashboard, action: () => setView('dashboard'), group: 'Navigasi' },
    { id: 'nav-balita', label: 'Buku Register Balita', description: 'Daftar semua balita', icon: Baby, action: () => setView('balita'), group: 'Navigasi' },
    { id: 'nav-kalkulator', label: 'Kalkulator Z-Score', description: 'Hitung status gizi WHO', icon: Calculator, action: () => setView('kalkulator'), group: 'Navigasi' },
    { id: 'nav-laporan', label: 'Laporan Bulanan', description: 'Rekap pemeriksaan bulanan', icon: FileBarChart, action: () => setView('laporan'), group: 'Navigasi' },
    { id: 'nav-pengaturan', label: 'Pengaturan Akun', description: 'Kelola profil & posyandu', icon: Settings, action: () => setView('pengaturan'), group: 'Navigasi' },
  ];

  const balitaCommands: CommandItem[] = balitaList.slice(0, 50).map((b) => ({
    id: `balita-${b.id}`,
    label: b.namaLengkap,
    description: `${b.usiaBulan} bulan · ${b.jenisKelamin} · NIK: ${b.nik.slice(0, 6)}...`,
    icon: Baby,
    action: () => viewBalitaDetail(b.id),
    group: 'Balita',
  }));

  // Fase 3.7: Ibu Hamil commands removed — module disabled in demo build.
  const allCommands = [...navCommands, ...balitaCommands];

  const filtered = useMemo(() => {
    if (!query.trim()) return allCommands;
    const q = query.toLowerCase();
    return allCommands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q),
    );
  }, [query, allCommands]);

  // Group filtered results
  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filtered.forEach((c) => {
      if (!groups[c.group]) groups[c.group] = [];
      groups[c.group].push(c);
    });
    return groups;
  }, [filtered]);

  const flatFiltered = filtered;

  // Clamp activeIndex to valid range (handles filtered list shrinking)
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, flatFiltered.length - 1));

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setActiveIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = flatFiltered[safeActiveIndex];
      if (item) {
        item.action();
        setCommandPaletteOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCommandPaletteOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[15vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCommandPaletteOpen(false)} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cari balita atau navigasi..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {flatFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground">Tidak ada hasil</p>
              <p className="text-xs text-muted-foreground">Coba kata kunci lain</p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-2">
                <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group}
                </p>
                <ul>
                  {items.map((item) => {
                    const idx = flatFiltered.indexOf(item);
                    const active = idx === safeActiveIndex;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => {
                            item.action();
                            setCommandPaletteOpen(false);
                          }}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                        >
                          <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-sm font-medium ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
                              {item.label}
                            </p>
                            {item.description && (
                              <p className={`truncate text-xs ${active ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                {item.description}
                              </p>
                            )}
                          </div>
                          {active && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary-foreground" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-medium">↑↓</kbd> navigasi
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-medium">↵</kbd> pilih
            </span>
          </div>
          <span>{flatFiltered.length} hasil</span>
        </div>
      </div>
    </div>
  );
}
