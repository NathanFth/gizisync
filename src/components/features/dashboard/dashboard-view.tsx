"use client";

import { useMemo } from "react";
import {
  useStore,
  useDashboardStats,
  useGiziDistribusi,
  usePriorityAlerts,
  useTrenPengukuranBulanan,
  // useRekomendasiPMT,
} from "@/lib/store";
import { StatCard } from "@/components/shared/stat-card";
import { AlertStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Baby,
  HeartPulse,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Plus,
  Calculator,
  FileBarChart,
  Activity,
  Calendar,
  Clock,
  MapPin,
  Utensils,
  Droplet,
  Syringe,
  ChevronRight,
  Bell,
  ClipboardList,
  CheckCircle2, // FASE 4: Tambahan Icon
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { formatTanggalID, NAMA_BULAN_SINGKAT } from "@/lib/data/mock-data";

export function DashboardView() {
  const stats = useDashboardStats();
  const distribusi = useGiziDistribusi();
  const alerts = usePriorityAlerts();
  const trenBulanan = useTrenPengukuranBulanan();
  // const rekomendasiPMT = useRekomendasiPMT();
  const { setView, viewBalitaDetail } = useStore();

  const totalDistribusi = distribusi.reduce((sum, d) => sum + d.nilai, 0) || 1;
  const giziBaikPersen =
    distribusi.find((d) => d.nama === "Normal")?.nilai ?? 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={Baby}
          label="Total Balita Terdaftar"
          value={stats.totalBalita}
          trend={stats.perubahanBalitaBulanIni}
          trendLabel="bulan ini"
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-500/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Persentase Gizi Normal"
          value={stats.persentaseGiziBaik}
          unit="%"
          trend={stats.perubahanPersentaseGiziBaik}
          trendLabel="dari bulan lalu"
          iconColor="text-sky-600"
          iconBg="bg-sky-50 dark:bg-sky-500/10"
        />
        <StatCard
          icon={AlertTriangle}
          label="Balita Berisiko"
          value={stats.totalRisikoStunting}
          trendLabel="perlu pantauan"
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-500/10"
        />
        {/* <StatCard
          icon={Utensils}
          label="Kandidat PMT"
          value={rekomendasiPMT.length}
          trendLabel="butuh intervensi"
          iconColor="text-rose-600"
          iconBg="bg-rose-50 dark:bg-rose-500/10"
        />*/}
      </div>

      {/* Today's Summary Banner */}
      <TodaysSummary />

      {/* Quick Actions
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <QuickAction
          icon={Plus}
          label="Tambah Balita"
          onClick={() => setView("balita")}
          color="emerald"
        />
        <QuickAction
          icon={Calculator}
          label="Hitung Z-Score"
          onClick={() => setView("kalkulator")}
          color="sky"
        />
        <QuickAction
          icon={FileBarChart}
          label="Buat Laporan"
          onClick={() => setView("laporan")}
          color="amber"
        />
         <QuickAction
          icon={Utensils}
          label="Kelola PMT"
          onClick={() => setView("pmt")}
          color="rose"
        />
      </div> */}

      {/* Monthly Trends Chart */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Tren Pengukuran 6 Bulan Terakhir
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Jumlah pengukuran dan kasus pendek / gizi kurang per bulan
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={trenBulanan}
            margin={{ top: 5, right: 10, bottom: 5, left: -15 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.5}
            />
            <XAxis
              dataKey="bulan"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
                background: "hsl(var(--popover))",
                color: "hsl(var(--popover-foreground))",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} iconType="circle" />
            <Bar
              dataKey="jumlah"
              name="Total Pengukuran"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="stunting"
              name="Kasus Pendek"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="wasting"
              name="Kasus Gizi Kurang"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Priority Alert Table */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Balita Perlu Pantauan Khusus
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Balita dengan Z-Score di bawah -2 SD
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setView("balita")}>
              Lihat Semua <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="p-2">
            {alerts.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="Tidak ada balita prioritas"
                description="Semua balita dalam status gizi normal. Pantauan khusus tidak diperlukan saat ini."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-3 font-medium">Nama Balita</th>
                      <th className="px-3 py-3 font-medium">Usia</th>
                      <th className="px-3 py-3 font-medium">Z-Score</th>
                      <th className="px-3 py-3 font-medium">Indikator</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {alerts.slice(0, 5).map((alert) => (
                      <tr
                        key={alert.id}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <td className="px-3 py-3 font-medium text-foreground">
                          {alert.namaBalita}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {alert.usiaBulan} bulan
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-mono font-semibold text-foreground">
                            {alert.zScoreTerakhir > 0 ? "+" : ""}
                            {alert.zScoreTerakhir.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {alert.indikator}
                        </td>
                        <td className="px-3 py-3">
                          <AlertStatusBadge status={alert.statusAlert} />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewBalitaDetail(String(alert.id))}
                          >
                            Detail
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        {/* Analytics Widget */}
        <Card className="flex flex-col">
          <div className="border-b border-border p-5">
            <h3 className="text-base font-semibold text-foreground">
              Distribusi Status Gizi
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Berdasarkan pengukuran terakhir
            </p>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center p-5">
            <div className="relative h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribusi}
                    dataKey="nilai"
                    nameKey="nama"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {distribusi.map((entry, i) => (
                      <Cell key={i} fill={entry.warna} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      `${((value / totalDistribusi) * 100).toFixed(0)}%`
                    }
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      fontSize: "12px",
                      background: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">
                  {giziBaikPersen}%
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  Normal
                </span>
              </div>
            </div>
            <div className="mt-4 w-full space-y-2">
              {distribusi.map((item) => (
                <div
                  key={item.nama}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.warna }}
                    />
                    <span className="text-muted-foreground">{item.nama}</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {item.nilai}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* FASE 4: WIDGET REKOMENDASI PMT */}
      {/* <Card className="overflow-hidden border-rose-200 shadow-sm dark:border-rose-900/50">
        <div className="flex items-center justify-between border-b border-border bg-rose-50/50 p-5 dark:bg-rose-900/10">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-rose-700 dark:text-rose-400">
              <Utensils className="h-5 w-5" />
              Kandidat Penerima PMT
            </h3>
            <p className="mt-0.5 text-sm text-rose-600/80 dark:text-rose-400/80">
              Berdasarkan tren 3 bulan terakhir (Berat tidak naik 2x beruntun
              atau 3x Gizi Kurang)
            </p>
          </div> */}
      {/* <Button
            variant="outline"
            size="sm"
            onClick={() => setView("pmt")}
            className="border-rose-200 text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/50"
          >
            Kelola PMT <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>*/}
      {/* <div className="p-2">
          {rekomendasiPMT.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Tidak ada kandidat PMT baru"
              description="Bagus! Semua balita dengan tren buruk sudah masuk program PMT atau terpantau normal."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-3 font-medium">Nama Balita</th>
                    <th className="px-3 py-3 font-medium">Usia</th>
                    <th className="px-3 py-3 font-medium">BB Terakhir</th>
                    <th className="px-3 py-3 font-medium">Status Gizi</th>
                    <th className="px-3 py-3 font-medium">Alasan Terjaring</th>
                    <th className="px-3 py-3 font-medium text-center">
                      Prioritas
                    </th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rekomendasiPMT.slice(0, 5).map((rek) => (
                    <tr
                      key={rek.id}
                      className="transition-colors hover:bg-rose-50/30 dark:hover:bg-rose-900/5"
                    >
                      <td className="px-3 py-3 font-semibold text-foreground">
                        {rek.namaBalita}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {rek.usiaBulan} bulan
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          {rek.beratSekarang} kg
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {rek.statusGiziSekarang}
                      </td>
                      <td
                        className="px-3 py-3 text-muted-foreground max-w-[250px] truncate"
                        title={rek.alasan}
                      >
                        {rek.alasan}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${rek.prioritas === "Tinggi" ? "bg-red-100 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-500/15 dark:text-red-400" : "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-400"}`}
                        >
                          {rek.prioritas}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewBalitaDetail(String(rek.id))}
                        >
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card> */}

      {/* Demographic Mini Charts */}
      <DemographicMiniCharts />
    </div>
  );
}

// --- Today's Summary Widget ---
function TodaysSummary() {
  const pengukuranList = useStore((s) => s.pengukuranList);
  const balitaList = useStore((s) => s.balitaList);
  const notifikasiList = useStore((s) => s.notifikasiList);
  const setView = useStore((s) => s.setView);

  const todayStr = new Date().toISOString().slice(0, 10);
  const today = new Date();

  const todayPengukuran = pengukuranList.filter(
    (p) => p.tanggalPengukuran === todayStr,
  );
  const balitaSudahDiukurBulanIni = new Set(
    pengukuranList
      .filter((p) => {
        const d = new Date(p.tanggalPengukuran);
        return (
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
        );
      })
      .map((p) => p.balitaId),
  );
  const balitaBelumDiukur = balitaList.filter(
    (b) => b.status === "Aktif" && !balitaSudahDiukurBulanIni.has(b.id),
  );
  const unreadNotif = notifikasiList.filter((n) => !n.dibaca).length;
  const todayGiziBermasalah = todayPengukuran.filter(
    (p) =>
      p.statusGizi !== "Normal" &&
      p.statusGizi !== "Risiko Gizi Lebih" &&
      p.statusGizi !== "Tinggi",
  ).length;

  const greeting =
    today.getHours() < 11
      ? "Selamat pagi"
      : today.getHours() < 15
        ? "Selamat siang"
        : today.getHours() < 18
          ? "Selamat sore"
          : "Selamat malam";
  const todayLabel = today.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Card className="relative overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 p-5 dark:border-emerald-500/20 dark:from-emerald-500/5 dark:via-teal-500/5 dark:to-emerald-500/5">
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-500/10" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {greeting}, Kader!  
          </p>
          <h3 className="mt-0.5 text-lg font-bold text-foreground">
            {todayLabel}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              {todayPengukuran.length} pengukuran hari ini
            </span>
            {todayGiziBermasalah > 0 && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                {todayGiziBermasalah} perlu perhatian
              </span>
            )}
            {balitaBelumDiukur.length > 0 && (
              <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                <ClipboardList className="h-3.5 w-3.5" />
                {balitaBelumDiukur.length} balita belum diukur bulan ini
              </span>
            )}
            {/* {unreadNotif > 0 && (
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                <Bell className="h-3.5 w-3.5" />
                {unreadNotif} notifikasi belum dibaca
              </span>
            )} */}
          </div>
        </div>

        {balitaBelumDiukur.length > 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-card/80 p-3 backdrop-blur-sm dark:border-emerald-500/20">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              📋 Perlu Diukur Bulan Ini
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {balitaBelumDiukur[0].namaLengkap}
              {balitaBelumDiukur.length > 1 &&
                ` +${balitaBelumDiukur.length - 1} lainnya`}
            </p>
            <p className="text-xs text-muted-foreground">
              Belum ada pengukuran tercatat bulan ini
            </p>
          </div>
        ) : (
          <Button
            onClick={() => setView("kalkulator")}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Calculator className="mr-2 h-4 w-4" /> Mulai Pengukuran
          </Button>
        )}
      </div>
    </Card>
  );
}

// --- Demographic Mini Charts ---
function DemographicMiniCharts() {
  const balitaList = useStore((s) => s.balitaList);

  const laki = balitaList.filter((b) => b.jenisKelamin === "Laki-laki").length;
  const perempuan = balitaList.filter(
    (b) => b.jenisKelamin === "Perempuan",
  ).length;
  const total = balitaList.length || 1;

  const ageGroups = [
    { label: "0-11", min: 0, max: 11, count: 0 },
    { label: "12-23", min: 12, max: 23, count: 0 },
    { label: "24-35", min: 24, max: 35, count: 0 },
    { label: "36-59", min: 36, max: 59, count: 0 },
  ];
  balitaList.forEach((b) => {
    const g = ageGroups.find(
      (g) => b.usiaBulan >= g.min && b.usiaBulan <= g.max,
    );
    if (g) g.count++;
  });
  const maxAgeCount = Math.max(...ageGroups.map((g) => g.count), 1);

  const genderData = [
    { nama: "Laki-laki", nilai: laki, warna: "#0ea5e9" },
    { nama: "Perempuan", nilai: perempuan, warna: "#ec4899" },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Komposisi Jenis Kelamin
        </h3>
        <div className="flex items-center gap-4">
          <div className="relative h-32 w-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  dataKey="nilai"
                  nameKey="nama"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {genderData.map((entry, i) => (
                    <Cell key={i} fill={entry.warna} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "11px",
                    background: "hsl(var(--popover))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-foreground">{total}</span>
              <span className="text-[9px] text-muted-foreground">Total</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {genderData.map((g) => (
              <div key={g.nama}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: g.warna }}
                    />
                    <span className="font-medium text-foreground">
                      {g.nama}
                    </span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {g.nilai} ({Math.round((g.nilai / total) * 100)}%)
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(g.nilai / total) * 100}%`,
                      backgroundColor: g.warna,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Distribusi Kelompok Usia
        </h3>
        <div className="space-y-2.5">
          {ageGroups.map((g) => (
            <div key={g.label} className="flex items-center gap-3">
              <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">
                {g.label} bln
              </span>
              <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted">
                <div
                  className="flex h-full items-center justify-end rounded-md bg-gradient-to-r from-emerald-400 to-teal-500 px-2 transition-all"
                  style={{ width: `${(g.count / maxAgeCount) * 100}%` }}
                >
                  <span className="text-[10px] font-bold text-white">
                    {g.count > 0 ? g.count : ""}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  color,
}: {
  icon: typeof Plus;
  label: string;
  onClick: () => void;
  color: "emerald" | "sky" | "amber" | "rose";
}) {
  const colors = {
    emerald:
      "hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10",
    sky: "hover:border-sky-300 hover:bg-sky-50 dark:hover:bg-sky-500/10",
    amber:
      "hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10",
    rose: "hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10",
  };
  const iconColors = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    sky: "text-sky-600 dark:text-sky-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
  };
  const iconBgs = {
    emerald: "bg-emerald-100 dark:bg-emerald-500/15",
    sky: "bg-sky-100 dark:bg-sky-500/15",
    amber: "bg-amber-100 dark:bg-amber-500/15",
    rose: "bg-rose-100 dark:bg-rose-500/15",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card p-4 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${colors[color]}`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBgs[color]} transition-transform duration-300 group-hover:scale-110`}
      >
        <Icon className={`h-5 w-5 ${iconColors[color]}`} />
      </div>
      <span className="text-xs font-semibold text-foreground">{label}</span>
    </button>
  );
}
