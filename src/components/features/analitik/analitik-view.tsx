"use client";

import {
  useStore,
  useDashboardStats,
  useAgeGroupDistribution,
  useGenderDistribution,
  useGiziTrends6Bulan,
  useProgramCoverage,
  useZScoreDistribution,
} from "@/lib/store";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import {
  Baby,
  Users,
  TrendingUp,
  AlertTriangle,
  Activity,
  PieChart as PieIcon,
  BarChart3,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
} from "recharts";

export function AnalitikView() {
  const stats = useDashboardStats();
  const ageGroups = useAgeGroupDistribution();
  const gender = useGenderDistribution();
  const giziTrends = useGiziTrends6Bulan();
  const programCoverage = useProgramCoverage();
  const zScoreDist = useZScoreDistribution();

  const totalBalita = stats.totalBalita || 1;
  const stuntingRate = stats.totalRisikoStunting;
  const giziBaikRate = stats.persentaseGiziBaik;

  return (
    <div className="space-y-6">
      {/* Top summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Baby}
          label="Total Balita"
          value={stats.totalBalita}
          trendLabel="terdaftar"
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-500/10"
        />
        <StatCard
          icon={Users}
          label="Ibu Hamil"
          value={stats.totalIbuHamil}
          trendLabel="terpantau"
          iconColor="text-rose-600"
          iconBg="bg-rose-50 dark:bg-rose-500/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Gizi Normal"
          value={giziBaikRate}
          unit="%"
          trendLabel="dari total"
          iconColor="text-sky-600"
          iconBg="bg-sky-50 dark:bg-sky-500/10"
        />
        {/* FASE 2: Risiko Stunting -> Balita Berisiko */}
        <StatCard
          icon={AlertTriangle}
          label="Balita Berisiko"
          value={stuntingRate}
          trendLabel="perlu intervensi"
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-500/10"
        />
      </div>

      {/* Charts row 1: Age/Gender + Z-Score distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Age group distribution */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Distribusi Kelompok Usia
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Berdasarkan jenis kelamin per kelompok usia
            </p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={ageGroups}
              margin={{ top: 5, right: 10, bottom: 5, left: -20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
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
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} iconType="circle" />
              <Bar
                dataKey="laki"
                name="Laki-laki"
                fill="#0ea5e9"
                radius={[3, 3, 0, 0]}
                maxBarSize={30}
              />
              <Bar
                dataKey="perempuan"
                name="Perempuan"
                fill="#ec4899"
                radius={[3, 3, 0, 0]}
                maxBarSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Gender distribution pie */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <PieIcon className="h-5 w-5 text-sky-600" />
              Distribusi Jenis Kelamin
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Komposisi balita terdaftar
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gender}
                    dataKey="nilai"
                    nameKey="nama"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {gender.map((entry, i) => (
                      <Cell key={i} fill={entry.warna} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      fontSize: "12px",
                      background: "hsl(var(--popover))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">
                  {stats.totalBalita}
                </span>
                <span className="text-[10px] text-muted-foreground">Total</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {gender.map((g) => (
                <div
                  key={g.nama}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: g.warna }}
                      />
                      <span className="text-sm font-medium text-foreground">
                        {g.nama}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-foreground">
                      {g.nilai}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(g.nilai / totalBalita) * 100}%`,
                          backgroundColor: g.warna,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round((g.nilai / totalBalita) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Charts row 2: Gizi trends + Z-Score distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gizi status trends */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Tren Status Gizi 6 Bulan
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Perkembangan kasus per bulan
            </p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={giziTrends}
              margin={{ top: 5, right: 10, bottom: 5, left: -20 }}
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
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} iconType="circle" />

              {/* FASE 2: Penggantian Nama Legend (Tooltips) */}
              <Line
                type="monotone"
                dataKey="normal"
                name="Normal"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="stunting"
                name="Pendek"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="wasting"
                name="Gizi Kurang / Buruk"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="giziLebih"
                name="Berisiko / Gizi Lebih"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Z-Score distribution */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Activity className="h-5 w-5 text-violet-600" />
              Distribusi Z-Score (Pengukuran Terakhir)
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Berdasarkan Z-Score minimum dari 3 indikator
            </p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={zScoreDist}
              layout="vertical"
              margin={{ top: 5, right: 20, bottom: 5, left: 30 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  fontSize: "12px",
                  background: "hsl(var(--popover))",
                }}
              />
              <Bar
                dataKey="count"
                name="Jumlah Balita"
                radius={[0, 4, 4, 0]}
                maxBarSize={28}
              >
                {zScoreDist.map((entry, i) => {
                  const color =
                    entry.label === "< -3 SD"
                      ? "#ef4444"
                      : entry.label === "-3 to -2 SD"
                        ? "#f59e0b"
                        : entry.label === "-2 to +1 SD"
                          ? "#10b981"
                          : entry.label === "+1 to +2 SD"
                            ? "#0ea5e9"
                            : "#8b5cf6";
                  return <Cell key={i} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts row 3: Program coverage */}
      <Card className="p-5">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Target className="h-5 w-5 text-amber-600" />
            Cakupan Program Posyandu
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Persentase balita yang terjangkau setiap program
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {programCoverage.map((prog) => (
            <div key={prog.nama} className="flex flex-col items-center">
              <div className="relative h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    data={[
                      {
                        name: prog.nama,
                        value: prog.persentase,
                        fill: prog.warna,
                      },
                    ]}
                    startAngle={90}
                    endAngle={90 - (prog.persentase / 100) * 360}
                  >
                    <RadialBar
                      background={{ fill: "hsl(var(--muted))" }}
                      dataKey="value"
                      cornerRadius={10}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-foreground">
                    {prog.persentase}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {prog.given}/{prog.total}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {prog.nama}
              </p>
              <p className="text-xs text-muted-foreground">
                {prog.given} balita terjangkau
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Key insights */}
      <Card className="p-5">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
          <Activity className="h-5 w-5 text-emerald-600" />
          Insight & Rekomendasi
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InsightItem
            type={giziBaikRate >= 80 ? "success" : "warning"}
            title="Status Gizi Normal"
            message={`${giziBaikRate}% balita memiliki status gizi normal. ${giziBaikRate >= 80 ? "Pertahankan program yang berjalan." : "Tingkatkan intervensi gizi."}`}
          />
          {/* FASE 2: Prevalensi Stunting -> Kasus Balita Pendek */}
          <InsightItem
            type={
              stuntingRate === 0
                ? "success"
                : stuntingRate <= 2
                  ? "warning"
                  : "danger"
            }
            title="Kasus Balita Pendek"
            message={`${stuntingRate} balita terdeteksi pendek. ${stuntingRate === 0 ? "Tidak ada kasus pendek." : stuntingRate <= 2 ? "Perlu pemantauan rutin." : "Perlu intervensi PMT segera."}`}
          />
          <InsightItem
            type={programCoverage[0]?.persentase >= 80 ? "success" : "warning"}
            title="Cakupan Imunisasi"
            message={`${programCoverage[0]?.persentase}% balita mendapat imunisasi. ${programCoverage[0]?.persentase >= 80 ? "Cakupan baik." : "Perlu peningkatan."}`}
          />
          <InsightItem
            type={programCoverage[1]?.persentase >= 80 ? "success" : "warning"}
            title="Cakupan Vitamin A"
            message={`${programCoverage[1]?.persentase}% balita mendapat Vitamin A. ${programCoverage[1]?.persentase >= 80 ? "Cakupan baik." : "Perlu peningkatan distribusi."}`}
          />
        </div>
      </Card>
    </div>
  );
}

function InsightItem({
  type,
  title,
  message,
}: {
  type: "success" | "warning" | "danger";
  title: string;
  message: string;
}) {
  const config = {
    success: {
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      border: "border-emerald-200 dark:border-emerald-500/20",
      icon: "text-emerald-600",
      label: "Baik",
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-500/10",
      border: "border-amber-200 dark:border-amber-500/20",
      icon: "text-amber-600",
      label: "Perhatian",
    },
    danger: {
      bg: "bg-red-50 dark:bg-red-500/10",
      border: "border-red-200 dark:border-red-500/20",
      icon: "text-red-600",
      label: "Kritis",
    },
  }[type];
  return (
    <div className={`rounded-lg border ${config.border} ${config.bg} p-4`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.icon}`}
        >
          {config.label}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
