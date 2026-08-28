"use client";

import { useState, useMemo } from "react";
import { useStore, usePengukuranByBalita } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GiziStatusBadge } from "@/components/shared/status-badge";
import { WarningBadge } from "@/components/shared/warning-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PengukuranFormModal } from "./pengukuran-form-modal";
import { formatTanggalID, formatTanggalPanjangID } from "@/lib/data/mock-data";
import { getStatusGizi } from "@/lib/data/who-reference";
import type {
  IndikatorZScore,
  PengukuranBalita,
  StatusGizi,
} from "@/lib/data/types";
import {
  ArrowLeft,
  Plus,
  Scale,
  Trash2,
  Pencil, // BARU: Import Pencil
  User,
  Ruler,
  Weight,
  Calendar,
  MapPin,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Printer,
  Info,
  CreditCard,
  Phone,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { toast } from "sonner";

const INDICATOR_OPTIONS: {
  value: IndikatorZScore;
  label: string;
  dataKey: keyof PengukuranBalita;
  color: string;
}[] = [
  {
    value: "BBU",
    label: "Berat Badan / Umur",
    dataKey: "zScoreBBU",
    color: "#10b981",
  },
  {
    value: "TBU",
    label: "Tinggi Badan / Umur",
    dataKey: "zScoreTBU",
    color: "#3b82f6",
  },
  {
    value: "BBTB",
    label: "Berat Badan / Tinggi",
    dataKey: "zScoreBBTB",
    color: "#8b5cf6",
  },
  {
    value: "IMTU",
    label: "Indeks Massa Tubuh / Umur",
    dataKey: "zScoreIMTU",
    color: "#f59e0b",
  },
  {
    value: "LKA",
    label: "Lingkar Kepala / Umur",
    dataKey: "zScoreLKA",
    color: "#ec4899",
  },
  {
    value: "LILA",
    label: "Lingkar Lengan / Umur",
    dataKey: "zScoreLILA",
    color: "#06b6d4",
  },
];

const formatZ = (z: number | null | undefined) => {
  if (z === null || z === undefined) return "-";
  return `${z > 0 ? "+" : ""}${z.toFixed(2)}`;
};

export function BalitaDetailView() {
  const { balitaList, selectedBalitaId, setView, deletePengukuran } =
    useStore();
  const pengukuran = usePengukuranByBalita(selectedBalitaId);
  const [indicator, setIndicator] = useState<IndikatorZScore>("BBU");
  const [pengukuranModalOpen, setPengukuranModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // FASE BARU: State untuk menampung data pengukuran yang mau di-edit
  const [editTarget, setEditTarget] = useState<PengukuranBalita | null>(null);

  const balita = useMemo(
    () => balitaList.find((b) => b.id === selectedBalitaId),
    [balitaList, selectedBalitaId],
  );

  if (!balita) {
    return (
      <EmptyState
        icon={User}
        title="Data balita tidak ditemukan"
        description="Balita yang Anda cari mungkin telah dihapus."
        action={
          <Button onClick={() => setView("balita")}>Kembali ke Daftar</Button>
        }
      />
    );
  }

  const indConfig = INDICATOR_OPTIONS.find((i) => i.value === indicator)!;
  const rawChartData = [...pengukuran].sort(
    (a, b) =>
      new Date(a.tanggalPengukuran).getTime() -
      new Date(b.tanggalPengukuran).getTime(),
  );

  const chartData = rawChartData
    .filter((p) => p[indConfig.dataKey] !== null)
    .map((p) => ({
      bulan: new Date(p.tanggalPengukuran).toLocaleDateString("id-ID", {
        month: "short",
      }),
      value: p[indConfig.dataKey],
    }));

  const latest = pengukuran[0];

  const confirmDelete = () => {
    if (deleteTarget !== null) {
      deletePengukuran(deleteTarget);
      toast.success("Riwayat pengukuran dihapus");
      setDeleteTarget(null);
    }
  };

  const handleCetakProfil = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Pop-up diblokir", {
        description: "Izinkan pop-up untuk mencetak profil",
      });
      return;
    }
    const pengukuranRows = pengukuran
      .map(
        (p) => `
      <tr>
        <td>${formatTanggalID(p.tanggalPengukuran)}</td>
        <td>${p.usiaBulan} bln</td>
        <td>${p.beratBadanKg} kg</td>
        <td>${p.tinggiBadanCm} cm</td>
        <td>${p.lingkarKepalaCm ? p.lingkarKepalaCm + " cm" : "-"}</td>
        <td>${p.lilaCm ? p.lilaCm + " cm" : "-"}</td>
        <td class="${(p.zScoreBBU ?? 0) < -2 ? "warning" : ""}">${formatZ(p.zScoreBBU)}</td>
        <td class="${(p.zScoreTBU ?? 0) < -2 ? "warning" : ""}">${formatZ(p.zScoreTBU)}</td>
        <td class="${(p.zScoreBBTB ?? 0) < -2 ? "warning" : ""}">${formatZ(p.zScoreBBTB)}</td>
        <td>${formatZ(p.zScoreIMTU)}</td>
        <td>${formatZ(p.zScoreLKA)}</td>
        <td>${formatZ(p.zScoreLILA)}</td>
        <td class="status-${p.statusGizi === "Normal" ? "normal" : "warning"}">${p.statusGizi || "-"}</td>
      </tr>
    `,
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Profil Balita - ${balita.namaLengkap}</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1f2937; max-width: 1000px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 3px solid #059669; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { color: #059669; margin: 0 0 4px; font-size: 20px; }
          .header p { color: #6b7280; margin: 2px 0; font-size: 13px; }
          .section { margin-bottom: 20px; }
          .section h2 { color: #059669; font-size: 14px; margin: 0 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
          .info-item { font-size: 13px; }
          .info-item .label { color: #6b7280; display: block; font-size: 11px; }
          .info-item .value { font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { background: #ecfdf5; color: #065f46; text-align: left; padding: 8px; font-size: 10px; text-transform: uppercase; }
          td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
          td.warning { color: #d97706; font-weight: 600; }
          .status-normal { color: #059669; font-weight: 600; }
          .status-warning { color: #d97706; font-weight: 600; }
          .signature { text-align: center; margin-top: 40px; float: right; width: 250px;}
          .signature p { margin: 0; font-size: 12px; }
          .signature .name { margin-top: 60px; font-weight: 600; border-top: 1px solid #000; padding-top: 4px; display: inline-block; width: 100%;}
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>KARTU MENUJU SEHAT (KMS) — POSYANDU</h1>
          <p>Posyandu Melati RW 06</p>
          <p>Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>

        <div class="section">
          <h2>Data Balita & Orang Tua</h2>
          <div class="info-grid">
            <div class="info-item"><span class="label">Nama Anak</span><span class="value">${balita.namaLengkap}</span></div>
            <div class="info-item"><span class="label">NIK Anak</span><span class="value">${balita.nik || "-"}</span></div>
            <div class="info-item"><span class="label">Tanggal Lahir</span><span class="value">${formatTanggalID(balita.tanggalLahir)} (${balita.usiaBulan} bln)</span></div>
            <div class="info-item"><span class="label">Jenis Kelamin</span><span class="value">${balita.jenisKelamin || "-"}</span></div>
            <div class="info-item"><span class="label">Nama Ibu</span><span class="value">${balita.namaIbu || "-"}</span></div>
            <div class="info-item"><span class="label">Nama Ayah</span><span class="value">${balita.namaAyah || "-"}</span></div>
            <div class="info-item"><span class="label">NIK Orang Tua</span><span class="value">${balita.nikOrtu || "-"}</span></div>
            <div class="info-item"><span class="label">Kelp. Dasawisma</span><span class="value">${balita.kelompokDasawisma || "-"}</span></div>
            <div class="info-item"><span class="label">No. Telepon</span><span class="value">${balita.noTelp || "-"}</span></div>
            <div class="info-item"><span class="label">Berat Lahir</span><span class="value">${balita.beratLahirKg ? `${balita.beratLahirKg} kg` : "-"}</span></div>
            <div class="info-item"><span class="label">Panjang Lahir</span><span class="value">${balita.panjangLahirCm ? `${balita.panjangLahirCm} cm` : "-"}</span></div>
          </div>
        </div>

        <div class="section">
          <h2>Riwayat Pengukuran & Status Gizi</h2>
          <table>
            <thead><tr>
              <th>Tanggal</th><th>Usia</th><th>BB</th><th>TB</th><th>LKA</th><th>LiLA</th>
              <th>Z BB/U</th><th>Z TB/U</th><th>Z BB/TB</th><th>Z IMT/U</th><th>Z LKA</th><th>Z LiLA</th>
              <th>Status Akhir</th>
            </tr></thead>
            <tbody>${pengukuranRows || '<tr><td colspan="13" style="text-align:center;color:#6b7280;">Belum ada pengukuran</td></tr>'}</tbody>
          </table>
        </div>

        <div class="signature">
          <p>Mengetahui,</p>
          <p>Kader Posyandu</p>
          <p class="name">${useStore.getState().pengaturan.profil.namaLengkap}</p>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    toast.success("Profil siap dicetak", {
      description: "Jendela print telah terbuka",
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView("balita")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <WarningBadge jenisKelamin={balita.jenisKelamin} />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {balita.namaLengkap}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${balita.jenisKelamin === "Laki-laki" ? "bg-blue-50 text-blue-700 ring-blue-700/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20" : balita.jenisKelamin === "Perempuan" ? "bg-pink-50 text-pink-700 ring-pink-700/20 dark:bg-pink-500/10 dark:text-pink-400 dark:ring-pink-500/20" : "bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-gray-500/10 dark:text-gray-400 dark:ring-gray-500/20"}`}
              >
                {balita.jenisKelamin || "Gender belum diisi"}
              </span>
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                {balita.usiaBulan} Bulan
              </span>
              <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/20 font-mono">
                NIK: {balita.nik || "-"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCetakProfil}>
            <Printer className="mr-2 h-4 w-4" /> Cetak Profil
          </Button>
          <Button
            onClick={() => {
              setEditTarget(null); // Pastikan mode-nya Tambah Baru
              setPengukuranModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Input Pengukuran
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: Biodata */}
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white ${balita.jenisKelamin === "Laki-laki" ? "bg-gradient-to-br from-sky-400 to-blue-500" : balita.jenisKelamin === "Perempuan" ? "bg-gradient-to-br from-pink-400 to-rose-500" : "bg-gradient-to-br from-gray-400 to-slate-500"}`}
              >
                {balita.namaLengkap.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {balita.namaLengkap}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Lahir {formatTanggalID(balita.tanggalLahir)}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <InfoRow
                icon={User}
                label="Nama Ibu"
                value={balita.namaIbu || "-"}
              />
              <InfoRow
                icon={User}
                label="Nama Ayah"
                value={balita.namaAyah || "-"}
              />
              <InfoRow
                icon={CreditCard}
                label="NIK Orang Tua"
                value={balita.nikOrtu || "-"}
              />
              <InfoRow
                icon={MapPin}
                label="Kelp. Dasawisma"
                value={balita.kelompokDasawisma || "-"}
              />

              <InfoRow
                icon={Phone}
                label="No. Telepon / WA"
                value={
                  balita.noTelp ? (
                    <a
                      href={`https://wa.me/${balita.noTelp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline font-semibold"
                    >
                      {balita.noTelp}
                    </a>
                  ) : (
                    "-"
                  )
                }
              />

              <div className="my-2 border-t border-border border-dashed"></div>

              <InfoRow
                icon={Weight}
                label="Berat Lahir"
                value={balita.beratLahirKg ? `${balita.beratLahirKg} kg` : "-"}
              />
              <InfoRow
                icon={Ruler}
                label="Panjang Lahir"
                value={
                  balita.panjangLahirCm ? `${balita.panjangLahirCm} cm` : "-"
                }
              />
            </div>
          </Card>

          {/* Latest measurement summary */}
          {latest && (
            <Card className="p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Activity className="h-4 w-4 text-emerald-600" /> Pengukuran
                Terakhir
              </h3>
              <p className="mb-3 text-xs text-muted-foreground">
                {formatTanggalPanjangID(latest.tanggalPengukuran)}
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Berat Badan</p>
                  <p className="mt-1 text-xl font-bold text-foreground">
                    {latest.beratBadanKg}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      kg
                    </span>
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Tinggi Badan</p>
                  <p className="mt-1 text-xl font-bold text-foreground">
                    {latest.tinggiBadanCm}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      cm
                    </span>
                  </p>
                </div>
                {latest.lingkarKepalaCm && (
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-xs text-muted-foreground">
                      Lingkar Kepala
                    </p>
                    <p className="mt-1 text-base font-bold text-foreground">
                      {latest.lingkarKepalaCm}
                      <span className="text-xs font-normal text-muted-foreground">
                        {" "}
                        cm
                      </span>
                    </p>
                  </div>
                )}
                {latest.lilaCm && (
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-xs text-muted-foreground">
                      Lingkar Lengan
                    </p>
                    <p className="mt-1 text-base font-bold text-foreground">
                      {latest.lilaCm}
                      <span className="text-xs font-normal text-muted-foreground">
                        {" "}
                        cm
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {[
                  { label: "BB/U", z: latest.zScoreBBU, ind: "BBU" as const },
                  { label: "TB/U", z: latest.zScoreTBU, ind: "TBU" as const },
                  {
                    label: "BB/TB",
                    z: latest.zScoreBBTB,
                    ind: "BBTB" as const,
                  },
                  {
                    label: "IMT/U",
                    z: latest.zScoreIMTU,
                    ind: "IMTU" as const,
                  },
                  ...(latest.zScoreLKA !== null
                    ? [
                        {
                          label: "LKA",
                          z: latest.zScoreLKA,
                          ind: "LKA" as const,
                        },
                      ]
                    : []),
                  ...(latest.zScoreLILA !== null
                    ? [
                        {
                          label: "LiLA",
                          z: latest.zScoreLILA,
                          ind: "LILA" as const,
                        },
                      ]
                    : []),
                ].map((item) => {
                  const statusObj =
                    item.z !== null ? getStatusGizi(item.z, item.ind) : null;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="font-mono font-semibold text-foreground">
                          {formatZ(item.z)}
                        </span>
                      </div>
                      {statusObj ? (
                        <GiziStatusBadge status={statusObj.status} />
                      ) : (
                        <span className="inline-flex h-6 items-center rounded-md bg-gray-100 px-2 text-xs font-medium text-gray-600 dark:bg-gray-500/15 dark:text-gray-400">
                          -
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {pengukuran.length >= 2 && latest && pengukuran[1] && (
            <GrowthTrendIndicator latest={latest} previous={pengukuran[1]} />
          )}
        </div>

        {/* Right: Chart + History */}
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <TrendingUp className="h-4 w-4 text-emerald-600" /> Grafik
                  Pertumbuhan Z-Score
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Berdasarkan standar WHO (LMS)
                </p>
              </div>
              <select
                value={indicator}
                onChange={(e) =>
                  setIndicator(e.target.value as IndikatorZScore)
                }
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {INDICATOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {chartData.length === 0 &&
            (indicator === "LKA" || indicator === "LILA") ? (
              <EmptyState
                icon={Info}
                title={`Belum ada data pengukuran ${indicator === "LKA" ? "Lingkar Kepala" : "Lingkar Lengan"}`}
                description="Indikator opsional ini belum pernah dicatat untuk balita ini. Anda bisa menambahkannya melalui menu Input Pengukuran."
                className="py-8"
              />
            ) : chartData.length < 2 ? (
              <EmptyState
                icon={TrendingUp}
                title="Belum cukup data"
                description="Minimal 2 pengukuran diperlukan untuk menampilkan grafik tren."
                className="py-8"
              />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 10, bottom: 5, left: -15 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="bulan"
                    tick={{
                      fontSize: 12,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fontSize: 12,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    axisLine={false}
                    tickLine={false}
                    domain={[-4, 4]}
                    ticks={[-3, -2, -1, 0, 1, 2, 3]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      fontSize: "12px",
                      background: "hsl(var(--popover))",
                    }}
                  />
                  <ReferenceLine
                    y={0}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="5 5"
                    label={{
                      value: "Median",
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                      position: "right",
                    }}
                  />
                  <ReferenceLine
                    y={-2}
                    stroke="#f59e0b"
                    strokeDasharray="3 3"
                    label={{
                      value: "-2 SD",
                      fontSize: 10,
                      fill: "#f59e0b",
                      position: "right",
                    }}
                  />
                  <ReferenceLine y={2} stroke="#f59e0b" strokeDasharray="3 3" />
                  <ReferenceLine
                    y={-3}
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                    label={{
                      value: "-3 SD",
                      fontSize: 10,
                      fill: "#ef4444",
                      position: "right",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={indConfig.color}
                    strokeWidth={2.5}
                    dot={{
                      r: 5,
                      fill: indConfig.color,
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{ r: 7 }}
                    name={indConfig.label}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* WHO Growth Curve Position */}
          {latest && (
            <Card className="p-5">
              <div className="mb-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Activity className="h-4 w-4 text-emerald-600" /> Posisi pada
                  Kurva WHO
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Lokasi pengukuran terakhir relatif terhadap garis SD standar
                  WHO
                </p>
              </div>
              <div className="space-y-3">
                {[
                  {
                    label: "BB/U",
                    z: latest.zScoreBBU,
                    value: `${latest.beratBadanKg} kg`,
                    ind: "BBU" as const,
                  },
                  {
                    label: "TB/U",
                    z: latest.zScoreTBU,
                    value: `${latest.tinggiBadanCm} cm`,
                    ind: "TBU" as const,
                  },
                  {
                    label: "BB/TB",
                    z: latest.zScoreBBTB,
                    value: `${latest.beratBadanKg} kg / ${latest.tinggiBadanCm} cm`,
                    ind: "BBTB" as const,
                  },
                  {
                    label: "IMT/U",
                    z: latest.zScoreIMTU,
                    value: "Indeks Massa Tubuh",
                    ind: "IMTU" as const,
                  },
                  ...(latest.zScoreLKA !== null
                    ? [
                        {
                          label: "LKA",
                          z: latest.zScoreLKA,
                          value: `${latest.lingkarKepalaCm} cm`,
                          ind: "LKA" as const,
                        },
                      ]
                    : []),
                  ...(latest.zScoreLILA !== null
                    ? [
                        {
                          label: "LiLA",
                          z: latest.zScoreLILA,
                          value: `${latest.lilaCm} cm`,
                          ind: "LILA" as const,
                        },
                      ]
                    : []),
                ].map((item) => {
                  const statusObj =
                    item.z !== null ? getStatusGizi(item.z, item.ind) : null;
                  const position = Math.max(-4, Math.min(4, item.z ?? 0));
                  const leftPercent = ((position + 4) / 8) * 100;
                  return (
                    <div key={item.label}>
                      <div className="mb-1 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-foreground">
                            {item.label}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {item.value}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-foreground">
                          Z = {formatZ(item.z)}
                        </span>
                      </div>
                      <div className="relative h-10 rounded-lg bg-gradient-to-r from-red-100 via-amber-50 to-emerald-100 dark:from-red-500/10 dark:via-amber-500/5 dark:to-emerald-500/10">
                        {[-3, -2, -1, 0, 1, 2, 3].map((sd) => {
                          const sdLeft = ((sd + 4) / 8) * 100;
                          return (
                            <div
                              key={sd}
                              className={`absolute top-0 h-full w-px ${sd === 0 ? "bg-foreground/40" : "bg-foreground/15"}`}
                              style={{ left: `${sdLeft}%` }}
                            >
                              <span className="absolute -top-0.5 -translate-x-1/2 text-[8px] font-medium text-muted-foreground">
                                {sd > 0 ? `+${sd}` : sd}
                              </span>
                            </div>
                          );
                        })}
                        {item.z !== null && statusObj && (
                          <div
                            className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${leftPercent}%` }}
                          >
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-lg ${statusObj.severity === 0 ? "bg-emerald-500" : statusObj.severity === 1 ? "bg-sky-500" : statusObj.severity === 2 ? "bg-amber-500" : "bg-red-500"}`}
                            >
                              <span className="text-[9px] font-bold text-white">
                                {item.z > 0 ? "↑" : "↓"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Measurement History */}
          <Card className="overflow-hidden">
            <div className="border-b border-border p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Calendar className="h-4 w-4 text-emerald-600" /> Riwayat
                Pengukuran
              </h3>
            </div>
            {pengukuran.length === 0 ? (
              <EmptyState
                icon={Scale}
                title="Belum ada pengukuran"
                description="Mulai catat pengukuran pertama untuk balita ini."
                action={
                  <Button
                    onClick={() => {
                      setEditTarget(null);
                      setPengukuranModalOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Input Pengukuran
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Tanggal</th>
                      <th className="px-4 py-3 font-medium">Usia</th>
                      <th className="px-4 py-3 font-medium">BB/TB</th>
                      <th className="px-4 py-3 font-medium">LKA/LiLA</th>
                      <th className="px-4 py-3 font-medium">
                        Z-Score (BB/TB/BBTB)
                      </th>
                      <th className="px-4 py-3 font-medium">
                        Z-Score (IMT/LKA/LILA)
                      </th>
                      <th className="px-4 py-3 font-medium">Status Akhir</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pengukuran.map((p) => (
                      <tr
                        key={p.id}
                        className="transition-colors hover:bg-muted/40"
                      >
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatTanggalID(p.tanggalPengukuran)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {p.usiaBulan} bln
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5 font-medium text-foreground text-xs">
                            <span>{p.beratBadanKg} kg</span>
                            <span>{p.tinggiBadanCm} cm</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                            <span>
                              {p.lingkarKepalaCm
                                ? `${p.lingkarKepalaCm} cm`
                                : "-"}
                            </span>
                            <span>{p.lilaCm ? `${p.lilaCm} cm` : "-"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="font-mono text-muted-foreground">
                              BB/U:{" "}
                              <span className="font-semibold text-foreground">
                                {formatZ(p.zScoreBBU)}
                              </span>
                            </span>
                            <span className="font-mono text-muted-foreground">
                              TB/U:{" "}
                              <span className="font-semibold text-foreground">
                                {formatZ(p.zScoreTBU)}
                              </span>
                            </span>
                            <span className="font-mono text-muted-foreground">
                              BB/TB:{" "}
                              <span className="font-semibold text-foreground">
                                {formatZ(p.zScoreBBTB)}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="font-mono text-muted-foreground">
                              IMT/U:{" "}
                              <span className="font-semibold text-foreground">
                                {formatZ(p.zScoreIMTU)}
                              </span>
                            </span>
                            <span className="font-mono text-muted-foreground">
                              LKA:{" "}
                              <span className="font-semibold text-foreground">
                                {formatZ(p.zScoreLKA)}
                              </span>
                            </span>
                            <span className="font-mono text-muted-foreground">
                              LILA:{" "}
                              <span className="font-semibold text-foreground">
                                {formatZ(p.zScoreLILA)}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {p.statusGizi ? (
                            <GiziStatusBadge
                              status={p.statusGizi as StatusGizi}
                            />
                          ) : (
                            <span className="inline-flex h-6 items-center rounded-md bg-gray-100 px-2 text-xs font-medium text-gray-600">
                              -
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {/* FASE BARU: Tombol Edit (Pencil) */}
                            <button
                              onClick={() => {
                                setEditTarget(p);
                                setPengukuranModalOpen(true);
                              }}
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-emerald-600"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(String(p.id))}
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {pengukuranModalOpen && (
        <PengukuranFormModal
          open={pengukuranModalOpen}
          onOpenChange={(v) => {
            setPengukuranModalOpen(v);
            if (!v) setEditTarget(null); // Bersihkan edit target saat ditutup
          }}
          balita={balita}
          pengukuran={editTarget} // Oper data lama ke form
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Hapus Riwayat Pengukuran"
        description="Apakah Anda yakin ingin menghapus data pengukuran ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

function GrowthTrendIndicator({
  latest,
  previous,
}: {
  latest: PengukuranBalita;
  previous: PengukuranBalita;
}) {
  const indicators = [
    {
      label: "Berat Badan",
      latest: latest.beratBadanKg,
      prev: previous.beratBadanKg,
      unit: "kg",
      z: latest.zScoreBBU,
      prevZ: previous.zScoreBBU,
    },
    {
      label: "Tinggi Badan",
      latest: latest.tinggiBadanCm,
      prev: previous.tinggiBadanCm,
      unit: "cm",
      z: latest.zScoreTBU,
      prevZ: previous.zScoreTBU,
    },
  ];

  const overallTrend = indicators.every((i) => i.latest > i.prev)
    ? "improving"
    : indicators.every((i) => i.latest < i.prev)
      ? "declining"
      : "stable";
  const zTrend = indicators.every((i) => (i.z ?? 0) > (i.prevZ ?? 0))
    ? "improving"
    : indicators.every((i) => (i.z ?? 0) < (i.prevZ ?? 0))
      ? "declining"
      : "stable";

  const trendConfig = {
    improving: {
      label: "Membaik",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      border: "border-emerald-200 dark:border-emerald-500/20",
    },
    declining: {
      label: "Menurun",
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-500/10",
      border: "border-red-200 dark:border-red-500/20",
    },
    stable: {
      label: "Stabil",
      icon: Minus,
      color: "text-sky-600",
      bg: "bg-sky-50 dark:bg-sky-500/10",
      border: "border-sky-200 dark:border-sky-500/20",
    },
  };

  const growthConfig = trendConfig[overallTrend];
  const zConfig = trendConfig[zTrend];
  const GrowthIcon = growthConfig.icon;
  const ZIcon = zConfig.icon;

  return (
    <Card className="p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <TrendingUp className="h-4 w-4 text-emerald-600" /> Tren Pertumbuhan
      </h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Perbandingan dengan pengukuran sebelumnya (
        {formatTanggalID(previous.tanggalPengukuran)})
      </p>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div
          className={`rounded-lg border ${growthConfig.border} ${growthConfig.bg} p-3`}
        >
          <div className="flex items-center gap-2">
            <GrowthIcon className={`h-4 w-4 ${growthConfig.color}`} />
            <div>
              <p className="text-[10px] text-muted-foreground">
                Tren Ukuran Tubuh
              </p>
              <p className={`text-sm font-bold ${growthConfig.color}`}>
                {growthConfig.label}
              </p>
            </div>
          </div>
        </div>
        <div
          className={`rounded-lg border ${zConfig.border} ${zConfig.bg} p-3`}
        >
          <div className="flex items-center gap-2">
            <ZIcon className={`h-4 w-4 ${zConfig.color}`} />
            <div>
              <p className="text-[10px] text-muted-foreground">Tren Z-Score</p>
              <p className={`text-sm font-bold ${zConfig.color}`}>
                {zConfig.label}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {indicators.map((ind) => {
          const diff = ind.latest - ind.prev;
          const diffPercent =
            ind.prev > 0 ? ((diff / ind.prev) * 100).toFixed(1) : "0";
          const isUp = diff > 0;
          const zDiff =
            ind.z !== null && ind.prevZ !== null ? ind.z - ind.prevZ : null;

          return (
            <div key={ind.label} className="rounded-lg bg-muted/30 p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {ind.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  vs {ind.prev} {ind.unit}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-foreground">
                    {ind.latest} {ind.unit}
                  </span>
                  <span
                    className={`flex items-center gap-0.5 text-xs font-semibold ${isUp ? "text-emerald-600" : diff < 0 ? "text-red-600" : "text-muted-foreground"}`}
                  >
                    {isUp ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : diff < 0 ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                    {isUp ? "+" : ""}
                    {diff.toFixed(1)} {ind.unit} ({isUp ? "+" : ""}
                    {diffPercent}%)
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground">
                    Z: {formatZ(ind.prevZ)}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-semibold text-foreground">
                    {formatZ(ind.z)}
                  </span>
                  {zDiff !== null && (
                    <span
                      className={`ml-1 font-semibold ${zDiff > 0 ? "text-emerald-600" : zDiff < 0 ? "text-red-600" : "text-muted-foreground"}`}
                    >
                      ({zDiff > 0 ? "+" : ""}
                      {zDiff.toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
