'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { StatCard } from '@/components/shared/stat-card';
import { SearchBar, EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { formatTanggalID } from '@/lib/data/mock-data';
import { Utensils, Plus, Trash2, CheckCircle2, Clock, AlertCircle, TrendingUp, Activity, Scale, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import type { JenisPMT, PMTRecord, StatusPMT } from '@/lib/data/types';

export function PMTView() {
  const { pmtList, balitaList, addPMT, updatePMT, deletePMT } = useStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PMTRecord | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return pmtList
      .filter((p) => {
        if (q && !p.namaBalita.toLowerCase().includes(q)) return false;
        if (filterStatus !== 'all' && p.status !== filterStatus) return false;
        return true;
      })
      .sort((a, b) => new Date(b.tanggalMulai).getTime() - new Date(a.tanggalMulai).getTime());
  }, [pmtList, search, filterStatus]);

  const stats = useMemo(() => {
    const aktif = pmtList.filter((p) => p.status === 'Aktif').length;
    const selesai = pmtList.filter((p) => p.status === 'Selesai').length;
    const totalBeratNaik = pmtList
      .filter((p) => p.beratAkhirKg && p.beratAwalKg)
      .reduce((sum, p) => sum + (p.beratAkhirKg! - p.beratAwalKg), 0);
    const avgBeratNaik = pmtList.filter((p) => p.beratAkhirKg).length > 0
      ? totalBeratNaik / pmtList.filter((p) => p.beratAkhirKg).length
      : 0;
    return { aktif, selesai, avgBeratNaik, total: pmtList.length };
  }, [pmtList]);

  const handleComplete = (p: PMTRecord) => {
    const beratAkhir = prompt(`Masukkan berat badan akhir ${p.namaBalita} (kg):`, String(p.beratAwalKg + 0.5));
    if (beratAkhir && !isNaN(parseFloat(beratAkhir))) {
      // FIX: Paksa p.id menjadi Number agar TypeScript tidak rewel
      updatePMT(Number(p.id), {
        status: 'Selesai',
        beratAkhirKg: parseFloat(beratAkhir),
        tanggalSelesai: new Date().toISOString().slice(0, 10),
      });
      toast.success('Program PMT diselesaikan', {
        description: `${p.namaBalita}: ${p.beratAwalKg}kg → ${beratAkhir}kg`,
      });
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      // FIX: Paksa deleteTarget.id menjadi Number
      deletePMT(Number(deleteTarget.id));
      toast.success('Record PMT dihapus');
      setDeleteTarget(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Balita', 'Jenis PMT', 'Alasan', 'Tgl Mulai', 'Tgl Selesai', 'Jumlah Hari', 'Berat Awal (kg)', 'Berat Akhir (kg)', 'Kenaikan (kg)', 'Status', 'Petugas', 'Catatan'];
    const rows = filtered.map((p) => [
      p.namaBalita, p.jenisPMT, p.alasan, p.tanggalMulai, p.tanggalSelesai || '-', p.jumlahHari,
      p.beratAwalKg, p.beratAkhirKg || '-', p.beratAkhirKg ? (p.beratAkhirKg - p.beratAwalKg).toFixed(1) : '-',
      p.status, p.petugas, p.catatan,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_PMT_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Export CSV berhasil', { description: `${filtered.length} record PMT` });
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Activity} label="Program Aktif" value={stats.aktif} trendLabel="sedang berlangsung" iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-500/10" />
        <StatCard icon={CheckCircle2} label="Program Selesai" value={stats.selesai} trendLabel="total" iconColor="text-sky-600" iconBg="bg-sky-50 dark:bg-sky-500/10" />
        <StatCard icon={TrendingUp} label="Rata-rata Kenaikan BB" value={stats.avgBeratNaik.toFixed(1)} unit="kg" trendLabel="per program" iconColor="text-violet-600" iconBg="bg-violet-50 dark:bg-violet-500/10" />
        <StatCard icon={Utensils} label="Total Program" value={stats.total} trendLabel="record" iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-500/10" />
      </div>

      {/* Info banner - FASE 2: Terminologi dihaluskan */}
      <Card className="border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/15">
            <Utensils className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-foreground">Program Pemberian Makanan Tambahan (PMT)</p>
            <p className="mt-0.5 text-muted-foreground">
              PMT diberikan kepada balita dengan status <strong>Pendek</strong>, <strong>Gizi Buruk</strong>, atau <strong>BB Kurang</strong> untuk meningkatkan status gizi. Program biasanya berlangsung 30-60 hari dengan monitoring berat badan berkala.
            </p>
          </div>
        </div>
      </Card>

      {/* Records table */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <SearchBar value={search} onChange={setSearch} placeholder="Cari nama balita..." className="flex-1 sm:max-w-xs" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Aktif">Aktif</SelectItem>
                <SelectItem value="Selesai">Selesai</SelectItem>
                <SelectItem value="Dihentikan">Dihentikan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filtered.length === 0}>
              <FileDown className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button onClick={() => setModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Tambah Program PMT
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Utensils}
            title="Belum ada program PMT"
            description={search || filterStatus !== 'all' ? 'Tidak ada hasil yang cocok.' : 'Tambahkan program PMT pertama.'}
            action={!search && filterStatus === 'all' ? (
              <Button onClick={() => setModalOpen(true)} className="bg-amber-600 hover:bg-amber-700">
                <Plus className="mr-2 h-4 w-4" /> Tambah Program PMT
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-zebra w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Balita</th>
                  <th className="px-4 py-3 font-medium">Jenis PMT</th>
                  <th className="px-4 py-3 font-medium">Alasan</th>
                  <th className="px-4 py-3 font-medium">Periode</th>
                  <th className="px-4 py-3 font-medium">Berat (Awal→Akhir)</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const beratNaik = p.beratAkhirKg ? p.beratAkhirKg - p.beratAwalKg : null;
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-white">
                            {p.namaBalita.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{p.namaBalita}</p>
                            <p className="text-xs text-muted-foreground">{p.petugas}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.jenisPMT}</td>
                      <td className="px-4 py-3">
                        {/* FASE 2: Ganti pewarnaan badge alasan PMT */}
                        <span className={`inline-flex h-6 items-center rounded-md px-2 text-xs font-medium ${
                          p.alasan === 'Pendek' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' :
                          p.alasan === 'Gizi Buruk' ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' :
                          'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400'
                        }`}>
                          {p.alasan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <p>{formatTanggalID(p.tanggalMulai)}</p>
                        {p.tanggalSelesai && <p className="text-xs">→ {formatTanggalID(p.tanggalSelesai)}</p>}
                        <p className="text-xs text-muted-foreground/70">{p.jumlahHari} hari</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-muted-foreground">{p.beratAwalKg}kg</span>
                          {p.beratAkhirKg ? (
                            <>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-mono text-xs font-semibold text-foreground">{p.beratAkhirKg}kg</span>
                              {beratNaik !== null && beratNaik > 0 && (
                                <span className="rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                                  +{beratNaik.toFixed(1)}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">→ ongoing</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3"><PMTStatusBadge status={p.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {p.status === 'Aktif' && (
                            <button
                              onClick={() => handleComplete(p)}
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-emerald-600"
                              title="Selesaikan Program"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <PMTFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        balitaList={balitaList}
        onSave={(data) => {
          addPMT(data);
          toast.success('Program PMT ditambahkan', { description: `${data.namaBalita} — ${data.jenisPMT}` });
          setModalOpen(false);
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Hapus Record PMT"
        description={`Apakah Anda yakin ingin menghapus program PMT untuk "${deleteTarget?.namaBalita}"?`}
        confirmLabel="Hapus"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}

function PMTStatusBadge({ status }: { status: StatusPMT }) {
  const config = {
    'Aktif': { variant: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400', icon: Clock },
    'Selesai': { variant: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400', icon: CheckCircle2 },
    'Dihentikan': { variant: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400', icon: AlertCircle },
  }[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.variant}`}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

// --- PMT Form Modal ---
function PMTFormModal({
  open,
  onOpenChange,
  balitaList,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balitaList: { id: number | string; namaLengkap: string; usiaBulan: number; jenisKelamin: string | null }[];
  onSave: (data: Omit<PMTRecord, 'id'>) => void;
}) {
  const [balitaId, setBalitaId] = useState<string>('');
  const [jenisPMT, setJenisPMT] = useState<JenisPMT>('Biscuit PMT');
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().slice(0, 10));
  const [jumlahHari, setJumlahHari] = useState('30');
  const [beratAwal, setBeratAwal] = useState('');
  
  // FASE 2: Default dropdown reason
  const [alasan, setAlasan] = useState<PMTRecord['alasan']>('Pendek'); 
  
  const [petugas, setPetugas] = useState('Bidan Rina');
  const [catatan, setCatatan] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!balitaId) {
      toast.error('Pilih balita terlebih dahulu');
      return;
    }
    const id = parseInt(balitaId);
    const namaBalita = balitaList.find((b) => String(b.id) === String(id))?.namaLengkap ?? '';
    onSave({
      balitaId: id,
      namaBalita,
      jenisPMT,
      tanggalMulai,
      jumlahHari: parseInt(jumlahHari) || 30,
      beratAwalKg: parseFloat(beratAwal) || 0,
      alasan,
      status: 'Aktif',
      petugas,
      catatan,
    });
    // Reset
    setBalitaId(''); setBeratAwal(''); setCatatan('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-amber-600" />
            Tambah Program PMT
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pmt-balita">Pilih Balita</Label>
            <Select value={balitaId} onValueChange={setBalitaId}>
              <SelectTrigger id="pmt-balita"><SelectValue placeholder="Pilih balita penerima PMT" /></SelectTrigger>
              <SelectContent>
                {balitaList.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.namaLengkap} ({b.usiaBulan} bln, {b.jenisKelamin === 'Laki-laki' ? 'L' : 'P'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pmt-jenis">Jenis PMT</Label>
              <Select value={jenisPMT} onValueChange={(v) => setJenisPMT(v as JenisPMT)}>
                <SelectTrigger id="pmt-jenis"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Biscuit PMT">Biscuit PMT</SelectItem>
                  <SelectItem value="Berbagai Makanan Lokal">Berbagai Makanan Lokal</SelectItem>
                  <SelectItem value="Suplementasi Gizi">Suplementasi Gizi</SelectItem>
                  <SelectItem value="MP-ASI">MP-ASI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pmt-alasan">Alasan</Label>
              <Select value={alasan} onValueChange={(v) => setAlasan(v as PMTRecord['alasan'])}>
                <SelectTrigger id="pmt-alasan"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {/* FASE 2: Pembaruan Opsi Dropdown */}
                  <SelectItem value="Pendek">Pendek</SelectItem>
                  <SelectItem value="Gizi Buruk">Gizi Buruk</SelectItem>
                  <SelectItem value="Gizi Kurang">Gizi Kurang</SelectItem>
                  <SelectItem value="BB Kurang">BB Kurang</SelectItem>
                  <SelectItem value="Risiko KEK">Risiko KEK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pmt-tanggal">Tanggal Mulai</Label>
              <Input id="pmt-tanggal" type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pmt-hari">Jumlah Hari</Label>
              <Input id="pmt-hari" type="number" min={7} max={120} value={jumlahHari} onChange={(e) => setJumlahHari(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pmt-berat">Berat Awal (kg)</Label>
              <Input id="pmt-berat" type="number" step="0.1" value={beratAwal} onChange={(e) => setBeratAwal(e.target.value)} placeholder="8.0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pmt-petugas">Petugas</Label>
              <Input id="pmt-petugas" value={petugas} onChange={(e) => setPetugas(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pmt-catatan">Catatan</Label>
            <Textarea id="pmt-catatan" rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Misal: 2x sehari, monitor BB mingguan" />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700">Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}