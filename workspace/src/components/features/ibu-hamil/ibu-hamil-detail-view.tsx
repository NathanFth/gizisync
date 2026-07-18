'use client';

import { useState, useMemo } from 'react';
import { useStore, useKunjunganANCByIbu } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { IbuHamilStatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { formatTanggalID, formatTanggalPanjangID, ANC_LABELS, AMBANG_LILA_KEK } from '@/lib/data/mock-data';
import { ArrowLeft, Plus, Trash2, HeartPulse, Calendar, Ruler, Weight, Activity, AlertTriangle, Baby, Clock, Stethoscope, TrendingUp, Droplet, Printer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { toast } from 'sonner';
import type { JenisPemeriksaanANC, KunjunganANC } from '@/lib/data/types';

export function IbuHamilDetailView() {
  const { ibuHamilList, selectedIbuHamilId, setView, deleteKunjunganANC, kunjunganANCList } = useStore();
  const ancVisits = useKunjunganANCByIbu(selectedIbuHamilId);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const ibu = useMemo(
    () => ibuHamilList.find((i) => i.id === selectedIbuHamilId),
    [ibuHamilList, selectedIbuHamilId],
  );

  if (!ibu) {
    return (
      <EmptyState
        icon={HeartPulse}
        title="Data ibu hamil tidak ditemukan"
        description="Data yang Anda cari mungkin telah dihapus."
        action={<Button onClick={() => setView('ibu-hamil')}>Kembali ke Daftar</Button>}
      />
    );
  }

  // Calculate HTP countdown
  const htpDate = new Date(ibu.htp);
  const now = new Date();
  const daysToHtp = Math.ceil((htpDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isHtpPassed = daysToHtp < 0;

  // Calculate trimester
  const trimester = ibu.usiaKehamilanMinggu < 13 ? 1 : ibu.usiaKehamilanMinggu < 27 ? 2 : 3;

  // Chart data: weight progression
  const weightChartData = [...ancVisits]
    .sort((a, b) => new Date(a.tanggalKunjungan).getTime() - new Date(b.tanggalKunjungan).getTime())
    .map((v) => ({
      label: `${v.usiaKehamilanMinggu}m`,
      berat: v.beratBadanKg,
      lila: v.lilaCm,
    }));

  // ANC completeness (K1-K4)
  const ancTypes = ['K1', 'K2', 'K3', 'K4'] as const;
  const ancCompleted = ancTypes.filter((t) => ancVisits.some((v) => v.jenis === t));

  const confirmDelete = () => {
    if (deleteTarget !== null) {
      deleteKunjunganANC(deleteTarget);
      toast.success('Kunjungan ANC dihapus');
      setDeleteTarget(null);
    }
  };

  const handleCetakKartu = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up diblokir', { description: 'Izinkan pop-up untuk mencetak' });
      return;
    }
    const ancRows = ancVisits.map((v) => `
      <tr>
        <td>${formatTanggalID(v.tanggalKunjungan)}</td>
        <td><strong>${v.jenis}</strong></td>
        <td>${v.usiaKehamilanMinggu} mgg</td>
        <td>${v.beratBadanKg} kg</td>
        <td>${v.tekananDarah}</td>
        <td class="${v.lilaCm < AMBANG_LILA_KEK ? 'warning' : ''}">${v.lilaCm} cm</td>
        <td>${v.tinggiFundusCm || '-'}</td>
        <td>${v.denyutJantungJanin || '-'}</td>
        <td>${v.catatan || '-'}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Kartu Ibu Hamil - ${ibu.namaLengkap}</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1f2937; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 3px solid #e11d48; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { color: #e11d48; margin: 0 0 4px; font-size: 20px; }
          .header p { color: #6b7280; margin: 2px 0; font-size: 13px; }
          .section { margin-bottom: 20px; }
          .section h2 { color: #e11d48; font-size: 14px; margin: 0 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
          .info-item { font-size: 13px; }
          .info-item .label { color: #6b7280; display: block; font-size: 11px; }
          .info-item .value { font-weight: 600; }
          .status-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
          .status-normal { background: #d1fae5; color: #065f46; }
          .status-kek { background: #fee2e2; color: #991b1b; }
          .warning { color: #d97706; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { background: #fff1f2; color: #9f1239; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; }
          td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
          .summary { display: flex; gap: 16px; margin: 16px 0; }
          .summary-card { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; }
          .summary-card .label { font-size: 10px; color: #6b7280; text-transform: uppercase; }
          .summary-card .value { font-size: 20px; font-weight: 700; color: #1f2937; }
          .signature { text-align: center; margin-top: 40px; }
          .signature p { margin: 0; font-size: 12px; }
          .signature .name { margin-top: 60px; font-weight: 600; border-top: 1px solid #000; padding-top: 4px; display: inline-block; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>KARTU IBU HAMIL (KIH) — POSYANDU</h1>
          <p>Posyandu Melati RW 06</p>
          <p>Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        <div class="section">
          <h2>Data Ibu Hamil</h2>
          <div class="info-grid">
            <div class="info-item"><span class="label">Nama Lengkap</span><span class="value">${ibu.namaLengkap}</span></div>
            <div class="info-item"><span class="label">NIK</span><span class="value">${ibu.nik}</span></div>
            <div class="info-item"><span class="label">Usia Kehamilan</span><span class="value">${ibu.usiaKehamilanMinggu} minggu (Trimester ${trimester})</span></div>
            <div class="info-item"><span class="label">HTP</span><span class="value">${formatTanggalPanjangID(ibu.htp)}</span></div>
            <div class="info-item"><span class="label">Berat Badan</span><span class="value">${ibu.beratBadanKg || '-'} kg</span></div>
            <div class="info-item"><span class="label">Tekanan Darah</span><span class="value">${ibu.tekananDarah || '-'}</span></div>
            <div class="info-item"><span class="label">LILA Terakhir</span><span class="value">${ibu.lilaTerakCm} cm ${ibu.lilaTerakCm < AMBANG_LILA_KEK ? '(Risiko KEK)' : ''}</span></div>
            <div class="info-item"><span class="label">Status</span><span class="value"><span class="status-badge ${ibu.status === 'Normal' ? 'status-normal' : 'status-kek'}">${ibu.status}</span></span></div>
          </div>
        </div>

        <div class="summary">
          <div class="summary-card"><div class="label">ANC K1-K4</div><div class="value">${ancCompleted.length}/4</div></div>
          <div class="summary-card"><div class="label">Total Kunjungan</div><div class="value">${ancVisits.length}</div></div>
          <div class="summary-card"><div class="label">Hari ke HTP</div><div class="value">${daysToHtp > 0 ? daysToHtp : 'Lewat'}</div></div>
        </div>

        <div class="section">
          <h2>Riwayat Kunjungan ANC</h2>
          <table>
            <thead><tr><th>Tanggal</th><th>Jenis</th><th>Usia</th><th>BB</th><th>TD</th><th>LILA</th><th>TF</th><th>DJJ</th><th>Catatan</th></tr></thead>
            <tbody>${ancRows || '<tr><td colspan="9" style="text-align:center;color:#6b7280;">Belum ada kunjungan</td></tr>'}</tbody>
          </table>
        </div>

        <div class="signature">
          <p>Mengetahui,</p>
          <p>Bidan/Kader Posyandu</p>
          <p class="name">${useStore.getState().pengaturan.profil.namaLengkap}</p>
        </div>

        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    toast.success('Kartu Ibu Hamil siap dicetak');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setView('ibu-hamil')} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">{ibu.namaLengkap}</h2>
            <p className="text-sm text-muted-foreground">
              {ibu.usiaKehamilanMinggu} minggu · Trimester {trimester} · NIK: {ibu.nik}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCetakKartu}>
            <Printer className="mr-2 h-4 w-4" /> Cetak Kartu
          </Button>
          <Button onClick={() => setModalOpen(true)} className="bg-rose-600 hover:bg-rose-700">
            <Plus className="mr-2 h-4 w-4" /> Catat Kunjungan ANC
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: Profile + Status */}
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-xl font-bold text-white">
                {ibu.namaLengkap.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground">{ibu.namaLengkap}</h3>
                <div className="mt-0.5"><IbuHamilStatusBadge status={ibu.status} /></div>
              </div>
            </div>
            <div className="mt-4 space-y-2.5 text-sm">
              <InfoRow icon={Clock} label="Usia Kehamilan" value={`${ibu.usiaKehamilanMinggu} minggu (Trimester ${trimester})`} />
              <InfoRow icon={Calendar} label="HTP" value={formatTanggalPanjangID(ibu.htp)} />
              <InfoRow icon={Weight} label="Berat Badan" value={ibu.beratBadanKg ? `${ibu.beratBadanKg} kg` : '-'} />
              <InfoRow icon={Activity} label="Tekanan Darah" value={ibu.tekananDarah || '-'} />
              <InfoRow icon={Ruler} label="LILA Terakhir" value={`${ibu.lilaTerakCm} cm`} />
              {ibu.lilaTerakCm < AMBANG_LILA_KEK && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 p-2.5 text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-xs font-medium">Risiko KEK (LILA &lt; {AMBANG_LILA_KEK} cm)</p>
                </div>
              )}
            </div>
          </Card>

          {/* HTP Countdown */}
          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Baby className="h-4 w-4 text-rose-600" /> Hari Perkiraan Lahir
            </h3>
            <div className="text-center">
              {isHtpPassed ? (
                <>
                  <p className="text-3xl font-bold text-foreground">{Math.abs(daysToHtp)}</p>
                  <p className="text-xs text-muted-foreground">hari setelah HTP</p>
                  <p className="mt-2 text-xs font-medium text-amber-600">Perlu tindak lanjut</p>
                </>
              ) : (
                <>
                  <p className="text-4xl font-bold text-rose-600">{daysToHtp}</p>
                  <p className="text-xs text-muted-foreground">hari lagi sampai persalinan</p>
                  <p className="mt-2 text-xs text-muted-foreground">{formatTanggalID(ibu.htp)}</p>
                </>
              )}
            </div>
            {/* Progress bar of pregnancy */}
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                <span>0 minggu</span><span>40 minggu</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-400 to-pink-500 transition-all"
                  style={{ width: `${Math.min(100, (ibu.usiaKehamilanMinggu / 40) * 100)}%` }}
                />
              </div>
            </div>
          </Card>

          {/* ANC Completeness */}
          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Stethoscope className="h-4 w-4 text-emerald-600" /> Kelengkapan ANC
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {ancTypes.map((t) => {
                const done = ancCompleted.includes(t);
                return (
                  <div
                    key={t}
                    className={`flex flex-col items-center rounded-lg border p-2.5 ${done ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10' : 'border-border bg-muted/30'}`}
                  >
                    <span className={`text-sm font-bold ${done ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}>{t}</span>
                    <span className={`text-[10px] ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                      {done ? '✓ Selesai' : 'Belum'}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {ancCompleted.length}/4 kunjungan wajib selesai
            </p>
          </Card>
        </div>

        {/* Right: Charts + History */}
        <div className="space-y-5 lg:col-span-2">
          {/* Weight & LILA progression chart */}
          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <TrendingUp className="h-4 w-4 text-rose-600" /> Progres Berat Badan & LILA
            </h3>
            {weightChartData.length < 2 ? (
              <EmptyState
                icon={TrendingUp}
                title="Data belum cukup"
                description="Minimal 2 kunjungan ANC diperlukan untuk menampilkan grafik."
                className="py-6"
              />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weightChartData} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} domain={[15, 35]} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px', background: 'hsl(var(--popover))' }} />
                  <ReferenceLine y={AMBANG_LILA_KEK} yAxisId="right" stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Ambang KEK', fontSize: 10, fill: '#ef4444', position: 'right' }} />
                  <Line yAxisId="left" type="monotone" dataKey="berat" name="Berat (kg)" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4, fill: '#f43f5e' }} />
                  <Line yAxisId="right" type="monotone" dataKey="lila" name="LILA (cm)" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* ANC Visit History */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Stethoscope className="h-4 w-4 text-rose-600" /> Riwayat Kunjungan ANC
              </h3>
              <Button size="sm" variant="outline" onClick={() => setModalOpen(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Tambah
              </Button>
            </div>
            {ancVisits.length === 0 ? (
              <EmptyState
                icon={Stethoscope}
                title="Belum ada kunjungan ANC"
                description="Catat kunjungan ANC pertama untuk ibu hamil ini."
                action={<Button onClick={() => setModalOpen(true)} className="bg-rose-600 hover:bg-rose-700"><Plus className="mr-2 h-4 w-4" /> Catat Kunjungan</Button>}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Tanggal</th>
                      <th className="px-4 py-3 font-medium">Jenis</th>
                      <th className="px-4 py-3 font-medium">Usia Hamil</th>
                      <th className="px-4 py-3 font-medium">BB</th>
                      <th className="px-4 py-3 font-medium">TD</th>
                      <th className="px-4 py-3 font-medium">LILA</th>
                      <th className="px-4 py-3 font-medium">TF</th>
                      <th className="px-4 py-3 font-medium">DJJ</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ancVisits.map((v) => (
                      <tr key={v.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3 text-muted-foreground">{formatTanggalID(v.tanggalKunjungan)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex h-6 items-center rounded-md bg-rose-100 px-2 text-xs font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-400">
                            {v.jenis}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{v.usiaKehamilanMinggu} mgg</td>
                        <td className="px-4 py-3 font-medium text-foreground">{v.beratBadanKg}</td>
                        <td className="px-4 py-3 text-muted-foreground">{v.tekananDarah}</td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${v.lilaCm < AMBANG_LILA_KEK ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                            {v.lilaCm}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{v.tinggiFundusCm || '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{v.denyutJantungJanin || '-'}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setDeleteTarget(v.id)}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {ancVisits.length > 0 && (
              <div className="border-t border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                <strong>Keterangan:</strong> TF = Tinggi Fundus (cm), DJJ = Denyut Jantung Janin (bpm), TD = Tekanan Darah
              </div>
            )}
          </Card>
        </div>
      </div>

      <ANCTFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        ibuHamilId={ibu.id}
        currentUsiaKehamilan={ibu.usiaKehamilanMinggu}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Hapus Kunjungan ANC"
        description="Apakah Anda yakin ingin menghapus catatan kunjungan ANC ini?"
        confirmLabel="Hapus"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
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

// --- ANC Form Modal ---
function ANCTFormModal({
  open,
  onOpenChange,
  ibuHamilId,
  currentUsiaKehamilan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ibuHamilId: number;
  currentUsiaKehamilan: number;
}) {
  const addKunjunganANC = useStore((s) => s.addKunjunganANC);
  const [jenis, setJenis] = useState<JenisPemeriksaanANC>('K1');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [usiaMinggu, setUsiaMinggu] = useState(String(currentUsiaKehamilan));
  const [berat, setBerat] = useState('');
  const [tekanan, setTekanan] = useState('');
  const [lila, setLila] = useState('');
  const [fundus, setFundus] = useState('');
  const [djj, setDjj] = useState('');
  const [catatan, setCatatan] = useState('');
  const [petugas, setPetugas] = useState('Bidan Rina');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addKunjunganANC({
      ibuHamilId,
      jenis,
      tanggalKunjungan: tanggal,
      usiaKehamilanMinggu: parseInt(usiaMinggu) || currentUsiaKehamilan,
      beratBadanKg: parseFloat(berat) || 0,
      tekananDarah: tekanan || '-',
      lilaCm: parseFloat(lila) || 0,
      tinggiFundusCm: fundus ? parseFloat(fundus) : undefined,
      denyutJantungJanin: djj ? parseInt(djj) : undefined,
      catatan,
      petugas,
    });
    toast.success('Kunjungan ANC berhasil dicatat');
    onOpenChange(false);
    // Reset
    setBerat(''); setTekanan(''); setLila(''); setFundus(''); setDjj(''); setCatatan('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-rose-600" />
            Catat Kunjungan ANC
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="anc-jenis">Jenis Kunjungan</Label>
              <Select value={jenis} onValueChange={(v) => setJenis(v as JenisPemeriksaanANC)}>
                <SelectTrigger id="anc-jenis"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ANC_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="anc-tanggal">Tanggal</Label>
              <Input id="anc-tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="anc-usia">Usia Kehamilan (minggu)</Label>
              <Input id="anc-usia" type="number" min={1} max={45} value={usiaMinggu} onChange={(e) => setUsiaMinggu(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="anc-berat">Berat Badan (kg)</Label>
              <Input id="anc-berat" type="number" step="0.1" value={berat} onChange={(e) => setBerat(e.target.value)} placeholder="60" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="anc-td">Tekanan Darah</Label>
              <Input id="anc-td" value={tekanan} onChange={(e) => setTekanan(e.target.value)} placeholder="120/80" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="anc-lila">LILA (cm)</Label>
              <Input id="anc-lila" type="number" step="0.1" value={lila} onChange={(e) => setLila(e.target.value)} placeholder="25.5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="anc-tf">Tinggi Fundus (cm)</Label>
              <Input id="anc-tf" type="number" step="0.1" value={fundus} onChange={(e) => setFundus(e.target.value)} placeholder="20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="anc-djj">DJJ (bpm)</Label>
              <Input id="anc-djj" type="number" value={djj} onChange={(e) => setDjj(e.target.value)} placeholder="140" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="anc-petugas">Petugas</Label>
            <Input id="anc-petugas" value={petugas} onChange={(e) => setPetugas(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="anc-catatan">Catatan</Label>
            <Textarea id="anc-catatan" rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Misal: kehamilan normal, diberikan PMT, dll" />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" className="bg-rose-600 hover:bg-rose-700">Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
