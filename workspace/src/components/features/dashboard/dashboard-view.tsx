"use client";

import { useMemo } from "react";
import {
  useStore,
  useDashboardStats,
  useGiziDistribusi,
  usePriorityAlerts,
  useTrenPengukuranBulanan,
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
  const { setView, viewBalitaDetail } = useStore();

  const totalDistribusi = distribusi.reduce((sum, d) => sum + d.nilai, 0) || 1;
  const giziBaikPersen =
    distribusi.find((d) => d.nama === "Gizi Baik")?.nilai ?? 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Baby}
          label="Total Balita Terdaftar"
          value={stats.totalBalita}
          trend={stats.perubahanBalitaBulanIni}
          trendLabel="bulan ini"
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-500/10"
        />
        {/* <StatCard
          icon={HeartPulse}
          label="Ibu Hamil Terpantau"
          value={stats.totalIbuHamil}
          trend={stats.perubahanIbuHamilBulanIni}
          trendLabel="bulan ini"
          iconColor="text-rose-600"
          iconBg="bg-rose-50 dark:bg-rose-500/10"
        /> */}
        <StatCard
          icon={TrendingUp}
          label="Persentase Gizi Baik"
          value={stats.persentaseGiziBaik}
          unit="%"
          trend={stats.perubahanPersentaseGiziBaik}
          trendLabel="dari bulan lalu"
          iconColor="text-sky-600"
          iconBg="bg-sky-50 dark:bg-sky-500/10"
        />
        <StatCard
          icon={AlertTriangle}
          label="Risiko Stunting"
          value={stats.totalRisikoStunting}
          trendLabel="perlu pantauan"
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-500/10"
        />
      </div>

      {/* Today's Summary Banner */}
      <TodaysSummary />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        {/* <QuickAction
          icon={HeartPulse}
          label="Data Ibu Hamil"
          onClick={() => setView("ibu-hamil")}
          color="rose"
        /> */}
      </div>

      {/* Monthly Trends Chart */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Tren Pengukuran 6 Bulan Terakhir
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Jumlah pengukuran dan kasus stunting/wasting per bulan
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
              name="Kasus Stunting"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="wasting"
              name="Kasus Wasting"
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
                            onClick={() => viewBalitaDetail(alert.id)}
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
                  Gizi Baik
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

      {/* Demographic Mini Charts */}
      <DemographicMiniCharts />

      {/* Upcoming Schedule + Quick Module Access */}
      {/* <UpcomingScheduleWidget /> */}
    </div>
  );
}

// --- Today's Summary Widget ---
function TodaysSummary() {
  const pengukuranList = useStore((s) => s.pengukuranList);
  const jadwalList = useStore((s) => s.jadwalList);
  const notifikasiList = useStore((s) => s.notifikasiList);
  const setView = useStore((s) => s.setView);

  const todayStr = new Date().toISOString().slice(0, 10);
  const today = new Date();

  const todayPengukuran = pengukuranList.filter(
    (p) => p.tanggalPengukuran === todayStr,
  );
  const todayJadwal = jadwalList.filter((j) => j.tanggal === todayStr);
  const unreadNotif = notifikasiList.filter((n) => !n.dibaca).length;
  const todayGiziBermasalah = todayPengukuran.filter(
    (p) => p.statusGizi !== "Normal" && p.statusGizi !== "Risiko Gizi Lebih",
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
      {/* Decorative blob */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-500/10" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {greeting}, Kader! 👋
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
            {todayJadwal.length > 0 && (
              <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                <Calendar className="h-3.5 w-3.5" />
                {todayJadwal.length} kegiatan terjadwal
              </span>
            )}
            {unreadNotif > 0 && (
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                <Bell className="h-3.5 w-3.5" />
                {unreadNotif} notifikasi belum dibaca
              </span>
            )}
          </div>
        </div>

        {todayJadwal.length > 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-card/80 p-3 backdrop-blur-sm dark:border-emerald-500/20">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              📌 Kegiatan Hari Ini
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {todayJadwal[0].judul}
            </p>
            <p className="text-xs text-muted-foreground">
              {todayJadwal[0].jamMulai} - {todayJadwal[0].jamSelesai} ·{" "}
              {todayJadwal[0].lokasi}
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
  const setView = useStore((s) => s.setView);

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
      {/* Gender distribution */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Komposisi Jenis Kelamin
          </h3>
          <button
            onClick={() => setView("analitik")}
            className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
          >
            Detail →
          </button>
        </div>
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

      {/* Age distribution */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Distribusi Kelompok Usia
          </h3>
          <button
            onClick={() => setView("analitik")}
            className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
          >
            Detail →
          </button>
        </div>
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

// function UpcomingScheduleWidget() {
//   const jadwalList = useStore((s) => s.jadwalList);
//   const setView = useStore((s) => s.setView);

//   const todayStr = new Date().toISOString().slice(0, 10);
//   const upcoming = useMemo(() => {
//     return jadwalList
//       .filter((j) => j.tanggal >= todayStr && j.status === "Terjadwal")
//       .sort(
//         (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
//       )
//       .slice(0, 4);
//   }, [jadwalList, todayStr]);

//   const jenisIcon: Record<string, typeof Calendar> = {
//     "Posyandu Rutin": Calendar,
//     "Penimbangan Balita": Baby,
//     "Pemberian Imunisasi": Syringe,
//     "Pemberian Vitamin A": Droplet,
//     "Pemberian PMT": Utensils,
//     "Penyuluhan Gizi": Activity,
//     "Pemeriksaan Ibu Hamil": HeartPulse,
//     "Posyandu Balita": Baby,
//     "Posyandu Lansia": Activity,
//   };

// return (
//   <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
{
  /* Upcoming schedule
      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Jadwal Posyandu Mendatang
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Kegiatan terjadwal dalam waktu dekat
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setView("jadwal")}>
            Lihat Semua <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="p-3">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Tidak ada jadwal mendatang"
              description="Belum ada kegiatan Posyandu yang terjadwal."
              className="py-6"
            />
          ) : (
            <ul className="space-y-2">
              {upcoming.map((j) => {
                const Icon = jenisIcon[j.jenisKegiatan] ?? Calendar;
                const date = new Date(j.tanggal);
                const daysUntil = Math.ceil(
                  (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                );
                return (
                  <li key={j.id}>
                    <div className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50">
                      <div className="flex w-12 shrink-0 flex-col items-center rounded-lg bg-emerald-50 py-1.5 dark:bg-emerald-500/10">
                        <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                          {NAMA_BULAN_SINGKAT[date.getMonth()]}
                        </span>
                        <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                          {date.getDate()}
                        </span>
                      </div>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {j.judul}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {j.jamMulai}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {j.lokasi}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${daysUntil <= 1 ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400" : daysUntil <= 3 ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}
                        >
                          {daysUntil === 0
                            ? "Hari ini"
                            : daysUntil === 1
                              ? "Besok"
                              : `${daysUntil} hari lagi`}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card> */
}

{
  /* Quick module access
      <Card className="p-5">
        <h3 className="mb-4 text-base font-semibold text-foreground">Akses Cepat Modul</h3>
        <div className="space-y-2">
          <ModuleLink icon={Syringe} label="Imunisasi" description="Catat & pantau vaksinasi" color="text-violet-600 bg-violet-50 dark:bg-violet-500/10" onClick={() => setView('imunisasi')} />
          <ModuleLink icon={Droplet} label="Vitamin A" description="Distribusi kapsul Vitamin A" color="text-blue-600 bg-blue-50 dark:bg-blue-500/10" onClick={() => setView('vitamin-a')} />
          <ModuleLink icon={Utensils} label="PMT" description="Pemberian Makanan Tambahan" color="text-amber-600 bg-amber-50 dark:bg-amber-500/10" onClick={() => setView('pmt')} />
          <ModuleLink icon={Calendar} label="Jadwal" description="Jadwal kegiatan Posyandu" color="text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" onClick={() => setView('jadwal')} />
        </div>
      </Card> */
}
{
  /* </div>
  );
} */
}

function ModuleLink({
  icon: Icon,
  label,
  description,
  color,
  onClick,
}: {
  icon: typeof Calendar;
  label: string;
  description: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-all hover:shadow-md hover:border-primary/30"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
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
