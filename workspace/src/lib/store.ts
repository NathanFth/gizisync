// =============================================================================
// store.ts — Global state (Zustand) for GiziSync Posyandu dashboard
// =============================================================================

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useMemo } from 'react';
import type {
  AuthUser,
  Balita,
  IbuHamil,
  ImunisasiRecord,
  JadwalPosyandu,
  JenisVaksin,
  KunjunganANC,
  LaporanRecord,
  Notifikasi,
  PMTRecord,
  PengaturanData,
  PengukuranBalita,
  VitaminARecord,
} from './data/types';
import type { AppViewType } from './data/types';
import {
  seedBalitaList,
  seedIbuHamilList,
  seedImunisasi,
  seedJadwal,
  seedKunjunganANC,
  seedLaporanRecords,
  seedNotifikasi,
  seedPMT,
  seedPengaturan,
  seedPengukuran,
  seedVitaminA,
  hitungUsiaBulan,
} from './data/mock-data';
import { hitungZScore, getStatusGizi, getStatusGiziKeseluruhan } from './data/who-reference';

export type AppView = AppViewType;

interface AppState {
  // Auth
  user: AuthUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;

  // Navigation
  view: AppView;
  selectedBalitaId: number | null;
  selectedIbuHamilId: number | null;
  selectedImunisasiBalitaId: number | null;
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  commandPaletteOpen: boolean;

  // Data
  balitaList: Balita[];
  pengukuranList: PengukuranBalita[];
  ibuHamilList: IbuHamil[];
  imunisasiList: ImunisasiRecord[];
  kunjunganANCList: KunjunganANC[];
  vitaminAList: VitaminARecord[];
  pmtList: PMTRecord[];
  jadwalList: JadwalPosyandu[];
  laporanRecords: LaporanRecord[];
  pengaturan: PengaturanData;
  notifikasiList: Notifikasi[];

  // Navigation actions
  setView: (view: AppView) => void;
  viewBalitaDetail: (id: number) => void;
  viewIbuHamilDetail: (id: number) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setCommandPaletteOpen: (open: boolean) => void;

  // Balita CRUD
  addBalita: (data: Omit<Balita, 'id' | 'usiaBulan'>) => void;
  updateBalita: (id: number, data: Partial<Omit<Balita, 'id' | 'usiaBulan'>>) => void;
  deleteBalita: (id: number) => void;

  // Pengukuran CRUD
  addPengukuran: (data: Omit<PengukuranBalita, 'id' | 'zScoreBBU' | 'zScoreTBU' | 'zScoreBBTB' | 'statusGizi'>) => void;
  updatePengukuran: (id: number, data: Partial<PengukuranBalita>) => void;
  deletePengukuran: (id: number) => void;

  // Ibu Hamil CRUD
  addIbuHamil: (data: Omit<IbuHamil, 'id'>) => void;
  updateIbuHamil: (id: number, data: Partial<Omit<IbuHamil, 'id'>>) => void;
  deleteIbuHamil: (id: number) => void;

  // Imunisasi CRUD
  addImunisasi: (data: Omit<ImunisasiRecord, 'id'>) => void;
  deleteImunisasi: (id: number) => void;

  // ANC CRUD
  addKunjunganANC: (data: Omit<KunjunganANC, 'id'>) => void;
  deleteKunjunganANC: (id: number) => void;

  // Vitamin A CRUD
  addVitaminA: (data: Omit<VitaminARecord, 'id'>) => void;
  deleteVitaminA: (id: number) => void;

  // PMT CRUD
  addPMT: (data: Omit<PMTRecord, 'id'>) => void;
  updatePMT: (id: number, data: Partial<PMTRecord>) => void;
  deletePMT: (id: number) => void;

  // Jadwal CRUD
  addJadwal: (data: Omit<JadwalPosyandu, 'id'>) => void;
  updateJadwal: (id: number, data: Partial<JadwalPosyandu>) => void;
  deleteJadwal: (id: number) => void;

  // Notifikasi
  markNotifikasiRead: (id: number) => void;
  markAllNotifikasiRead: () => void;
  addNotifikasi: (data: Omit<Notifikasi, 'id' | 'timestamp' | 'dibaca'>) => void;

  // Pengaturan
  updatePengaturan: (data: Partial<PengaturanData>) => void;
}

let nextBalitaId = 100;
let nextPengukuranId = 1000;
let nextIbuHamilId = 100;
let nextImunisasiId = 1000;
let nextANCId = 1000;
let nextVitaminAId = 1000;
let nextPMTId = 100;
let nextJadwalId = 100;
let nextNotifikasiId = 1000;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // --- Auth ---
      user: null,
      login: (username, password) => {
        // Demo auth: accept admin.rw06 / posyandu123 OR any non-empty username
        if (!username || !password) return false;
        const nama = username === 'admin.rw06' || username === 'admin'
          ? 'Siti Aminah'
          : username.charAt(0).toUpperCase() + username.slice(1);
        set({
          user: {
            username,
            namaLengkap: nama,
            peran: 'Kader Posyandu',
            loginAt: new Date().toISOString(),
          },
          view: 'dashboard',
        });
        return true;
      },
      logout: () => set({ user: null, view: 'dashboard', sidebarOpen: false }),

      // --- Initial state ---
      view: 'dashboard',
      selectedBalitaId: null,
      selectedIbuHamilId: null,
      selectedImunisasiBalitaId: null,
      sidebarOpen: false,
      theme: 'light',
      commandPaletteOpen: false,

      balitaList: seedBalitaList.map((b) => ({ ...b, usiaBulan: hitungUsiaBulan(b.tanggalLahir) })),
      pengukuranList: seedPengukuran,
      ibuHamilList: seedIbuHamilList,
      imunisasiList: seedImunisasi,
      kunjunganANCList: seedKunjunganANC,
      vitaminAList: seedVitaminA,
      pmtList: seedPMT,
      jadwalList: seedJadwal,
      laporanRecords: seedLaporanRecords,
      pengaturan: seedPengaturan,
      notifikasiList: seedNotifikasi,

      // --- Navigation ---
      setView: (view) => set({ view, sidebarOpen: false }),
      viewBalitaDetail: (id) => set({ view: 'balita-detail', selectedBalitaId: id, sidebarOpen: false }),
      viewIbuHamilDetail: (id) => set({ view: 'ibu-hamil-detail', selectedIbuHamilId: id, sidebarOpen: false }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: next });
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', next === 'dark');
        }
      },
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      // --- Balita CRUD ---
      addBalita: (data) =>
        set((state) => ({
          balitaList: [
            ...state.balitaList,
            { ...data, id: ++nextBalitaId, usiaBulan: hitungUsiaBulan(data.tanggalLahir) },
          ],
        })),
      updateBalita: (id, data) =>
        set((state) => ({
          balitaList: state.balitaList.map((b) =>
            b.id === id
              ? { ...b, ...data, usiaBulan: data.tanggalLahir ? hitungUsiaBulan(data.tanggalLahir) : b.usiaBulan }
              : b,
          ),
        })),
      deleteBalita: (id) =>
        set((state) => ({
          balitaList: state.balitaList.filter((b) => b.id !== id),
          pengukuranList: state.pengukuranList.filter((p) => p.balitaId !== id),
          selectedBalitaId: state.selectedBalitaId === id ? null : state.selectedBalitaId,
        })),

      // --- Pengukuran CRUD (auto-computes Z-scores via WHO LMS) ---
      addPengukuran: (data) => {
        const balita = get().balitaList.find((b) => b.id === data.balitaId);
        if (!balita) return;
        const zBBU = hitungZScore(balita.jenisKelamin, 'BBU', data.usiaBulan, data.beratBadanKg);
        const zTBU = hitungZScore(balita.jenisKelamin, 'TBU', data.usiaBulan, data.tinggiBadanCm, data.tinggiBadanCm);
        const zBBTB = hitungZScore(balita.jenisKelamin, 'BBTB', data.usiaBulan, data.beratBadanKg, data.tinggiBadanCm);
        const statusGizi = getStatusGiziKeseluruhan(zBBU, zTBU, zBBTB);
        set((state) => ({
          pengukuranList: [
            ...state.pengukuranList,
            { ...data, id: ++nextPengukuranId, zScoreBBU: zBBU, zScoreTBU: zTBU, zScoreBBTB: zBBTB, statusGizi },
          ],
        }));
      },
      updatePengukuran: (id, data) =>
        set((state) => ({
          pengukuranList: state.pengukuranList.map((p) => {
            if (p.id !== id) return p;
            const merged = { ...p, ...data };
            const balita = state.balitaList.find((b) => b.id === merged.balitaId);
            if (!balita) return merged;
            const zBBU = hitungZScore(balita.jenisKelamin, 'BBU', merged.usiaBulan, merged.beratBadanKg);
            const zTBU = hitungZScore(balita.jenisKelamin, 'TBU', merged.usiaBulan, merged.tinggiBadanCm, merged.tinggiBadanCm);
            const zBBTB = hitungZScore(balita.jenisKelamin, 'BBTB', merged.usiaBulan, merged.beratBadanKg, merged.tinggiBadanCm);
            return {
              ...merged,
              zScoreBBU: zBBU,
              zScoreTBU: zTBU,
              zScoreBBTB: zBBTB,
              statusGizi: getStatusGiziKeseluruhan(zBBU, zTBU, zBBTB),
            };
          }),
        })),
      deletePengukuran: (id) =>
        set((state) => ({
          pengukuranList: state.pengukuranList.filter((p) => p.id !== id),
        })),

      // --- Ibu Hamil CRUD ---
      addIbuHamil: (data) =>
        set((state) => ({
          ibuHamilList: [...state.ibuHamilList, { ...data, id: ++nextIbuHamilId }],
        })),
      updateIbuHamil: (id, data) =>
        set((state) => ({
          ibuHamilList: state.ibuHamilList.map((i) => (i.id === id ? { ...i, ...data } : i)),
        })),
      deleteIbuHamil: (id) =>
        set((state) => ({
          ibuHamilList: state.ibuHamilList.filter((i) => i.id !== id),
          selectedIbuHamilId: state.selectedIbuHamilId === id ? null : state.selectedIbuHamilId,
        })),

      // --- Imunisasi CRUD ---
      addImunisasi: (data) =>
        set((state) => ({
          imunisasiList: [...state.imunisasiList, { ...data, id: ++nextImunisasiId }],
        })),
      deleteImunisasi: (id) =>
        set((state) => ({
          imunisasiList: state.imunisasiList.filter((i) => i.id !== id),
        })),

      // --- ANC CRUD ---
      addKunjunganANC: (data) =>
        set((state) => ({
          kunjunganANCList: [...state.kunjunganANCList, { ...data, id: ++nextANCId }],
        })),
      deleteKunjunganANC: (id) =>
        set((state) => ({
          kunjunganANCList: state.kunjunganANCList.filter((k) => k.id !== id),
        })),

      // --- Vitamin A CRUD ---
      addVitaminA: (data) =>
        set((state) => ({
          vitaminAList: [...state.vitaminAList, { ...data, id: ++nextVitaminAId }],
        })),
      deleteVitaminA: (id) =>
        set((state) => ({
          vitaminAList: state.vitaminAList.filter((v) => v.id !== id),
        })),

      // --- PMT CRUD ---
      addPMT: (data) =>
        set((state) => ({
          pmtList: [...state.pmtList, { ...data, id: ++nextPMTId }],
        })),
      updatePMT: (id, data) =>
        set((state) => ({
          pmtList: state.pmtList.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deletePMT: (id) =>
        set((state) => ({
          pmtList: state.pmtList.filter((p) => p.id !== id),
        })),

      // --- Jadwal CRUD ---
      addJadwal: (data) =>
        set((state) => ({
          jadwalList: [...state.jadwalList, { ...data, id: ++nextJadwalId }],
        })),
      updateJadwal: (id, data) =>
        set((state) => ({
          jadwalList: state.jadwalList.map((j) => (j.id === id ? { ...j, ...data } : j)),
        })),
      deleteJadwal: (id) =>
        set((state) => ({
          jadwalList: state.jadwalList.filter((j) => j.id !== id),
        })),

      // --- Notifikasi ---
      markNotifikasiRead: (id) =>
        set((state) => ({
          notifikasiList: state.notifikasiList.map((n) =>
            n.id === id ? { ...n, dibaca: true } : n,
          ),
        })),
      markAllNotifikasiRead: () =>
        set((state) => ({
          notifikasiList: state.notifikasiList.map((n) => ({ ...n, dibaca: true })),
        })),
      addNotifikasi: (data) =>
        set((state) => ({
          notifikasiList: [
            {
              ...data,
              id: ++nextNotifikasiId,
              timestamp: new Date().toISOString(),
              dibaca: false,
            },
            ...state.notifikasiList,
          ],
        })),

      // --- Pengaturan ---
      updatePengaturan: (data) =>
        set((state) => ({
          pengaturan: {
            profil: { ...state.pengaturan.profil, ...data.profil },
            posyandu: { ...state.pengaturan.posyandu, ...data.posyandu },
          },
        })),
    }),
    {
      name: 'gizisync-store',
      // Only persist data, not navigation state
      partialize: (state) => ({
        user: state.user,
        balitaList: state.balitaList,
        pengukuranList: state.pengukuranList,
        ibuHamilList: state.ibuHamilList,
        imunisasiList: state.imunisasiList,
        kunjunganANCList: state.kunjunganANCList,
        vitaminAList: state.vitaminAList,
        pmtList: state.pmtList,
        jadwalList: state.jadwalList,
        laporanRecords: state.laporanRecords,
        pengaturan: state.pengaturan,
        notifikasiList: state.notifikasiList,
        theme: state.theme,
      }),
    },
  ),
);

// --- Derived selectors ---
//
// IMPORTANT: Zustand v5 uses `useSyncExternalStore` internally, which uses
// `Object.is` to compare snapshots. Returning a freshly-allocated object/array
// from a selector on every render triggers an infinite re-render loop because
// the new ref is never `Object.is`-equal to the previous one.
// To avoid this we subscribe to the underlying primitive/array state slices
// (whose refs are stable across renders unless `set()` is called) and derive
// the computed value with `useMemo`.
export function usePengukuranByBalita(balitaId: number | null) {
  const pengukuranList = useStore((s) => s.pengukuranList);
  return useMemo(
    () =>
      balitaId == null
        ? []
        : pengukuranList
            .filter((p) => p.balitaId === balitaId)
            .sort((a, b) => new Date(b.tanggalPengukuran).getTime() - new Date(a.tanggalPengukuran).getTime()),
    [pengukuranList, balitaId],
  );
}

export function usePriorityAlerts() {
  const balitaList = useStore((s) => s.balitaList);
  const pengukuranList = useStore((s) => s.pengukuranList);
  return useMemo(() => {
    const alerts = balitaList
      .map((b) => {
        const pengukuran = pengukuranList
          .filter((p) => p.balitaId === b.id)
          .sort((a, c) => new Date(c.tanggalPengukuran).getTime() - new Date(a.tanggalPengukuran).getTime())[0];
        if (!pengukuran) return null;
        const minZ = Math.min(pengukuran.zScoreBBU, pengukuran.zScoreTBU, pengukuran.zScoreBBTB);
        const indikator =
          minZ === pengukuran.zScoreTBU ? 'TBU' : minZ === pengukuran.zScoreBBU ? 'BBU' : 'BBTB';
        const statusAlert: 'Warning' | 'Critical' | null = minZ < -3 ? 'Critical' : minZ < -2 ? 'Warning' : null;
        if (!statusAlert) return null;
        return {
          id: b.id,
          namaBalita: b.namaLengkap,
          usiaBulan: b.usiaBulan,
          zScoreTerakhir: minZ,
          indikator: indikator as 'BBU' | 'TBU' | 'BBTB',
          statusAlert,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.zScoreTerakhir - b!.zScoreTerakhir);
    return alerts as NonNullable<(typeof alerts)[number]>[];
  }, [balitaList, pengukuranList]);
}

export function useDashboardStats() {
  const balitaList = useStore((s) => s.balitaList);
  const ibuHamilList = useStore((s) => s.ibuHamilList);
  const pengukuranList = useStore((s) => s.pengukuranList);
  return useMemo(() => {
    const totalBalita = balitaList.length;
    const totalIbuHamil = ibuHamilList.length;
    const ibuKEK = ibuHamilList.filter((i) => i.status === 'Risiko KEK').length;

    const latestPengukuran = balitaList.map((b) => {
      const list = pengukuranList
        .filter((p) => p.balitaId === b.id)
        .sort((a, c) => new Date(c.tanggalPengukuran).getTime() - new Date(a.tanggalPengukuran).getTime());
      return list[0] ?? null;
    });

    const giziBaik = latestPengukuran.filter((p) => p && p.statusGizi === 'Normal').length;
    const punyaPengukuran = latestPengukuran.filter(Boolean).length;
    const persentaseGiziBaik = punyaPengukuran > 0 ? Math.round((giziBaik / punyaPengukuran) * 100) : 0;
    const totalRisikoStunting = latestPengukuran.filter(
      (p) => p && (p.statusGizi === 'Stunting' || p.statusGizi === 'Severely Stunting'),
    ).length;

    return {
      totalBalita,
      perubahanBalitaBulanIni: 3,
      totalIbuHamil,
      perubahanIbuHamilBulanIni: 1,
      persentaseGiziBaik,
      perubahanPersentaseGiziBaik: 2.4,
      totalRisikoStunting,
      ibuKEK,
    };
  }, [balitaList, ibuHamilList, pengukuranList]);
}

export function useGiziDistribusi() {
  const balitaList = useStore((s) => s.balitaList);
  const pengukuranList = useStore((s) => s.pengukuranList);
  return useMemo(() => {
    const latest = balitaList.map((b) => {
      const list = pengukuranList
        .filter((p) => p.balitaId === b.id)
        .sort((a, c) => new Date(c.tanggalPengukuran).getTime() - new Date(a.tanggalPengukuran).getTime());
      return list[0]?.statusGizi ?? null;
    });
    const total = latest.filter(Boolean).length || 1;
    const counts: Record<string, number> = {};
    latest.forEach((g) => {
      if (g) counts[g] = (counts[g] ?? 0) + 1;
    });
    return [
      { nama: 'Gizi Baik', nilai: Math.round(((counts['Normal'] ?? 0) / total) * 100), warna: '#10b981' },
      { nama: 'Stunting', nilai: Math.round((((counts['Stunting'] ?? 0) + (counts['Severely Stunting'] ?? 0)) / total) * 100), warna: '#f59e0b' },
      { nama: 'Wasting', nilai: Math.round((((counts['Wasting'] ?? 0) + (counts['Severely Wasting'] ?? 0)) / total) * 100), warna: '#ef4444' },
      { nama: 'Gizi Lebih', nilai: Math.round((((counts['Gizi Lebih'] ?? 0) + (counts['Obesitas'] ?? 0) + (counts['Risiko Gizi Lebih'] ?? 0)) / total) * 100), warna: '#8b5cf6' },
    ].filter((d) => d.nilai > 0);
  }, [balitaList, pengukuranList]);
}

/** Monthly measurement activity for the dashboard trends chart */
export function useTrenPengukuranBulanan() {
  const pengukuranList = useStore((s) => s.pengukuranList);
  return useMemo(() => {
    const now = new Date();
    const months: { bulan: string; jumlah: number; stunting: number; wasting: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('id-ID', { month: 'short' });
      const year = d.getFullYear();
      const month = d.getMonth();
      const inMonth = pengukuranList.filter((p) => {
        const pd = new Date(p.tanggalPengukuran);
        return pd.getFullYear() === year && pd.getMonth() === month;
      });
      months.push({
        bulan: label,
        jumlah: inMonth.length,
        stunting: inMonth.filter((p) => p.statusGizi === 'Stunting' || p.statusGizi === 'Severely Stunting').length,
        wasting: inMonth.filter((p) => p.statusGizi === 'Wasting' || p.statusGizi === 'Severely Wasting').length,
      });
    }
    return months;
  }, [pengukuranList]);
}

/** Imunisasi coverage per balita — derived for the imunisasi view */
export function useImunisasiCoverage() {
  const balitaList = useStore((s) => s.balitaList);
  const imunisasiList = useStore((s) => s.imunisasiList);
  return useMemo(() => {
    return balitaList.map((b) => {
      const records = imunisasiList.filter((i) => i.balitaId === b.id);
      const givenTypes = new Set(records.map((r) => r.jenisVaksin));
      // Expected vaccines for this child's age
      const expected = (
        [
          'Hepatitis B 0', 'BCG', 'Polio 1', 'DPT-HB-Hib 1', 'Polio 2',
          'DPT-HB-Hib 2', 'Polio 3', 'DPT-HB-Hib 3', 'Polio 4', 'Campak', 'MR',
        ] as const
      ).filter((v) => {
        // Approximate schedule: each vaccine has a minimum age; show expected if child old enough
        const minAge: Record<string, number> = {
          'Hepatitis B 0': 0, 'BCG': 1, 'Polio 1': 1, 'DPT-HB-Hib 1': 2, 'Polio 2': 3,
          'DPT-HB-Hib 2': 4, 'Polio 3': 5, 'DPT-HB-Hib 3': 6, 'Polio 4': 9, 'Campak': 9, 'MR': 18,
        };
        return b.usiaBulan >= (minAge[v] ?? 0);
      });
      const given = expected.filter((v) => givenTypes.has(v as JenisVaksin));
      const missed = expected.filter((v) => !givenTypes.has(v as JenisVaksin));
      const persentase = expected.length > 0 ? Math.round((given.length / expected.length) * 100) : 0;
      const status =
        expected.length === 0 ? 'Belum Dimulai' :
        persentase === 100 ? 'Lengkap' :
        persentase >= 50 ? 'Belum Lengkap' : 'Belum Lengkap';
      return { balita: b, records, expected, given, missed, persentase, status: status as 'Lengkap' | 'Belum Lengkap' | 'Belum Dimulai' };
    });
  }, [balitaList, imunisasiList]);
}

/** Unread notifications count */
export function useUnreadNotifikasiCount() {
  return useStore((s) => s.notifikasiList.filter((n) => !n.dibaca).length);
}

/** ANC visits for a specific ibu hamil, sorted by date desc */
export function useKunjunganANCByIbu(ibuHamilId: number | null) {
  const kunjunganANCList = useStore((s) => s.kunjunganANCList);
  return useMemo(
    () =>
      ibuHamilId == null
        ? []
        : kunjunganANCList
            .filter((k) => k.ibuHamilId === ibuHamilId)
            .sort((a, b) => new Date(b.tanggalKunjungan).getTime() - new Date(a.tanggalKunjungan).getTime()),
    [kunjunganANCList, ibuHamilId],
  );
}

/** Vitamin A coverage summary for dashboard/module */
export function useVitaminACoverage() {
  const vitaminAList = useStore((s) => s.vitaminAList);
  const balitaList = useStore((s) => s.balitaList);
  const ibuHamilList = useStore((s) => s.ibuHamilList);
  return useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentPeriod: 'Februari' | 'Agustus' =
      new Date().getMonth() < 6 ? 'Februari' : 'Agustus';

    // Balita 6-59 months are eligible
    const eligibleBalita = balitaList.filter((b) => b.usiaBulan >= 6 && b.usiaBulan <= 59);
    const balitaGiven = eligibleBalita.filter((b) =>
      vitaminAList.some(
        (v) => v.target === 'Balita' && v.targetId === b.id && v.periode === currentPeriod && v.tahun === currentYear,
      ),
    );
    const balitaMissed = eligibleBalita.filter(
      (b) => !vitaminAList.some(
        (v) => v.target === 'Balita' && v.targetId === b.id && v.periode === currentPeriod && v.tahun === currentYear,
      ),
    );

    // Ibu Hamil in trimester 1 (<=12 weeks) are eligible for red capsule
    const eligibleIbu = ibuHamilList.filter((i) => i.usiaKehamilanMinggu <= 12);
    const ibuGiven = eligibleIbu.filter((i) =>
      vitaminAList.some((v) => v.target === 'Ibu Hamil' && v.targetId === i.id),
    );

    return {
      currentYear,
      currentPeriod,
      eligibleBalita: eligibleBalita.length,
      balitaGiven: balitaGiven.length,
      balitaMissed: balitaMissed.length,
      balitaCoverage: eligibleBalita.length > 0 ? Math.round((balitaGiven.length / eligibleBalita.length) * 100) : 0,
      eligibleIbu: eligibleIbu.length,
      ibuGiven: ibuGiven.length,
      ibuCoverage: eligibleIbu.length > 0 ? Math.round((ibuGiven.length / eligibleIbu.length) * 100) : 0,
      totalRecords: vitaminAList.length,
    };
  }, [vitaminAList, balitaList, ibuHamilList]);
}

// =============================================================================
// ANALYTICS SELECTORS — for the Analitik view
// =============================================================================

/** Age group distribution for analytics */
export function useAgeGroupDistribution() {
  const balitaList = useStore((s) => s.balitaList);
  return useMemo(() => {
    const groups = [
      { label: '0-5 bln', min: 0, max: 5, count: 0, laki: 0, perempuan: 0 },
      { label: '6-11 bln', min: 6, max: 11, count: 0, laki: 0, perempuan: 0 },
      { label: '12-23 bln', min: 12, max: 23, count: 0, laki: 0, perempuan: 0 },
      { label: '24-35 bln', min: 24, max: 35, count: 0, laki: 0, perempuan: 0 },
      { label: '36-47 bln', min: 36, max: 47, count: 0, laki: 0, perempuan: 0 },
      { label: '48-59 bln', min: 48, max: 59, count: 0, laki: 0, perempuan: 0 },
    ];
    balitaList.forEach((b) => {
      const group = groups.find((g) => b.usiaBulan >= g.min && b.usiaBulan <= g.max);
      if (group) {
        group.count++;
        if (b.jenisKelamin === 'Laki-laki') group.laki++;
        else group.perempuan++;
      }
    });
    return groups;
  }, [balitaList]);
}

/** Gender distribution */
export function useGenderDistribution() {
  const balitaList = useStore((s) => s.balitaList);
  return useMemo(() => {
    const laki = balitaList.filter((b) => b.jenisKelamin === 'Laki-laki').length;
    const perempuan = balitaList.filter((b) => b.jenisKelamin === 'Perempuan').length;
    return [
      { nama: 'Laki-laki', nilai: laki, warna: '#0ea5e9' },
      { nama: 'Perempuan', nilai: perempuan, warna: '#ec4899' },
    ];
  }, [balitaList]);
}

/** Gizi status trends over last 6 months (based on pengukuran) */
export function useGiziTrends6Bulan() {
  const pengukuranList = useStore((s) => s.pengukuranList);
  return useMemo(() => {
    const now = new Date();
    const months: { bulan: string; normal: number; stunting: number; wasting: number; giziLebih: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('id-ID', { month: 'short' });
      const year = d.getFullYear();
      const month = d.getMonth();
      const inMonth = pengukuranList.filter((p) => {
        const pd = new Date(p.tanggalPengukuran);
        return pd.getFullYear() === year && pd.getMonth() === month;
      });
      months.push({
        bulan: label,
        normal: inMonth.filter((p) => p.statusGizi === 'Normal' || p.statusGizi === 'Risiko Gizi Lebih').length,
        stunting: inMonth.filter((p) => p.statusGizi === 'Stunting' || p.statusGizi === 'Severely Stunting').length,
        wasting: inMonth.filter((p) => p.statusGizi === 'Wasting' || p.statusGizi === 'Severely Wasting').length,
        giziLebih: inMonth.filter((p) => p.statusGizi === 'Gizi Lebih' || p.statusGizi === 'Obesitas').length,
      });
    }
    return months;
  }, [pengukuranList]);
}

/** Program coverage summary for analytics */
export function useProgramCoverage() {
  const balitaList = useStore((s) => s.balitaList);
  const imunisasiList = useStore((s) => s.imunisasiList);
  const vitaminAList = useStore((s) => s.vitaminAList);
  const pmtList = useStore((s) => s.pmtList);
  return useMemo(() => {
    // Imunisasi: balita with at least 1 vaccine
    const imunisasiCount = balitaList.filter((b) =>
      imunisasiList.some((i) => i.balitaId === b.id),
    ).length;
    // Vitamin A: balita with at least 1 record this year
    const currentYear = new Date().getFullYear();
    const vitACount = balitaList.filter((b) =>
      vitaminAList.some((v) => v.target === 'Balita' && v.targetId === b.id && v.tahun === currentYear),
    ).length;
    // PMT: balita currently in active program
    const pmtCount = pmtList.filter((p) => p.status === 'Aktif').length;

    const total = balitaList.length || 1;
    return [
      { nama: 'Imunisasi', given: imunisasiCount, total: balitaList.length, persentase: Math.round((imunisasiCount / total) * 100), warna: '#8b5cf6' },
      { nama: 'Vitamin A', given: vitACount, total: balitaList.length, persentase: Math.round((vitACount / total) * 100), warna: '#3b82f6' },
      { nama: 'PMT Aktif', given: pmtCount, total: balitaList.length, persentase: Math.round((pmtCount / total) * 100), warna: '#f59e0b' },
    ];
  }, [balitaList, imunisasiList, vitaminAList, pmtList]);
}

/** Z-Score distribution for latest measurements */
export function useZScoreDistribution() {
  const balitaList = useStore((s) => s.balitaList);
  const pengukuranList = useStore((s) => s.pengukuranList);
  return useMemo(() => {
    const latest = balitaList.map((b) => {
      const list = pengukuranList
        .filter((p) => p.balitaId === b.id)
        .sort((a, c) => new Date(c.tanggalPengukuran).getTime() - new Date(a.tanggalPengukuran).getTime());
      return list[0] ?? null;
    }).filter(Boolean);

    const distribution = {
      '< -3 SD': 0,
      '-3 to -2 SD': 0,
      '-2 to +1 SD': 0,
      '+1 to +2 SD': 0,
      '> +2 SD': 0,
    };

    latest.forEach((p) => {
      if (!p) return;
      const minZ = Math.min(p.zScoreBBU, p.zScoreTBU, p.zScoreBBTB);
      if (minZ < -3) distribution['< -3 SD']++;
      else if (minZ < -2) distribution['-3 to -2 SD']++;
      else if (minZ <= 1) distribution['-2 to +1 SD']++;
      else if (minZ <= 2) distribution['+1 to +2 SD']++;
      else distribution['> +2 SD']++;
    });

    return Object.entries(distribution).map(([label, count]) => ({ label, count }));
  }, [balitaList, pengukuranList]);
}
