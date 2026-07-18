'use client';

import { useState, useMemo } from 'react';
import { useStore, usePengukuranByBalita } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GiziStatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { PengukuranFormModal } from './pengukuran-form-modal';
import { formatTanggalID, formatTanggalPanjangID } from '@/lib/data/mock-data';
import { getStatusGizi } from '@/lib/data/who-reference';
import type { IndikatorZScore, PengukuranBalita } from '@/lib/data/types';
import { ArrowLeft, Plus, Scale, Trash2, User, Ruler, Weight, Calendar, Heart, MapPin, Activity, TrendingUp, TrendingDown, Minus, Printer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { toast } from 'sonner';

const INDICATOR_OPTIONS: { value: IndikatorZScore; label: string; dataKey: string; color: string }[] = [
  { value: 'BBU', label: 'Berat Badan / Umur', dataKey: 'zScoreBBU', color: '#10b981' },
  { value: 'TBU', label: 'Tinggi Badan / Umur', dataKey: 'zScoreTBU', color: '#3b82f6' },
  { value: 'BBTB', label: 'Berat Badan / Tinggi', dataKey: 'zScoreBBTB', color: '#8b5cf6' },
];

export function BalitaDetailView() {
  const { balitaList, selectedBalitaId, setView, deletePengukuran } = useStore();
  const pengukuran = usePengukuranByBalita(selectedBalitaId);
  const [indicator, setIndicator] = useState<IndikatorZScore>('BBU');
  const [pengukuranModalOpen, setPengukuranModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

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
        action={<Button onClick={() => setView('balita')}>Kembali ke Daftar</Button>}
      />
    );
  }

  const chartData = [...pengukuran]
    .sort((a, b) => new Date(a.tanggalPengukuran).getTime() - new Date(b.tanggalPengukuran).getTime())
    .map((p) => ({
      bulan: new Date(p.tanggalPengukuran).toLocaleDateString('id-ID', { month: 'short' }),
      zScoreBBU: p.zScoreBBU,
      zScoreTBU: p.zScoreTBU,
      zScoreBBTB: p.zScoreBBTB,
    }));

  const indConfig = INDICATOR_OPTIONS.find((i) => i.value === indicator)!;
  const latest = pengukuran[0];

  const confirmDelete = () => {
    if (deleteTarget !== null) {
      deletePengukuran(deleteTarget);
      toast.success('Riwayat pengukuran dihapus');
      setDeleteTarget(null);
    }
  };

  const handleCetakProfil = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up diblokir', { description: 'Izinkan pop-up untuk mencetak profil' });
      return;
    }
    const pengukuranRows = pengukuran.map((p) => `
      <tr>
        <td>${formatTanggalID(p.tanggalPengukuran)}</td>
        <td>${p.usiaBulan} bln</td>
        <td>${p.beratBadanKg} kg</td>
        <td>${p.tinggiBadanCm} cm</td>
        <td class="${p.zScoreBBU < -2 ? 'warning' : ''}">${p.zScoreBBU > 0 ? '+' : ''}${p.zScoreBBU.toFixed(2)}</td>
        <td class="${p.zScoreTBU < -2 ? 'warning' : ''}">${p.zScoreTBU > 0 ? '+' : ''}${p.zScoreTBU.toFixed(2)}</td>
        <td class="${p.zScoreBBTB < -2 ? 'warning' : ''}">${p.zScoreBBTB > 0 ? '+' : ''}${p.zScoreBBTB.toFixed(2)}</td>
        <td class="status-${p.statusGizi === 'Normal' ? 'normal' : 'warning'}">${p.statusGizi}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Profil Balita - ${balita.namaLengkap}</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1f2937; max-width: 800px; margin: 0 auto; }
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
          th { background: #ecfdf5; color: #065f46; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; }
          td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
          td.warning { color: #d97706; font-weight: 600; }
          .status-normal { color: #059669; font-weight: 600; }
          .status-warning { color: #d97706; font-weight: 600; }
          .footer { margin-top: 32px; display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; }
          .signature { text-align: center; margin-top: 40px; }
          .signature p { margin: 0; font-size: 12px; }
          .signature .name { margin-top: 60px; font-weight: 600; border-top: 1px solid #000; padding-top: 4px; display: inline-block; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>KARTU MENUJU SEHAT (KMS) — POSYANDU</h1>
          <p>Posyandu Melati RW 06</p>
          <p>Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        <div class="section">
          <h2>Data Balita</h2>
          <div class="info-grid">
            <div class="info-item"><span class="label">Nama Lengkap</span><span class="value">${balita.namaLengkap}</span></div>
            <div class="info-item"><span class="label">NIK</span><span class="value">${balita.nik}</span></div>
            <div class="info-item"><span class="label">Tanggal Lahir</span><span class="value">${formatTanggalID(balita.tanggalLahir)}</span></div>
            <div class="info-item"><span class="label">Usia</span><span class="value">${balita.usiaBulan} bulan</span></div>
            <div class="info-item"><span class="label">Jenis Kelamin</span><span class="value">${balita.jenisKelamin}</span></div>
            <div class="info-item"><span class="label">Nama Ibu</span><span class="value">${balita.namaIbu}</span></div>
            <div class="info-item"><span class="label">Berat Lahir</span><span class="value">${balita.beratLahirKg} kg</span></div>
            <div class="info-item"><span class="label">Panjang Lahir</span><span class="value">${balita.panjangLahirCm} cm</span></div>
            <div class="info-item"><span class="label">Alamat</span><span class="value">${balita.alamat}</span></div>
            <div class="info-item"><span class="label">Riwayat Penyakit</span><span class="value">${balita.riwayatPenyakit}</span></div>
          </div>
        </div>

        <div class="section">
          <h2>Riwayat Pengukuran & Status Gizi</h2>
          <table>
            <thead><tr><th>Tanggal</th><th>Usia</th><th>BB</th><th>TB</th><th>Z BB/U</th><th>Z TB/U</th><th>Z BB/TB</th><th>Status</th></tr></thead>
            <tbody>${pengukuranRows || '<tr><td colspan="8" style="text-align:center;color:#6b7280;">Belum ada pengukuran</td></tr>'}</tbody>
          </table>
        </div>

        ${latest ? `
        <div class="section">
          <h2>Status Gizi Terkini</h2>
          <div class="info-grid">
            <div class="info-item"><span class="label">Tanggal Pengukuran Terakhir</span><span class="value">${formatTanggalID(latest.tanggalPengukuran)}</span></div>
            <div class="info-item"><span class="label">Berat Badan</span><span class="value">${latest.beratBadanKg} kg</span></div>
            <div class="info-item"><span class="label">Tinggi Badan</span><span class="value">${latest.tinggiBadanCm} cm</span></div>
            <div class="info-item"><span class="label">Status Gizi</span><span class="value status-${latest.statusGizi === 'Normal' ? 'normal' : 'warning'}">${latest.statusGizi}</span></div>
          </div>
        </div>` : ''}

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
    toast.success('Profil siap dicetak', { description: 'Jendela print telah terbuka' });
  };

  return (
    <div className="space-y-5">
      {/* Back button + title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setView('balita')} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">{balita.namaLengkap}</h2>
            <p className="text-sm text-muted-foreground">
              {balita.jenisKelamin} · {balita.usiaBulan} bulan · NIK: {balita.nik}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCetakProfil}>
            <Printer className="mr-2 h-4 w-4" /> Cetak Profil
          </Button>
          <Button onClick={() => setPengukuranModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" /> Input Pengukuran
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: Biodata */}
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white ${balita.jenisKelamin === 'Laki-laki' ? 'bg-gradient-to-br from-sky-400 to-blue-500' : 'bg-gradient-to-br from-pink-400 to-rose-500'}`}>
                {balita.namaLengkap.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{balita.namaLengkap}</h3>
                <p className="text-xs text-muted-foreground">Lahir {formatTanggalID(balita.tanggalLahir)}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2.5 text-sm">
              <InfoRow icon={User} label="Nama Ibu" value={balita.namaIbu} />
              <InfoRow icon={Weight} label="Berat Lahir" value={`${balita.beratLahirKg} kg`} />
              <InfoRow icon={Ruler} label="Panjang Lahir" value={`${balita.panjangLahirCm} cm`} />
              <InfoRow icon={MapPin} label="Alamat" value={balita.alamat} />
              <InfoRow icon={Heart} label="Riwayat Penyakit" value={balita.riwayatPenyakit} />
            </div>
          </Card>

          {/* Latest measurement summary */}
          {latest && (
            <Card className="p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Activity className="h-4 w-4 text-emerald-600" /> Pengukuran Terakhir
              </h3>
              <p className="mb-3 text-xs text-muted-foreground">{formatTanggalPanjangID(latest.tanggalPengukuran)}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Berat Badan</p>
                  <p className="mt-1 text-xl font-bold text-foreground">{latest.beratBadanKg}<span className="text-sm font-normal text-muted-foreground"> kg</span></p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Tinggi Badan</p>
                  <p className="mt-1 text-xl font-bold text-foreground">{latest.tinggiBadanCm}<span className="text-sm font-normal text-muted-foreground"> cm</span></p>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  { label: 'BB/U', z: latest.zScoreBBU, ind: 'BBU' as const },
                  { label: 'TB/U', z: latest.zScoreTBU, ind: 'TBU' as const },
                  { label: 'BB/TB', z: latest.zScoreBBTB, ind: 'BBTB' as const },
                ].map((item) => {
                  const status = getStatusGizi(item.z, item.ind);
                  return (
                    <div key={item.label} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-muted-foreground">{item.label}</span>
                        <span className="font-mono font-semibold text-foreground">
                          {item.z > 0 ? '+' : ''}{item.z.toFixed(2)}
                        </span>
                      </div>
                      <GiziStatusBadge status={status.status} />
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Growth Trend Indicator */}
          {pengukuran.length >= 2 && latest && pengukuran[1] && (
            <GrowthTrendIndicator latest={latest} previous={pengukuran[1]} />
          )}
        </div>

        {/* Right: Chart + History */}
        <div className="space-y-5 lg:col-span-2">
          {/* Growth Chart */}
          <Card className="p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <TrendingUp className="h-4 w-4 text-emerald-600" /> Grafik Pertumbuhan Z-Score
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Berdasarkan standar WHO (LMS)</p>
              </div>
              <select
                value={indicator}
                onChange={(e) => setIndicator(e.target.value as IndikatorZScore)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {INDICATOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {chartData.length < 2 ? (
              <EmptyState
                icon={TrendingUp}
                title="Belum cukup data"
                description="Minimal 2 pengukuran diperlukan untuk menampilkan grafik. Input pengukuran baru untuk melihat tren."
                className="py-8"
              />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    domain={[-4, 4]}
                    ticks={[-3, -2, -1, 0, 1, 2, 3]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      fontSize: '12px',
                      background: 'hsl(var(--popover))',
                    }}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label={{ value: 'Median', fontSize: 10, fill: 'hsl(var(--muted-foreground))', position: 'right' }} />
                  <ReferenceLine y={-2} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '-2 SD', fontSize: 10, fill: '#f59e0b', position: 'right' }} />
                  <ReferenceLine y={2} stroke="#f59e0b" strokeDasharray="3 3" />
                  <ReferenceLine y={-3} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '-3 SD', fontSize: 10, fill: '#ef4444', position: 'right' }} />
                  <Line
                    type="monotone"
                    dataKey={indConfig.dataKey}
                    stroke={indConfig.color}
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: indConfig.color, strokeWidth: 2, stroke: '#fff' }}
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
                  <Activity className="h-4 w-4 text-emerald-600" /> Posisi pada Kurva WHO
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Lokasi pengukuran terakhir relatif terhadap garis SD standar WHO
                </p>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'BB/U (Berat Badan / Umur)', z: latest.zScoreBBU, value: `${latest.beratBadanKg} kg`, ind: 'BBU' as const },
                  { label: 'TB/U (Tinggi Badan / Umur)', z: latest.zScoreTBU, value: `${latest.tinggiBadanCm} cm`, ind: 'TBU' as const },
                  { label: 'BB/TB (Berat Badan / Tinggi)', z: latest.zScoreBBTB, value: `${latest.beratBadanKg} kg / ${latest.tinggiBadanCm} cm`, ind: 'BBTB' as const },
                ].map((item) => {
                  const status = getStatusGizi(item.z, item.ind);
                  // Position on a -4 to +4 scale
                  const position = Math.max(-4, Math.min(4, item.z));
                  const leftPercent = ((position + 4) / 8) * 100;
                  return (
                    <div key={item.label}>
                      <div className="mb-1 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-foreground">{item.label}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{item.value}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-foreground">
                          Z = {item.z > 0 ? '+' : ''}{item.z.toFixed(2)}
                        </span>
                      </div>
                      {/* Growth curve scale */}
                      <div className="relative h-10 rounded-lg bg-gradient-to-r from-red-100 via-amber-50 to-emerald-100 dark:from-red-500/10 dark:via-amber-500/5 dark:to-emerald-500/10">
                        {/* SD lines */}
                        {[-3, -2, -1, 0, 1, 2, 3].map((sd) => {
                          const sdLeft = ((sd + 4) / 8) * 100;
                          return (
                            <div
                              key={sd}
                              className={`absolute top-0 h-full w-px ${sd === 0 ? 'bg-foreground/40' : 'bg-foreground/15'}`}
                              style={{ left: `${sdLeft}%` }}
                            >
                              <span className="absolute -top-0.5 -translate-x-1/2 text-[8px] font-medium text-muted-foreground">
                                {sd > 0 ? `+${sd}` : sd}
                              </span>
                            </div>
                          );
                        })}
                        {/* Child's position marker */}
                        <div
                          className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                          style={{ left: `${leftPercent}%` }}
                        >
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-lg ${
                            status.severity === 0 ? 'bg-emerald-500' :
                            status.severity === 1 ? 'bg-sky-500' :
                            status.severity === 2 ? 'bg-amber-500' : 'bg-red-500'
                          }`}>
                            <span className="text-[9px] font-bold text-white">{item.z > 0 ? '↑' : '↓'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>← Stunting/Wasting</span>
                        <span>Normal (−2 to +2 SD)</span>
                        <span>Gizi Lebih →</span>
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
                <Calendar className="h-4 w-4 text-emerald-600" /> Riwayat Pengukuran
              </h3>
            </div>
            {pengukuran.length === 0 ? (
              <EmptyState
                icon={Scale}
                title="Belum ada pengukuran"
                description="Mulai catat pengukuran pertama untuk balita ini."
                action={
                  <Button onClick={() => setPengukuranModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
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
                      <th className="px-4 py-3 font-medium">BB (kg)</th>
                      <th className="px-4 py-3 font-medium">TB (cm)</th>
                      <th className="px-4 py-3 font-medium">Z-Score</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pengukuran.map((p) => {
                      const minZ = Math.min(p.zScoreBBU, p.zScoreTBU, p.zScoreBBTB);
                      return (
                        <tr key={p.id} className="transition-colors hover:bg-muted/40">
                          <td className="px-4 py-3 text-muted-foreground">{formatTanggalID(p.tanggalPengukuran)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{p.usiaBulan} bln</td>
                          <td className="px-4 py-3 font-medium text-foreground">{p.beratBadanKg}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{p.tinggiBadanCm}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-0.5 text-xs">
                              <span className="font-mono text-muted-foreground">BB/U: <span className="font-semibold text-foreground">{p.zScoreBBU > 0 ? '+' : ''}{p.zScoreBBU.toFixed(2)}</span></span>
                              <span className="font-mono text-muted-foreground">TB/U: <span className="font-semibold text-foreground">{p.zScoreTBU > 0 ? '+' : ''}{p.zScoreTBU.toFixed(2)}</span></span>
                              <span className="font-mono text-muted-foreground">BB/TB: <span className="font-semibold text-foreground">{p.zScoreBBTB > 0 ? '+' : ''}{p.zScoreBBTB.toFixed(2)}</span></span>
                            </div>
                          </td>
                          <td className="px-4 py-3"><GiziStatusBadge status={p.statusGizi} /></td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setDeleteTarget(p.id)}
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {pengukuranModalOpen && (
        <PengukuranFormModal open={pengukuranModalOpen} onOpenChange={setPengukuranModalOpen} balita={balita} />
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

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

// --- Growth Trend Indicator ---
function GrowthTrendIndicator({
  latest,
  previous,
}: {
  latest: PengukuranBalita;
  previous: PengukuranBalita;
}) {
  const indicators = [
    { label: 'Berat Badan', latest: latest.beratBadanKg, prev: previous.beratBadanKg, unit: 'kg', z: latest.zScoreBBU, prevZ: previous.zScoreBBU },
    { label: 'Tinggi Badan', latest: latest.tinggiBadanCm, prev: previous.tinggiBadanCm, unit: 'cm', z: latest.zScoreTBU, prevZ: previous.zScoreTBU },
  ];

  const overallTrend = indicators.every((i) => i.latest > i.prev) ? 'improving'
    : indicators.every((i) => i.latest < i.prev) ? 'declining'
    : 'stable';

  const zTrend = indicators.every((i) => i.z > i.prevZ) ? 'improving'
    : indicators.every((i) => i.z < i.prevZ) ? 'declining'
    : 'stable';

  const trendConfig = {
    improving: { label: 'Membaik', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' },
    declining: { label: 'Menurun', icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/20' },
    stable: { label: 'Stabil', icon: Minus, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-500/10', border: 'border-sky-200 dark:border-sky-500/20' },
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
        Perbandingan dengan pengukuran sebelumnya ({formatTanggalID(previous.tanggalPengukuran)})
      </p>

      {/* Overall trend badges */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className={`rounded-lg border ${growthConfig.border} ${growthConfig.bg} p-3`}>
          <div className="flex items-center gap-2">
            <GrowthIcon className={`h-4 w-4 ${growthConfig.color}`} />
            <div>
              <p className="text-[10px] text-muted-foreground">Tren Ukuran Tubuh</p>
              <p className={`text-sm font-bold ${growthConfig.color}`}>{growthConfig.label}</p>
            </div>
          </div>
        </div>
        <div className={`rounded-lg border ${zConfig.border} ${zConfig.bg} p-3`}>
          <div className="flex items-center gap-2">
            <ZIcon className={`h-4 w-4 ${zConfig.color}`} />
            <div>
              <p className="text-[10px] text-muted-foreground">Tren Z-Score</p>
              <p className={`text-sm font-bold ${zConfig.color}`}>{zConfig.label}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed comparison */}
      <div className="space-y-2">
        {indicators.map((ind) => {
          const diff = ind.latest - ind.prev;
          const diffPercent = ind.prev > 0 ? ((diff / ind.prev) * 100).toFixed(1) : '0';
          const isUp = diff > 0;
          const zDiff = ind.z - ind.prevZ;
          return (
            <div key={ind.label} className="rounded-lg bg-muted/30 p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{ind.label}</span>
                <span className="text-xs text-muted-foreground">vs {ind.prev} {ind.unit}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-foreground">{ind.latest} {ind.unit}</span>
                  <span className={`flex items-center gap-0.5 text-xs font-semibold ${isUp ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {isUp ? <TrendingUp className="h-3 w-3" /> : diff < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {isUp ? '+' : ''}{diff.toFixed(1)} {ind.unit} ({isUp ? '+' : ''}{diffPercent}%)
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground">Z: {ind.prevZ > 0 ? '+' : ''}{ind.prevZ.toFixed(2)}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-semibold text-foreground">{ind.z > 0 ? '+' : ''}{ind.z.toFixed(2)}</span>
                  <span className={`ml-1 font-semibold ${zDiff > 0 ? 'text-emerald-600' : zDiff < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                    ({zDiff > 0 ? '+' : ''}{zDiff.toFixed(2)})
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
