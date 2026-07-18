'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/shared/stat-card';
import { LaporanStatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { NAMA_BULAN } from '@/lib/data/mock-data';
import { Baby, AlertTriangle, HeartPulse, FileDown, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';

export function LaporanView() {
  const { laporanRecords, balitaList, ibuHamilList, pengukuranList } = useStore();
  const [bulan, setBulan] = useState(new Date().getMonth());
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [filterJenis, setFilterJenis] = useState<string>('all');

  // Generate report records from actual data
  const records = useMemo(() => {
    const balitaRecords = pengukuranList.map((p) => {
      const balita = balitaList.find((b) => b.id === p.balitaId);
      if (!balita) return null;
      const recordDate = new Date(p.tanggalPengukuran);
      return {
        id: p.id,
        nik: balita.nik,
        nama: balita.namaLengkap,
        jenisPemeriksaan: 'Pengukuran Balita' as const,
        hasilUkur: `BB: ${p.beratBadanKg} kg, TB: ${p.tinggiBadanCm} cm`,
        status: (p.statusGizi === 'Normal' || p.statusGizi === 'Risiko Gizi Lebih' ? 'Normal' : 'Perlu Tindakan') as 'Normal' | 'Perlu Tindakan',
        keterangan: p.statusGizi === 'Normal' ? 'Status gizi normal' : `Status: ${p.statusGizi}`,
        bulan: recordDate.getMonth(),
        tahun: recordDate.getFullYear(),
      };
    }).filter(Boolean);

    const ibuRecords = ibuHamilList.map((i) => ({
      id: 1000 + i.id,
      nik: i.nik,
      nama: i.namaLengkap,
      jenisPemeriksaan: 'Pemeriksaan Ibu Hamil' as const,
      hasilUkur: `LILA: ${i.lilaTerakCm} cm${i.tekananDarah ? `, TD: ${i.tekananDarah}` : ''}`,
      status: (i.status === 'Risiko KEK' ? 'Perlu Tindakan' : 'Normal') as 'Normal' | 'Perlu Tindakan',
      keterangan: i.status === 'Risiko KEK' ? 'Risiko KEK (Kurang Energi Kronis)' : 'Kehamilan sehat',
      bulan: new Date().getMonth(),
      tahun: new Date().getFullYear(),
    }));

    return [...balitaRecords, ...ibuRecords] as NonNullable<(typeof balitaRecords)[number]>[];
  }, [balitaList, ibuHamilList, pengukuranList]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (r.bulan !== bulan || r.tahun !== tahun) return false;
      if (filterJenis !== 'all' && r.jenisPemeriksaan !== filterJenis) return false;
      return true;
    });
  }, [records, bulan, tahun, filterJenis]);

  const stats = useMemo(() => ({
    totalBalitaDitimbang: filteredRecords.filter((r) => r.jenisPemeriksaan === 'Pengukuran Balita').length,
    kasusStuntingBaru: filteredRecords.filter((r) => r.keterangan.includes('Stunting')).length,
    ibuHamilKEK: filteredRecords.filter((r) => r.keterangan.includes('KEK')).length,
  }), [filteredRecords]);

  const tahunOptions = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];

  const handleExport = (type: 'pdf' | 'excel') => {
    if (type === 'excel') {
      // Generate actual CSV file
      const headers = ['NIK', 'Nama', 'Jenis Pemeriksaan', 'Hasil Ukur', 'Status', 'Keterangan'];
      const rows = filteredRecords.map((r) => [
        r.nik,
        r.nama,
        r.jenisPemeriksaan,
        r.hasilUkur,
        r.status,
        r.keterangan,
      ]);
      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      // Add BOM for Excel UTF-8 compatibility
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Laporan_Posyandu_${NAMA_BULAN[bulan]}_${tahun}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Export CSV berhasil', {
        description: `Laporan ${NAMA_BULAN[bulan]} ${tahun} — ${filteredRecords.length} record`,
      });
    } else {
      // PDF export: open print dialog with formatted HTML
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Pop-up diblokir', { description: 'Izinkan pop-up untuk export PDF' });
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
            <div class="summary-card"><div class="label">Kasus Stunting Baru</div><div class="value">${stats.kasusStuntingBaru}</div></div>
            <div class="summary-card"><div class="label">Ibu Hamil KEK</div><div class="value">${stats.ibuHamilKEK}</div></div>
          </div>
          <table>
            <thead><tr><th>NIK</th><th>Nama</th><th>Pemeriksaan</th><th>Hasil</th><th>Status</th><th>Keterangan</th></tr></thead>
            <tbody>
              ${filteredRecords.map((r) => `<tr><td>${r.nik}</td><td>${r.nama}</td><td>${r.jenisPemeriksaan}</td><td>${r.hasilUkur}</td><td class="${r.status === 'Normal' ? 'status-normal' : 'status-tindakan'}">${r.status}</td><td>${r.keterangan}</td></tr>`).join('')}
            </tbody>
          </table>
          <script>window.onload = () => window.print();</script>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
      toast.success('Export PDF siap', {
        description: 'Jendela print telah terbuka — pilih "Save as PDF"',
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Bulan</label>
              <Select value={String(bulan)} onValueChange={(v) => setBulan(Number(v))}>
                <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NAMA_BULAN.map((b, i) => <SelectItem key={i} value={String(i)}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tahun</label>
              <Select value={String(tahun)} onValueChange={(v) => setTahun(Number(v))}>
                <SelectTrigger className="w-full sm:w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tahunOptions.map((t) => <SelectItem key={t} value={String(t)}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Jenis</label>
              <Select value={filterJenis} onValueChange={setFilterJenis}>
                <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="Pengukuran Balita">Pengukuran Balita</SelectItem>
                  <SelectItem value="Pemeriksaan Ibu Hamil">Pemeriksaan Ibu Hamil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <FileText className="mr-2 h-4 w-4" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
              <FileDown className="mr-2 h-4 w-4" /> Excel
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Baby} label="Balita Ditimbang" value={stats.totalBalitaDitimbang} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-500/10" />
        <StatCard icon={AlertTriangle} label="Kasus Stunting Baru" value={stats.kasusStuntingBaru} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-500/10" />
        <StatCard icon={HeartPulse} label="Ibu Hamil KEK" value={stats.ibuHamilKEK} iconColor="text-rose-600" iconBg="bg-rose-50 dark:bg-rose-500/10" />
      </div>

      {/* Report table */}
      <Card className="overflow-hidden">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">
            Preview Laporan — {NAMA_BULAN[bulan]} {tahun}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{filteredRecords.length} record pemeriksaan</p>
        </div>
        {filteredRecords.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Tidak ada data laporan"
            description={`Tidak ada pemeriksaan tercatat untuk ${NAMA_BULAN[bulan]} ${tahun}.`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-zebra w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">NIK</th>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Jenis Pemeriksaan</th>
                  <th className="px-4 py-3 font-medium">Hasil Ukur</th>
                  <th className="px-4 py-3 font-medium">Keterangan</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.nik}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{r.nama}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.jenisPemeriksaan}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.hasilUkur}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.keterangan}</td>
                    <td className="px-4 py-3"><LaporanStatusBadge status={r.status} /></td>
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
