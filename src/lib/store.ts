// =============================================================================
// store.ts — Global state (Zustand) for GiziSync Posyandu dashboard
//
// STATUS MIGRASI (Fase 3.7): AUTH TERSAMBUNG KE SUPABASE! 🚀
// =============================================================================

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMemo } from "react";
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
} from "./data/types";
import type { AppViewType } from "./data/types";
import {
  seedIbuHamilList,
  seedImunisasi,
  seedJadwal,
  seedKunjunganANC,
  seedNotifikasi,
  seedPMT,
  seedPengaturan,
  seedVitaminA,
} from "./data/mock-data";

export type AppView = AppViewType;

interface AppState {
  // Auth (UPDATE FASE 3.7: Menggunakan setUser untuk sinkronisasi dengan Supabase)
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;

  // Hydration flag: true setelah Zustand selesai membaca localStorage.
  // WAJIB dicek oleh komponen guard sebelum memutuskan redirect berdasarkan `user`,
  // karena pada render pertama setelah reload, `user` masih null sesaat
  // sebelum rehidrasi selesai (lihat onRehydrateStorage di bawah).
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;

  // Navigation
  view: AppView;
  selectedBalitaId: string | null;
  selectedIbuHamilId: number | null;
  sidebarOpen: boolean;
  theme: "light" | "dark";
  commandPaletteOpen: boolean;

  // Data Balita
  balitaList: Balita[];
  balitaLoading: boolean;
  balitaError: string | null;

  // Data Pengukuran (NEW - Terhubung API)
  pengukuranList: PengukuranBalita[];
  pengukuranLoading: boolean;
  pengukuranError: string | null;

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
  viewBalitaDetail: (id: string) => void;
  viewIbuHamilDetail: (id: number) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setCommandPaletteOpen: (open: boolean) => void;

  // Fetch API
  fetchBalitaList: () => Promise<void>;
  fetchPengukuranList: () => Promise<void>;

  // Balita CRUD (Tersambung API)
  addBalita: (data: Omit<Balita, "id" | "usiaBulan">) => Promise<void>;
  updateBalita: (
    id: string,
    data: Partial<Omit<Balita, "id" | "usiaBulan">>,
  ) => Promise<void>;
  deleteBalita: (id: string) => Promise<void>;

  // Pengukuran CRUD (Tersambung API)
  addPengukuran: (
    data: Omit<
      PengukuranBalita,
      | "id"
      | "zScoreBBU"
      | "zScoreTBU"
      | "zScoreBBTB"
      | "zScoreIMTU"
      | "zScoreLKA"
      | "zScoreLILA"
      | "statusGizi"
    >,
  ) => Promise<void>;
  updatePengukuran: (
    id: string,
    data: Partial<PengukuranBalita>,
  ) => Promise<void>;
  deletePengukuran: (id: string) => Promise<void>;

  // Ibu Hamil CRUD
  addIbuHamil: (data: Omit<IbuHamil, "id">) => void;
  updateIbuHamil: (id: number, data: Partial<Omit<IbuHamil, "id">>) => void;
  deleteIbuHamil: (id: number) => void;

  // Imunisasi CRUD
  addImunisasi: (data: Omit<ImunisasiRecord, "id">) => void;
  deleteImunisasi: (id: number) => void;

  // ANC CRUD
  addKunjunganANC: (data: Omit<KunjunganANC, "id">) => void;
  deleteKunjunganANC: (id: number) => void;

  // Vitamin A CRUD
  addVitaminA: (data: Omit<VitaminARecord, "id">) => void;
  deleteVitaminA: (id: number) => void;

  // PMT CRUD
  addPMT: (data: Omit<PMTRecord, "id">) => void;
  updatePMT: (id: number, data: Partial<PMTRecord>) => void;
  deletePMT: (id: number) => void;

  // Jadwal CRUD
  addJadwal: (data: Omit<JadwalPosyandu, "id">) => void;
  updateJadwal: (id: number, data: Partial<JadwalPosyandu>) => void;
  deleteJadwal: (id: number) => void;

  // Notifikasi
  markNotifikasiRead: (id: number) => void;
  markAllNotifikasiRead: () => void;
  addNotifikasi: (
    data: Omit<Notifikasi, "id" | "timestamp" | "dibaca">,
  ) => void;

  // Pengaturan
  updatePengaturan: (data: Partial<PengaturanData>) => void;
}

// IDs untuk modul lokal yang belum migrasi
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
      setUser: (user) => set({ user, view: "dashboard" }),
      logout: () => set({ user: null, view: "dashboard", sidebarOpen: false }),

      // --- Hydration ---
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      // --- Initial state ---
      view: "dashboard",
      selectedBalitaId: null,
      selectedIbuHamilId: null,
      sidebarOpen: false,
      theme: "light",
      commandPaletteOpen: false,

      balitaList: [],
      balitaLoading: true,
      balitaError: null,

      pengukuranList: [],
      pengukuranLoading: true,
      pengukuranError: null,

      ibuHamilList: seedIbuHamilList,
      imunisasiList: seedImunisasi,
      kunjunganANCList: seedKunjunganANC,
      vitaminAList: seedVitaminA,
      pmtList: seedPMT,
      jadwalList: seedJadwal,
      laporanRecords: [],
      pengaturan: seedPengaturan,
      notifikasiList: seedNotifikasi,

      // --- Navigation ---
      setView: (view) => set({ view, sidebarOpen: false }),
      viewBalitaDetail: (id) =>
        set({
          view: "balita-detail",
          selectedBalitaId: id,
          sidebarOpen: false,
        }),
      viewIbuHamilDetail: (id) =>
        set({
          view: "ibu-hamil-detail",
          selectedIbuHamilId: id,
          sidebarOpen: false,
        }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleTheme: () => {
        const next = get().theme === "light" ? "dark" : "light";
        set({ theme: next });
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", next === "dark");
        }
      },
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      // --- FETCH API ---
      fetchBalitaList: async () => {
        set({ balitaLoading: true, balitaError: null });
        try {
          const res = await fetch("/api/balita");
          if (!res.ok) throw new Error(`Server merespons status ${res.status}`);
          const { data } = await res.json();
          set({ balitaList: data, balitaLoading: false });
        } catch (err) {
          console.error("fetchBalitaList gagal:", err);
          set({
            balitaError: "Gagal memuat data balita. Periksa koneksi Anda.",
            balitaLoading: false,
          });
        }
      },

      fetchPengukuranList: async () => {
        set({ pengukuranLoading: true, pengukuranError: null });
        try {
          const res = await fetch("/api/pengukuran");
          if (!res.ok) throw new Error(`Server merespons status ${res.status}`);
          const { data } = await res.json();
          set({ pengukuranList: data, pengukuranLoading: false });
        } catch (err) {
          console.error("fetchPengukuranList gagal:", err);
          set({
            pengukuranError: "Gagal memuat data pengukuran.",
            pengukuranLoading: false,
          });
        }
      },

      // --- Balita CRUD API ---
      addBalita: async (data) => {
        const res = await fetch("/api/balita", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const body = await res.json();
        if (!res.ok) {
          throw new Error(body.error ?? "Gagal menambah balita.");
        }
        set((state) => ({ balitaList: [...state.balitaList, body.data] }));
      },

      updateBalita: async (id, data) => {
        const res = await fetch(`/api/balita/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const body = await res.json();
        if (!res.ok) {
          throw new Error(body.error ?? "Gagal memperbarui data balita.");
        }
        set((state) => ({
          balitaList: state.balitaList.map((b) =>
            b.id === id ? body.data : b,
          ),
        }));
      },

      deleteBalita: async (id) => {
        const res = await fetch(`/api/balita/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Gagal menghapus balita.");
        }
        set((state) => ({
          balitaList: state.balitaList.filter((b) => b.id !== id),
          pengukuranList: state.pengukuranList.filter((p) => p.balitaId !== id),
          selectedBalitaId:
            state.selectedBalitaId === id ? null : state.selectedBalitaId,
        }));
      },

      // --- Pengukuran CRUD API ---
      addPengukuran: async (data) => {
        const res = await fetch(`/api/balita/${data.balitaId}/pengukuran`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const body = await res.json();
        if (!res.ok)
          throw new Error(body.error ?? "Gagal menyimpan pengukuran.");
        set((state) => ({
          pengukuranList: [...state.pengukuranList, body.data],
        }));
      },

      updatePengukuran: async (id, data) => {
        const res = await fetch(`/api/pengukuran/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const body = await res.json();
        if (!res.ok)
          throw new Error(body.error ?? "Gagal memperbarui pengukuran.");
        set((state) => ({
          pengukuranList: state.pengukuranList.map((p) =>
            p.id === id ? body.data : p,
          ),
        }));
      },

      deletePengukuran: async (id) => {
        const res = await fetch(`/api/pengukuran/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Gagal menghapus pengukuran.");
        }
        set((state) => ({
          pengukuranList: state.pengukuranList.filter((p) => p.id !== id),
        }));
      },

      // --- Ibu Hamil CRUD ---
      addIbuHamil: (data) =>
        set((state) => ({
          ibuHamilList: [
            ...state.ibuHamilList,
            { ...data, id: ++nextIbuHamilId },
          ],
        })),
      updateIbuHamil: (id, data) =>
        set((state) => ({
          ibuHamilList: state.ibuHamilList.map((i) =>
            i.id === id ? { ...i, ...data } : i,
          ),
        })),
      deleteIbuHamil: (id) =>
        set((state) => ({
          ibuHamilList: state.ibuHamilList.filter((i) => i.id !== id),
          selectedIbuHamilId:
            state.selectedIbuHamilId === id ? null : state.selectedIbuHamilId,
        })),

      // --- Imunisasi CRUD ---
      addImunisasi: (data) =>
        set((state) => ({
          imunisasiList: [
            ...state.imunisasiList,
            { ...data, id: ++nextImunisasiId },
          ],
        })),
      deleteImunisasi: (id) =>
        set((state) => ({
          imunisasiList: state.imunisasiList.filter((i) => i.id !== id),
        })),

      // --- ANC CRUD ---
      addKunjunganANC: (data) =>
        set((state) => ({
          kunjunganANCList: [
            ...state.kunjunganANCList,
            { ...data, id: ++nextANCId },
          ],
        })),
      deleteKunjunganANC: (id) =>
        set((state) => ({
          kunjunganANCList: state.kunjunganANCList.filter((k) => k.id !== id),
        })),

      // --- Vitamin A CRUD ---
      addVitaminA: (data) =>
        set((state) => ({
          vitaminAList: [
            ...state.vitaminAList,
            { ...data, id: ++nextVitaminAId },
          ],
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
          pmtList: state.pmtList.map((p) =>
            p.id === id ? { ...p, ...data } : p,
          ),
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
          jadwalList: state.jadwalList.map((j) =>
            j.id === id ? { ...j, ...data } : j,
          ),
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
          notifikasiList: state.notifikasiList.map((n) => ({
            ...n,
            dibaca: true,
          })),
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
      name: "gizisync-store",
      // Hanya menyematkan modul lokal yang belum di-migrate.
      // balitaList dan pengukuranList TIDAK disimpan di localStorage lagi.
      partialize: (state) => ({
        user: state.user,
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
      // PENTING: matikan auto-hydrate saat store dibuat.
      // Next.js menjalankan komponen "use client" ini di server dulu (SSR pass),
      // dan localStorage tidak ada di server — kalau auto-hydrate dibiarkan aktif,
      // percobaan rehidrasi "habis terpakai" di server dan TIDAK akan diulang lagi
      // saat kode benar-benar berjalan di browser. Rehidrasi harus dipicu manual
      // dari client lewat useStore.persist.rehydrate() (lihat page.tsx).
      skipHydration: true,
      // Dipanggil setiap kali rehidrasi selesai (baik otomatis maupun manual
      // lewat useStore.persist.rehydrate()). Guard di layout/page HARUS
      // menunggu hasHydrated === true sebelum memutuskan redirect berdasarkan
      // `user`, kalau tidak akan selalu mengira belum login.
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

// --- Derived selectors ---
export function usePengukuranByBalita(balitaId: string | null) {
  const pengukuranList = useStore((s) => s.pengukuranList);
  return useMemo(
    () =>
      balitaId == null
        ? []
        : pengukuranList
            .filter((p) => String(p.balitaId) === String(balitaId))
            .sort(
              (a, b) =>
                new Date(b.tanggalPengukuran).getTime() -
                new Date(a.tanggalPengukuran).getTime(),
            ),
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
          .filter((p) => String(p.balitaId) === String(b.id))
          .sort(
            (a, c) =>
              new Date(c.tanggalPengukuran).getTime() -
              new Date(a.tanggalPengukuran).getTime(),
          )[0];
        if (!pengukuran) return null;

        if (
          pengukuran.zScoreBBU === null ||
          pengukuran.zScoreTBU === null ||
          pengukuran.zScoreBBTB === null
        ) {
          return null;
        }

        const minZ = Math.min(
          pengukuran.zScoreBBU,
          pengukuran.zScoreTBU,
          pengukuran.zScoreBBTB,
        );
        const indikator =
          minZ === pengukuran.zScoreTBU
            ? "TBU"
            : minZ === pengukuran.zScoreBBU
              ? "BBU"
              : "BBTB";
        const statusAlert: "Warning" | "Critical" | null =
          minZ < -3 ? "Critical" : minZ < -2 ? "Warning" : null;
        if (!statusAlert) return null;
        return {
          id: b.id,
          namaBalita: b.namaLengkap,
          usiaBulan: b.usiaBulan,
          zScoreTerakhir: minZ,
          indikator: indikator as "BBU" | "TBU" | "BBTB",
          statusAlert,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.zScoreTerakhir - b!.zScoreTerakhir);
    return alerts as NonNullable<(typeof alerts)[number]>[];
  }, [balitaList, pengukuranList]);
}

// =============================================================================
// FASE 4: HOOK REKOMENDASI PMT
// Mengecek 3 Bulan Kalender Berturut-turut
// =============================================================================
export function useRekomendasiPMT() {
  const balitaList = useStore((s) => s.balitaList);
  const pengukuranList = useStore((s) => s.pengukuranList);
  const pmtList = useStore((s) => s.pmtList);

  return useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    // Fungsi helper untuk mengecek apakah sebuah ISO string berada di bulan & tahun tertentu
    const isSameMonthYear = (
      iso: string,
      targetMonth: number,
      targetYear: number,
    ) => {
      const d = new Date(iso);
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    };

    // Fungsi helper untuk mengecek "Gizi Bermasalah"
    const isGiziBermasalah = (status: string | null) => {
      return (
        status === "Gizi Kurang" ||
        status === "Gizi Buruk" ||
        status === "BB Kurang"
      );
    };

    const recommendations = balitaList
      .map((balita) => {
        // 1. Abaikan jika status balita tidak Aktif
        if (balita.status !== "Aktif") return null;

        // 2. Abaikan jika anak sedang dalam program PMT yang "Aktif"
        const isCurrentlyInPMT = pmtList.some(
          (pmt) =>
            String(pmt.balitaId) === String(balita.id) &&
            pmt.status === "Aktif",
        );
        if (isCurrentlyInPMT) return null;

        // Ambil semua pengukuran anak ini
        const balitaPengukuran = pengukuranList.filter(
          (p) => String(p.balitaId) === String(balita.id),
        );

        // Kita butuh 3 bulan terakhir (Bulan Ini, Bulan Lalu, 2 Bulan Lalu)
        // Bulan 0 = Bulan Ini
        const p0 = balitaPengukuran.find((p) =>
          isSameMonthYear(p.tanggalPengukuran, curMonth, curYear),
        );

        let lastMonth = curMonth - 1;
        let lastMonthYear = curYear;
        if (lastMonth < 0) {
          lastMonth = 11;
          lastMonthYear--;
        }
        const p1 = balitaPengukuran.find((p) =>
          isSameMonthYear(p.tanggalPengukuran, lastMonth, lastMonthYear),
        );

        let twoMonthsAgo = curMonth - 2;
        let twoMonthsAgoYear = curYear;
        if (twoMonthsAgo < 0) {
          twoMonthsAgo += 12;
          twoMonthsAgoYear--;
        }
        const p2 = balitaPengukuran.find((p) =>
          isSameMonthYear(p.tanggalPengukuran, twoMonthsAgo, twoMonthsAgoYear),
        );

        // 3. Wajib ada data penuh selama 3 bulan kalender berurutan (tidak bolos)
        if (!p0 || !p1 || !p2) return null;

        // Cek Aturan Opsi A (2T): BB bulan ini <= bulan lalu DAN BB bulan lalu <= 2 bulan lalu
        const is2T =
          p0.beratBadanKg <= p1.beratBadanKg &&
          p1.beratBadanKg <= p2.beratBadanKg;

        // Cek Aturan Gizi Bermasalah Beruntun
        const is3BulanBuruk =
          isGiziBermasalah(p0.statusGizi) &&
          isGiziBermasalah(p1.statusGizi) &&
          isGiziBermasalah(p2.statusGizi);

        if (is2T || is3BulanBuruk) {
          return {
            id: balita.id,
            namaBalita: balita.namaLengkap,
            usiaBulan: balita.usiaBulan,
            beratSekarang: p0.beratBadanKg,
            statusGiziSekarang: p0.statusGizi || "Tidak Diketahui",
            alasan:
              is2T && is3BulanBuruk
                ? "BB 2T & 3 Bulan Gizi Kurang"
                : is2T
                  ? "Berat Badan Tidak Naik 2x Berurutan (2T)"
                  : "3 Bulan Berturut-turut Gizi Kurang/Buruk",
            prioritas: is2T && is3BulanBuruk ? "Tinggi" : "Sedang", // Untuk warna badge nanti di UI
          };
        }

        return null;
      })
      .filter(Boolean);

    // Sort by priority, then by age (younger first)
    return recommendations.sort((a, b) => {
      if (a!.prioritas === "Tinggi" && b!.prioritas !== "Tinggi") return -1;
      if (a!.prioritas !== "Tinggi" && b!.prioritas === "Tinggi") return 1;
      return a!.usiaBulan - b!.usiaBulan;
    }) as NonNullable<(typeof recommendations)[number]>[];
  }, [balitaList, pengukuranList, pmtList]);
}

export function useDashboardStats() {
  const balitaList = useStore((s) => s.balitaList);
  const ibuHamilList = useStore((s) => s.ibuHamilList);
  const pengukuranList = useStore((s) => s.pengukuranList);
  return useMemo(() => {
    const totalBalita = balitaList.length;
    const totalIbuHamil = ibuHamilList.length;
    const ibuKEK = ibuHamilList.filter((i) => i.status === "Risiko KEK").length;

    const latestPengukuran = balitaList.map((b) => {
      const list = pengukuranList
        .filter((p) => String(p.balitaId) === String(b.id))
        .sort(
          (a, c) =>
            new Date(c.tanggalPengukuran).getTime() -
            new Date(a.tanggalPengukuran).getTime(),
        );
      return list[0] ?? null;
    });

    const giziBaik = latestPengukuran.filter(
      (p) => p && (p.statusGizi === "Normal" || p.statusGizi === "Tinggi"), // Selaras dengan useGiziDistribusi: "Tinggi" bukan masalah gizi pada TB/U
    ).length;
    const punyaPengukuran = latestPengukuran.filter(Boolean).length;
    const persentaseGiziBaik =
      punyaPengukuran > 0 ? Math.round((giziBaik / punyaPengukuran) * 100) : 0;

    // FASE 2: Risiko Stunting diubah pelacakannya ke "Pendek"
    const totalRisikoStunting = latestPengukuran.filter(
      (p) => p && p.statusGizi === "Pendek",
    ).length;

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastYear = lastMonthDate.getFullYear();

    const isSameMonthYear = (iso: string, m: number, y: number) => {
      const d = new Date(iso);
      return d.getMonth() === m && d.getFullYear() === y;
    };

    const newBalitaThisMonth = balitaList.filter((b) => {
      const first = pengukuranList
        .filter((p) => String(p.balitaId) === String(b.id))
        .sort(
          (a, c) =>
            new Date(a.tanggalPengukuran).getTime() -
            new Date(c.tanggalPengukuran).getTime(),
        )[0];
      return first
        ? isSameMonthYear(first.tanggalPengukuran, thisMonth, thisYear)
        : false;
    }).length;

    const giziBaikPercentForMonth = (m: number, y: number) => {
      const monthlyLatest = balitaList
        .map((b) => {
          const list = pengukuranList
            .filter(
              (p) =>
                String(p.balitaId) === String(b.id) &&
                isSameMonthYear(p.tanggalPengukuran, m, y),
            )
            .sort(
              (a, c) =>
                new Date(c.tanggalPengukuran).getTime() -
                new Date(a.tanggalPengukuran).getTime(),
            );
          return list[0] ?? null;
        })
        .filter(Boolean);
      if (monthlyLatest.length === 0) return null;
      const baik = monthlyLatest.filter(
        (p) => p!.statusGizi === "Normal" || p!.statusGizi === "Tinggi",
      ).length;
      return Math.round((baik / monthlyLatest.length) * 100);
    };

    const thisMonthPct = giziBaikPercentForMonth(thisMonth, thisYear);
    const lastMonthPct = giziBaikPercentForMonth(lastMonth, lastYear);
    const perubahanPersentaseGiziBaik: number | null =
      thisMonthPct !== null && lastMonthPct !== null
        ? Number((thisMonthPct - lastMonthPct).toFixed(1))
        : null;

    return {
      totalBalita,
      perubahanBalitaBulanIni: newBalitaThisMonth,
      totalIbuHamil,
      perubahanIbuHamilBulanIni: 0,
      persentaseGiziBaik,
      perubahanPersentaseGiziBaik,
      totalRisikoStunting,
      ibuKEK,
    };
  }, [balitaList, ibuHamilList, pengukuranList]);
}

// FASE 2: Mengubah Pengelompokan Data Pie Chart
export function useGiziDistribusi() {
  const balitaList = useStore((s) => s.balitaList);
  const pengukuranList = useStore((s) => s.pengukuranList);
  return useMemo(() => {
    const latest = balitaList.map((b) => {
      const list = pengukuranList
        .filter((p) => String(p.balitaId) === String(b.id))
        .sort(
          (a, c) =>
            new Date(c.tanggalPengukuran).getTime() -
            new Date(a.tanggalPengukuran).getTime(),
        );
      return list[0]?.statusGizi ?? null;
    });
    const total = latest.filter(Boolean).length || 1;
    const counts: Record<string, number> = {};
    latest.forEach((g) => {
      if (g) counts[g] = (counts[g] ?? 0) + 1;
    });
    return [
      {
        nama: "Normal", // Normal + Tinggi
        nilai: Math.round(
          (((counts["Normal"] ?? 0) + (counts["Tinggi"] ?? 0)) / total) * 100,
        ),
        warna: "#10b981", // Hijau
      },
      {
        nama: "Pendek", // Pendek
        nilai: Math.round(((counts["Pendek"] ?? 0) / total) * 100),
        warna: "#f59e0b", // Kuning/Amber
      },
      {
        nama: "Gizi Kurang / Buruk", // Wasting -> Gizi Kurang + Gizi Buruk + BB Kurang
        nilai: Math.round(
          (((counts["Gizi Kurang"] ?? 0) +
            (counts["Gizi Buruk"] ?? 0) +
            (counts["BB Kurang"] ?? 0)) /
            total) *
            100,
        ),
        warna: "#ef4444", // Merah
      },
      {
        nama: "Berisiko / Gizi Lebih", // Gizi Lebih + Risiko Gizi Lebih + BB Lebih
        nilai: Math.round(
          (((counts["Gizi Lebih"] ?? 0) +
            (counts["Berisiko Gizi Lebih"] ?? 0) +
            (counts["BB Lebih"] ?? 0)) /
            total) *
            100,
        ),
        warna: "#8b5cf6", // Ungu
      },
    ].filter((d) => d.nilai > 0);
  }, [balitaList, pengukuranList]);
}

// FASE 2: Mengubah Filter Bar Chart
export function useTrenPengukuranBulanan() {
  const pengukuranList = useStore((s) => s.pengukuranList);
  return useMemo(() => {
    const now = new Date();
    const months: {
      bulan: string;
      jumlah: number;
      stunting: number;
      wasting: number;
    }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("id-ID", { month: "short" });
      const year = d.getFullYear();
      const month = d.getMonth();
      const inMonth = pengukuranList.filter((p) => {
        const pd = new Date(p.tanggalPengukuran);
        return pd.getFullYear() === year && pd.getMonth() === month;
      });
      months.push({
        bulan: label,
        jumlah: inMonth.length,
        stunting: inMonth.filter((p) => p.statusGizi === "Pendek").length,
        wasting: inMonth.filter(
          (p) =>
            p.statusGizi === "Gizi Kurang" ||
            p.statusGizi === "Gizi Buruk" ||
            p.statusGizi === "BB Kurang",
        ).length,
      });
    }
    return months;
  }, [pengukuranList]);
}

export function useImunisasiCoverage() {
  const balitaList = useStore((s) => s.balitaList);
  const imunisasiList = useStore((s) => s.imunisasiList);
  return useMemo(() => {
    return balitaList.map((b) => {
      const records = imunisasiList.filter(
        (i) => String(i.balitaId) === String(b.id),
      );
      const givenTypes = new Set(records.map((r) => r.jenisVaksin));
      const expected = (
        [
          "Hepatitis B 0",
          "BCG",
          "Polio 1",
          "DPT-HB-Hib 1",
          "Polio 2",
          "DPT-HB-Hib 2",
          "Polio 3",
          "DPT-HB-Hib 3",
          "Polio 4",
          "Campak",
          "MR",
        ] as const
      ).filter((v) => {
        const minAge: Record<string, number> = {
          "Hepatitis B 0": 0,
          BCG: 1,
          "Polio 1": 1,
          "DPT-HB-Hib 1": 2,
          "Polio 2": 3,
          "DPT-HB-Hib 2": 4,
          "Polio 3": 5,
          "DPT-HB-Hib 3": 6,
          "Polio 4": 9,
          Campak: 9,
          MR: 18,
        };
        return b.usiaBulan >= (minAge[v] ?? 0);
      });
      const given = expected.filter((v) => givenTypes.has(v as JenisVaksin));
      const missed = expected.filter((v) => !givenTypes.has(v as JenisVaksin));
      const persentase =
        expected.length > 0
          ? Math.round((given.length / expected.length) * 100)
          : 0;
      const status =
        expected.length === 0
          ? "Belum Dimulai"
          : persentase === 100
            ? "Lengkap"
            : persentase >= 50
              ? "Belum Lengkap"
              : "Belum Lengkap";
      return {
        balita: b,
        records,
        expected,
        given,
        missed,
        persentase,
        status: status as "Lengkap" | "Belum Lengkap" | "Belum Dimulai",
      };
    });
  }, [balitaList, imunisasiList]);
}

export function useUnreadNotifikasiCount() {
  return useStore((s) => s.notifikasiList.filter((n) => !n.dibaca).length);
}

export function useKunjunganANCByIbu(ibuHamilId: number | null) {
  const kunjunganANCList = useStore((s) => s.kunjunganANCList);
  return useMemo(
    () =>
      ibuHamilId == null
        ? []
        : kunjunganANCList
            .filter((k) => k.ibuHamilId === ibuHamilId)
            .sort(
              (a, b) =>
                new Date(b.tanggalKunjungan).getTime() -
                new Date(a.tanggalKunjungan).getTime(),
            ),
    [kunjunganANCList, ibuHamilId],
  );
}

export function useVitaminACoverage() {
  const vitaminAList = useStore((s) => s.vitaminAList);
  const balitaList = useStore((s) => s.balitaList);
  const ibuHamilList = useStore((s) => s.ibuHamilList);
  return useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentPeriod: "Februari" | "Agustus" =
      new Date().getMonth() < 6 ? "Februari" : "Agustus";

    const eligibleBalita = balitaList.filter(
      (b) => b.usiaBulan >= 6 && b.usiaBulan <= 59,
    );
    const balitaGiven = eligibleBalita.filter((b) =>
      vitaminAList.some(
        (v) =>
          v.target === "Balita" &&
          String(v.targetId) === String(b.id) &&
          v.periode === currentPeriod &&
          v.tahun === currentYear,
      ),
    );
    const balitaMissed = eligibleBalita.filter(
      (b) =>
        !vitaminAList.some(
          (v) =>
            v.target === "Balita" &&
            String(v.targetId) === String(b.id) &&
            v.periode === currentPeriod &&
            v.tahun === currentYear,
        ),
    );

    const eligibleIbu = ibuHamilList.filter((i) => i.usiaKehamilanMinggu <= 12);
    const ibuGiven = eligibleIbu.filter((i) =>
      vitaminAList.some(
        (v) => v.target === "Ibu Hamil" && String(v.targetId) === String(i.id),
      ),
    );

    return {
      currentYear,
      currentPeriod,
      eligibleBalita: eligibleBalita.length,
      balitaGiven: balitaGiven.length,
      balitaMissed: balitaMissed.length,
      balitaCoverage:
        eligibleBalita.length > 0
          ? Math.round((balitaGiven.length / eligibleBalita.length) * 100)
          : 0,
      eligibleIbu: eligibleIbu.length,
      ibuGiven: ibuGiven.length,
      ibuCoverage:
        eligibleIbu.length > 0
          ? Math.round((ibuGiven.length / eligibleIbu.length) * 100)
          : 0,
      totalRecords: vitaminAList.length,
    };
  }, [vitaminAList, balitaList, ibuHamilList]);
}

// =============================================================================
// ANALYTICS SELECTORS — for the Analitik view
// =============================================================================

export function useAgeGroupDistribution() {
  const balitaList = useStore((s) => s.balitaList);
  return useMemo(() => {
    const groups = [
      { label: "0-5 bln", min: 0, max: 5, count: 0, laki: 0, perempuan: 0 },
      { label: "6-11 bln", min: 6, max: 11, count: 0, laki: 0, perempuan: 0 },
      { label: "12-23 bln", min: 12, max: 23, count: 0, laki: 0, perempuan: 0 },
      { label: "24-35 bln", min: 24, max: 35, count: 0, laki: 0, perempuan: 0 },
      { label: "36-47 bln", min: 36, max: 47, count: 0, laki: 0, perempuan: 0 },
      { label: "48-59 bln", min: 48, max: 59, count: 0, laki: 0, perempuan: 0 },
    ];
    balitaList.forEach((b) => {
      const group = groups.find(
        (g) => b.usiaBulan >= g.min && b.usiaBulan <= g.max,
      );
      if (group) {
        group.count++;
        if (b.jenisKelamin === "Laki-laki") group.laki++;
        else group.perempuan++;
      }
    });
    return groups;
  }, [balitaList]);
}

export function useGenderDistribution() {
  const balitaList = useStore((s) => s.balitaList);
  return useMemo(() => {
    const laki = balitaList.filter(
      (b) => b.jenisKelamin === "Laki-laki",
    ).length;
    const perempuan = balitaList.filter(
      (b) => b.jenisKelamin === "Perempuan",
    ).length;
    return [
      { nama: "Laki-laki", nilai: laki, warna: "#0ea5e9" },
      { nama: "Perempuan", nilai: perempuan, warna: "#ec4899" },
    ];
  }, [balitaList]);
}

// FASE 2: Mengubah Filter Tren 6 Bulan Analitik
export function useGiziTrends6Bulan() {
  const pengukuranList = useStore((s) => s.pengukuranList);
  return useMemo(() => {
    const now = new Date();
    const months: {
      bulan: string;
      normal: number;
      stunting: number;
      wasting: number;
      giziLebih: number;
    }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("id-ID", { month: "short" });
      const year = d.getFullYear();
      const month = d.getMonth();
      const inMonth = pengukuranList.filter((p) => {
        const pd = new Date(p.tanggalPengukuran);
        return pd.getFullYear() === year && pd.getMonth() === month;
      });
      months.push({
        bulan: label,
        normal: inMonth.filter(
          (p) => p.statusGizi === "Normal" || p.statusGizi === "Tinggi",
        ).length,
        stunting: inMonth.filter((p) => p.statusGizi === "Pendek").length,
        wasting: inMonth.filter(
          (p) =>
            p.statusGizi === "Gizi Kurang" ||
            p.statusGizi === "Gizi Buruk" ||
            p.statusGizi === "BB Kurang",
        ).length,
        giziLebih: inMonth.filter(
          (p) =>
            p.statusGizi === "Gizi Lebih" ||
            p.statusGizi === "Berisiko Gizi Lebih" ||
            p.statusGizi === "BB Lebih",
        ).length,
      });
    }
    return months;
  }, [pengukuranList]);
}

export function useProgramCoverage() {
  const balitaList = useStore((s) => s.balitaList);
  const imunisasiList = useStore((s) => s.imunisasiList);
  const vitaminAList = useStore((s) => s.vitaminAList);
  const pmtList = useStore((s) => s.pmtList);
  return useMemo(() => {
    const imunisasiCount = balitaList.filter((b) =>
      imunisasiList.some((i) => String(i.balitaId) === String(b.id)),
    ).length;
    const currentYear = new Date().getFullYear();
    const vitACount = balitaList.filter((b) =>
      vitaminAList.some(
        (v) =>
          v.target === "Balita" &&
          String(v.targetId) === String(b.id) &&
          v.tahun === currentYear,
      ),
    ).length;
    const pmtCount = pmtList.filter((p) => p.status === "Aktif").length;

    const total = balitaList.length || 1;
    return [
      {
        nama: "Imunisasi",
        given: imunisasiCount,
        total: balitaList.length,
        persentase: Math.round((imunisasiCount / total) * 100),
        warna: "#8b5cf6",
      },
      {
        nama: "Vitamin A",
        given: vitACount,
        total: balitaList.length,
        persentase: Math.round((vitACount / total) * 100),
        warna: "#3b82f6",
      },
      {
        nama: "PMT Aktif",
        given: pmtCount,
        total: balitaList.length,
        persentase: Math.round((pmtCount / total) * 100),
        warna: "#f59e0b",
      },
    ];
  }, [balitaList, imunisasiList, vitaminAList, pmtList]);
}

export function useZScoreDistribution() {
  const balitaList = useStore((s) => s.balitaList);
  const pengukuranList = useStore((s) => s.pengukuranList);
  return useMemo(() => {
    const latest = balitaList
      .map((b) => {
        const list = pengukuranList
          .filter((p) => String(p.balitaId) === String(b.id))
          .sort(
            (a, c) =>
              new Date(c.tanggalPengukuran).getTime() -
              new Date(a.tanggalPengukuran).getTime(),
          );
        return list[0] ?? null;
      })
      .filter(Boolean);

    const distribution = {
      "< -3 SD": 0,
      "-3 to -2 SD": 0,
      "-2 to +1 SD": 0,
      "+1 to +2 SD": 0,
      "> +2 SD": 0,
    };

    latest.forEach((p) => {
      if (!p) return;
      if (p.zScoreBBU === null || p.zScoreTBU === null || p.zScoreBBTB === null)
        return;

      const minZ = Math.min(p.zScoreBBU, p.zScoreTBU, p.zScoreBBTB);
      if (minZ < -3) distribution["< -3 SD"]++;
      else if (minZ < -2) distribution["-3 to -2 SD"]++;
      else if (minZ <= 1) distribution["-2 to +1 SD"]++;
      else if (minZ <= 2) distribution["+1 to +2 SD"]++;
      else distribution["> +2 SD"]++;
    });

    return Object.entries(distribution).map(([label, count]) => ({
      label,
      count,
    }));
  }, [balitaList, pengukuranList]);
}
