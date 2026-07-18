'use client';

import { useState, useMemo } from 'react';
import { useStore, useImunisasiCoverage } from '@/lib/store';
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
import { jadwalImunisasi, formatTanggalID } from '@/lib/data/mock-data';
import { Syringe, Plus, Trash2, CheckCircle2, XCircle, Clock, AlertTriangle, Search, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { JenisVaksin, StatusImunisasi } from '@/lib/data/types';

export function ImunisasiView() {
  const coverage = useImunisasiCoverage();
  const { addImunisasi, deleteImunisasi, imunisasiList, balitaList } = useStore();
  const [search, setSearch] = useState('');
  const [expandedBalitaId, setExpandedBalitaId] = useState<number | null>(null);
  const [addModalBalitaId, setAddModalBalitaId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return coverage;
    return coverage.filter((c) => c.balita.namaLengkap.toLowerCase().includes(q) || c.balita.nik.includes(q));
  }, [coverage, search]);

  // Summary stats
  const stats = useMemo(() => {
    const lengkap = coverage.filter((c) => c.status === 'Lengkap').length;
    const belumLengkap = coverage.filter((c) => c.status === 'Belum Lengkap').length;
    const avgCoverage = coverage.length > 0 ? Math.round(coverage.reduce((sum, c) => sum + c.persentase, 0) / coverage.length) : 0;
    const totalRecords = imunisasiList.length;
    return { lengkap, belumLengkap, avgCoverage, totalRecords };
  }, [coverage, imunisasiList]);

  const confirmDelete = () => {
    if (deleteTarget !== null) {
      deleteImunisasi(deleteTarget);
      toast.success('Record imunisasi dihapus');
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={ShieldCheck}
          label="Cakupan Rata-rata"
          value={stats.avgCoverage}
          unit="%"
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-500/10"
        />
        <StatCard
          icon={CheckCircle2}
          label="Imunisasi Lengkap"
          value={stats.lengkap}
          trendLabel="balita"
          iconColor="text-sky-600"
          iconBg="bg-sky-50 dark:bg-sky-500/10"
        />
        <StatCard
          icon={AlertTriangle}
          label="Belum Lengkap"
          value={stats.belumLengkap}
          trendLabel="perlu tindak lanjut"
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-500/10"
        />
        <StatCard
          icon={Syringe}
          label="Total Pemberian"
          value={stats.totalRecords}
          trendLabel="record"
          iconColor="text-violet-600"
          iconBg="bg-violet-50 dark:bg-violet-500/10"
        />
      </div>

      {/* Search bar */}
      <Card className="p-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cari balita berdasarkan nama atau NIK..."
          className="max-w-md"
        />
      </Card>

      {/* Coverage list */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Syringe}
            title="Tidak ada data imunisasi"
            description={search ? 'Tidak ada hasil yang cocok.' : 'Belum ada balita terdaftar.'}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isExpanded = expandedBalitaId === item.balita.id;
            return (
              <Card key={item.balita.id} className="overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => setExpandedBalitaId(isExpanded ? null : item.balita.id)}
                  className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/40"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.balita.jenisKelamin === 'Laki-laki' ? 'bg-gradient-to-br from-sky-400 to-blue-500' : 'bg-gradient-to-br from-pink-400 to-rose-500'} text-sm font-bold text-white`}>
                    {item.balita.namaLengkap.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{item.balita.namaLengkap}</p>
                      <StatusImunisasiBadge status={item.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.balita.usiaBulan} bulan · {item.given.length}/{item.expected.length} vaksin diberikan
                    </p>
                  </div>
                  {/* Progress bar */}
                  <div className="hidden w-32 sm:block">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{item.persentase}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.persentase === 100 ? 'bg-emerald-500' :
                          item.persentase >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${item.persentase}%` }}
                      />
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">Riwayat Imunisasi</h4>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setAddModalBalitaId(item.balita.id)}>
                        <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Vaksin
                      </Button>
                    </div>

                    {/* Vaccine schedule grid */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {jadwalImunisasi.map((jadwal) => {
                        const record = item.records.find((r) => r.jenisVaksin === jadwal.jenisVaksin);
                        const isExpected = item.expected.includes(jadwal.jenisVaksin as any);
                        const isGiven = !!record;
                        const isMissed = isExpected && !isGiven;

                        return (
                          <div
                            key={jadwal.jenisVaksin}
                            className={`flex items-start gap-2.5 rounded-lg border p-2.5 transition-colors ${
                              isGiven ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/5' :
                              isMissed ? 'border-red-200 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5' :
                              'border-border bg-background'
                            }`}
                          >
                            {isGiven ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            ) : isMissed ? (
                              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                            ) : (
                              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-semibold text-foreground">{jadwal.jenisVaksin}</p>
                                {isGiven && record && (
                                  <button
                                    onClick={() => setDeleteTarget(record.id)}
                                    className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                                    title="Hapus"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                Usia {jadwal.usiaMinimalBulan === 0 ? '0' : jadwal.usiaMinimalBulan}–{jadwal.usiaMaksimalBulan} bln
                              </p>
                              {isGiven && record ? (
                                <p className="mt-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                                  {formatTanggalID(record.tanggalPemberian)} · {record.petugas}
                                </p>
                              ) : isMissed ? (
                                <p className="mt-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
                                  Belum diberikan (terlewat)
                                </p>
                              ) : (
                                <p className="mt-0.5 text-[10px] text-muted-foreground">Menunggu jadwal</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {addModalBalitaId !== null && (
        <AddImunisasiModal
          balitaId={addModalBalitaId}
          open={true}
          onOpenChange={(v) => !v && setAddModalBalitaId(null)}
          onSave={(data) => {
            addImunisasi(data);
            toast.success('Imunisasi berhasil dicatat', { description: `${data.jenisVaksin} — ${balitaList.find(b => b.id === data.balitaId)?.namaLengkap}` });
            setAddModalBalitaId(null);
          }}
        />
      )}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Hapus Record Imunisasi"
        description="Apakah Anda yakin ingin menghapus catatan pemberian vaksin ini?"
        confirmLabel="Hapus"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}

function StatusImunisasiBadge({ status }: { status: StatusImunisasi }) {
  const config = {
    'Lengkap': { variant: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400', icon: CheckCircle2 },
    'Belum Lengkap': { variant: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400', icon: AlertTriangle },
    'Terlambat': { variant: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400', icon: XCircle },
    'Belum Dimulai': { variant: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400', icon: Clock },
  }[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.variant}`}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

// --- Add Imunisasi Modal ---
function AddImunisasiModal({
  balitaId,
  open,
  onOpenChange,
  onSave,
}: {
  balitaId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { balitaId: number; jenisVaksin: JenisVaksin; tanggalPemberian: string; usiaSaatPemberianBulan: number; petugas: string; catatan: string }) => void;
}) {
  const balita = useStore((s) => s.balitaList.find((b) => b.id === balitaId));
  const [jenisVaksin, setJenisVaksin] = useState<JenisVaksin>('BCG');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [petugas, setPetugas] = useState('Bidan Rina');
  const [catatan, setCatatan] = useState('');

  if (!balita) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tgl = new Date(tanggal);
    const lahir = new Date(balita.tanggalLahir);
    const usiaSaatPemberianBulan = Math.floor((tgl.getTime() - lahir.getTime()) / (1000 * 60 * 60 * 24 * 30.4375));
    onSave({ balitaId, jenisVaksin, tanggalPemberian: tanggal, usiaSaatPemberianBulan: Math.max(0, usiaSaatPemberianBulan), petugas, catatan });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-emerald-600" />
            Catat Pemberian Imunisasi
          </DialogTitle>
        </DialogHeader>
        <div className="mb-4 rounded-lg bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">
            Balita: <span className="font-semibold text-foreground">{balita.namaLengkap}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {balita.jenisKelamin} · {balita.usiaBulan} bulan
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="vaksin">Jenis Vaksin</Label>
            <Select value={jenisVaksin} onValueChange={(v) => setJenisVaksin(v as JenisVaksin)}>
              <SelectTrigger id="vaksin"><SelectValue /></SelectTrigger>
              <SelectContent>
                {jadwalImunisasi.map((j) => (
                  <SelectItem key={j.jenisVaksin} value={j.jenisVaksin}>
                    {j.jenisVaksin} <span className="text-xs text-muted-foreground">(usia {j.usiaMinimalBulan}–{j.usiaMaksimalBulan} bln)</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tgl">Tanggal Pemberian</Label>
            <Input id="tgl" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="petugas">Petugas</Label>
            <Input id="petugas" value={petugas} onChange={(e) => setPetugas(e.target.value)} placeholder="Nama petugas kesehatan" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="catatan">Catatan (opsional)</Label>
            <Textarea id="catatan" rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Misal: tidak ada reaksi, demam ringan, dll" />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
