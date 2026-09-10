"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/shared/stat-card";
import {
  LaporanStatusBadge,
  StatusBadge,
} from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { NAMA_BULAN } from "@/lib/data/mock-data";
import { Baby, AlertTriangle, FileDown, FileText } from "lucide-react";
import { toast } from "sonner";

export function LaporanView() {
  const { balitaList, pengukuranList } = useStore();
  const [bulan, setBulan] = useState(new Date().getMonth());
  const [tahun, setTahun] = useState(new Date().getFullYear());

  // FASE 3: Tambahan Filter Kehadiran dan Status Gizi
  const [filterKehadiran, setFilterKehadiran] = useState<string>("all");
  const [filterGizi, setFilterGizi] = useState<string>("all");

  // FASE 3: Generate records dengan left-join dari balitaList (mendeteksi Bolos)
  const records = useMemo(() => {
    const balitaAktif = balitaList.filter((b) => b.status === "Aktif");

    return balitaAktif.map((balita) => {
      // Cari apakah balita ini punya pengukuran di bulan & tahun terpilih
      const pengukuran = pengukuranList.find((p) => {
        if (String(p.balitaId) !== String(balita.id)) return false;
        const d = new Date(p.tanggalPengukuran);
        return d.getMonth() === bulan && d.getFullYear() === tahun;
      });

      if (pengukuran) {
        return {
          id: pengukuran.id,
          nik: balita.nik || "-",
          nama: balita.namaLengkap,
          jenisPemeriksaan: "Pengukuran Balita",
          hasilUkur: `BB: ${pengukuran.beratBadanKg} kg, TB: ${pengukuran.tinggiBadanCm} cm`,
          status: (pengukuran.statusGizi === "Normal" ||
          pengukuran.statusGizi === "Tinggi" ||
          pengukuran.statusGizi === "Berisiko Gizi Lebih"
            ? "Normal"
            : "Perlu Tindakan") as "Normal" | "Perlu Tindakan",
          keterangan:
            pengukuran.statusGizi === "Normal"
              ? "Status gizi normal"
              : `Status: ${pengukuran.statusGizi}`,
          statusGizi: pengukuran.statusGizi,
          kehadiran: "Hadir",
        };
      } else {
        // Jika tidak ada pengukuran = Bolos
        return {
          id: `bolos-${balita.id}`,
          nik: balita.nik || "-",
          nama: balita.namaLengkap,
          jenisPemeriksaan: "Pengukuran Balita",
          hasilUkur: "-",
          status: "Perlu Tindakan" as "Perlu Tindakan",
          keterangan: "Tidak Hadir (Bolos)",
          statusGizi: null,
          kehadiran: "Bolos",
        };
      }
    });
  }, [balitaList, pengukuranList, bulan, tahun]);

  // FASE 3: Eksekusi Filter
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterKehadiran !== "all" && r.kehadiran !== filterKehadiran)
        return false;
      if (filterGizi !== "all" && r.statusGizi !== filterGizi) return false;
      return true;
    });
  }, [records, filterKehadiran, filterGizi]);

  // FASE 2: Ganti terminology Stunting/Wasting menjadi Pendek & Gizi Kurang
  const stats = useMemo(
    () => ({
      totalBalitaDitimbang: records.filter((r) => r.kehadiran === "Hadir")
        .length,
      kasusPendekBaru: records.filter((r) => r.statusGizi === "Pendek").length,
      kasusGiziKurang: records.filter(
        (r) => r.statusGizi === "Gizi Kurang" || r.statusGizi === "Gizi Buruk",
      ).length,
    }),
    [records],
  );

  const tahunOptions = [
    new Date().getFullYear() - 1,
    new Date().getFullYear(),
    new Date().getFullYear() + 1,
  ];

  const handleExport = (type: "pdf" | "excel") => {
    if (type === "excel") {
      const headers = [
        "NIK",
        "Nama",
        "Kehadiran",
        "Hasil Ukur",
        "Status",
        "Keterangan",
      ];
      const rows = filteredRecords.map((r) => [
        r.nik,
        r.nama,
        r.kehadiran,
        r.hasilUkur,
        r.status,
        r.keterangan,
      ]);
      const csv = [headers, ...rows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");
      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Laporan_Posyandu_${NAMA_BULAN[bulan]}_${tahun}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Export CSV berhasil", {
        description: `Laporan ${NAMA_BULAN[bulan]} ${tahun} — ${filteredRecords.length} record`,
      });
    } else {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Pop-up diblokir", {
          description: "Izinkan pop-up untuk export PDF",
        });
        return;
      }
      const html = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <title>Laporan Posyandu ${NAMA_BULAN[bulan]} ${tahun}</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1f2937; }
            h1 { color: #059669; margin-bottom: 4px; }
            .meta { color: #6b7280; margin-bottom: 24px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th { background: #ecfdf5; color: #065f46; text-align: left; padding: 10px; font-size: 12px; text-transform: uppercase; }
            td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
            .status-normal { color: #059669; font-weight: 600; }
            .status-tindakan { color: #d97706; font-weight: 600; }
            .summary { display: flex; gap: 16px; margin: 20px 0; }
            .summary-card { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
            .summary-card .label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
            .summary-card .value { font-size: 24px; font-weight: 700; color: #1f2937; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>Laporan Bulanan Posyandu</h1>
          <div class="meta">Periode: ${NAMA_BULAN[bulan]} ${tahun} · Posyandu Melati RW 06</div>
          <div class="summary">
            <div class="summary-card"><div class="label">Balita Ditimbang</div><div class="value">${stats.totalBalitaDitimbang}</div></div>
            <div class="summary-card"><div class="label">Kasus Pendek Baru</div><div class="value">${stats.kasusPendekBaru}</div></div>
            <div class="summary-card"><div class="label">Kasus Gizi Kurang/Buruk</div><div class="value">${stats.kasusGiziKurang}</div></div>
          </div>
          <table>
            <thead><tr><th>NIK</th><th>Nama</th><th>Kehadiran</th><th>Hasil Ukur</th><th>Status Akhir</th><th>Keterangan</th></tr></thead>
            <tbody>
              ${filteredRecords.map((r) => `<tr><td>${r.nik}</td><td>${r.nama}</td><td style="color: ${r.kehadiran === "Bolos" ? "red" : "inherit"}">${r.kehadiran}</td><td>${r.hasilUkur}</td><td class="${r.status === "Normal" ? "status-normal" : "status-tindakan"}">${r.status}</td><td>${r.keterangan}</td></tr>`).join("")}
            </tbody>
          </table>
          <script>window.onload = () => window.print();</script>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
      toast.success("Export PDF siap", {
        description: 'Jendela print telah terbuka — pilih "Save as PDF"',
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end sm:gap-4 flex-wrap">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Bulan
              </label>
              <Select
                value={String(bulan)}
                onValueChange={(v) => setBulan(Number(v))}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NAMA_BULAN.map((b, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Tahun
              </label>
              <Select
                value={String(tahun)}
                onValueChange={(v) => setTahun(Number(v))}
              >
                <SelectTrigger className="w-full sm:w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tahunOptions.map((t) => (
                    <SelectItem key={t} value={String(t)}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* FASE 3: Filter Kehadiran */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Kehadiran
              </label>
              <Select
                value={filterKehadiran}
                onValueChange={setFilterKehadiran}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="Hadir">Hadir Diukur</SelectItem>
                  <SelectItem value="Bolos">Tidak Hadir</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* FASE 3: Filter Status Gizi Khusus Laporan */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Status Gizi
              </label>
              <Select value={filterGizi} onValueChange={setFilterGizi}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="Pendek">Kasus Pendek</SelectItem>
                  <SelectItem value="Gizi Kurang">Gizi Kurang</SelectItem>
                  <SelectItem value="Gizi Buruk">Gizi Buruk</SelectItem>
                  <SelectItem value="Gizi Lebih">
                    Gizi Lebih / Berisiko
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
            >
              <FileText className="mr-2 h-4 w-4" /> PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("excel")}
            >
              <FileDown className="mr-2 h-4 w-4" /> Excel
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary cards (Fase 2: Penghalusan Terminologi) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Baby}
          label="Balita Ditimbang"
          value={stats.totalBalitaDitimbang}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-500/10"
        />
        <StatCard
          icon={AlertTriangle}
          label="Kasus Pendek Baru"
          value={stats.kasusPendekBaru}
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-500/10"
        />
        <StatCard
          icon={AlertTriangle}
          label="Kasus Gizi Kurang/Buruk"
          value={stats.kasusGiziKurang}
          iconColor="text-rose-600"
          iconBg="bg-rose-50 dark:bg-rose-500/10"
        />
      </div>

      {/* Report table */}
      <Card className="overflow-hidden">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">
            Data Laporan {NAMA_BULAN[bulan]} {tahun}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Menampilkan {filteredRecords.length} record
          </p>
        </div>
        {filteredRecords.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Tidak ada data laporan"
            description="Tidak ada data yang sesuai dengan filter yang dipilih."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-zebra w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">NIK</th>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Kehadiran</th>
                  <th className="px-4 py-3 font-medium">Hasil Ukur</th>
                  <th className="px-4 py-3 font-medium">Status Gizi</th>
                  <th className="px-4 py-3 font-medium">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map((r) => (
                  <tr
                    key={r.id}
                    className="transition-colors hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {r.nik}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {r.nama}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        variant={
                          r.kehadiran === "Hadir" ? "success" : "critical"
                        }
                      >
                        {r.kehadiran}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.hasilUkur}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.keterangan}
                    </td>
                    <td className="px-4 py-3">
                      <LaporanStatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
