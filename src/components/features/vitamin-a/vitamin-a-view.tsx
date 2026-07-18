'use client';

import { useState, useMemo } from 'react';
import { useStore, useVitaminACoverage } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { StatCard } from '@/components/shared/stat-card';
import { SearchBar, EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { formatTanggalID, NAMA_BULAN } from '@/lib/data/mock-data';
import { Pill, Plus, Trash2, CheckCircle2, XCircle, Baby, HeartPulse, Calendar, Search, Filter, Droplet } from 'lucide-react';
import { toast } from 'sonner';
import type { TargetVitaminA, VitaminARecord } from '@/lib/data/types';

const PAGE_SIZE = 8;

export function VitaminAView() {
  const { vitaminAList, balitaList, ibuHamilList, addVitaminA, deleteVitaminA } = useStore();
  const coverage = useVitaminACoverage();
  const [search, setSearch] = useState('');
  const [filterTarget, setFilterTarget] = useState<string>('all');
  const [filterPeriode, setFilterPeriode] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VitaminARecord | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return vitaminAList
      .filter((v) => {
        if (q && !v.namaPenerima.toLowerCase().includes(q)) return false;
        if (filterTarget !== 'all' && v.target !== filterTarget) return false;
        if (filterPeriode !== 'all' && v.periode !== filterPeriode) return false;
        return true;
      })
      .sort((a, b) => new Date(b.tanggalPemberian).getTime() - new Date(a.tanggalPemberian).getTime());
  }, [vitaminAList, search, filterTarget, filterPeriode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageData = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteVitaminA(deleteTarget.id);
      toast.success('Record Vitamin A dihapus');
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Droplet}
          label={`Cakupan Balita ${coverage.currentPeriod} ${coverage.currentYear}`}
          value={coverage.balitaCoverage}
          unit="%"
          trendLabel={`${coverage.balitaGiven}/${coverage.eligibleBalita} balita`}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-500/10"
        />
        <StatCard
          icon={HeartPulse}
          label="Cakupan Ibu Hamil"
          value={coverage.ibuCoverage}
          unit="%"
          trendLabel={`${coverage.ibuGiven}/${coverage.eligibleIbu} ibu`}
          iconColor="text-rose-600"
          iconBg="bg-rose-50 dark:bg-rose-500/10"
        />
        <StatCard
          icon={Baby}
          label="Balita Belum Diberikan"
          value={coverage.balitaMissed}
          trendLabel="perlu tindak lanjut"
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-500/10"
        />
        <StatCard
          icon={Pill}
          label="Total Pemberian"
          value={coverage.totalRecords}
          trendLabel="record"
          iconColor="text-violet-600"
          iconBg="bg-violet-50 dark:bg-violet-500/10"
        />
      </div>

      {/* Info banner */}
      <Card className="border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/15">
            <Droplet className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-foreground">Program Vitamin A Posyandu</p>
            <p className="mt-0.5 text-muted-foreground">
              Kapsul <strong className="text-blue-600">Biru (200.000 IU)</strong> untuk balita 6-59 bulan, diberikan setiap Februari & Agustus.
              Kapsul <strong className="text-red-600">Merah (100.000 IU)</strong> untuk ibu hamil trimester pertama.
            </p>
          </div>
        </div>
      </Card>

      {/* Records table */}
      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <SearchBar
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Cari nama penerima..."
              className="flex-1 sm:max-w-xs"
            />
            <Select value={filterTarget} onValueChange={(v) => { setFilterTarget(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Target" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Target</SelectItem>
                <SelectItem value="Balita">Balita</SelectItem>
                <SelectItem value="Ibu Hamil">Ibu Hamil</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPeriode} onValueChange={(v) => { setFilterPeriode(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Periode" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Periode</SelectItem>
                <SelectItem value="Februari">Februari</SelectItem>
                <SelectItem value="Agustus">Agustus</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setModalOpen(true)} className="bg-violet-600 hover:bg-violet-700 w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Catat Vitamin A
          </Button>
        </div>

        {pageData.length === 0 ? (
          <EmptyState
            icon={Pill}
            title="Belum ada record Vitamin A"
            description={search || filterTarget !== 'all' || filterPeriode !== 'all' ? 'Tidak ada hasil yang cocok.' : 'Catat pemberian Vitamin A pertama.'}
            action={
              !search && filterTarget === 'all' && filterPeriode === 'all' ? (
                <Button onClick={() => setModalOpen(true)} className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="mr-2 h-4 w-4" /> Catat Vitamin A
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-zebra w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Penerima</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Tanggal</th>
                  <th className="px-4 py-3 font-medium">Dosis</th>
                  <th className="px-4 py-3 font-medium">Periode</th>
                  <th className="px-4 py-3 font-medium">Petugas</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageData.map((v) => (
                  <tr key={v.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${v.target === 'Balita' ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-rose-400 to-pink-500'} text-xs font-bold text-white`}>
                          {v.namaPenerima.charAt(0)}
                        </div>
                        <span className="font-semibold text-foreground">{v.namaPenerima}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex h-6 items-center rounded-md px-2 text-xs font-medium ${v.target === 'Balita' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'}`}>
                        {v.target}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatTanggalID(v.tanggalPemberian)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${v.dosis.includes('Biru') ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'}`}>
                        <Droplet className="h-3 w-3" fill="currentColor" />
                        {v.dosis}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{v.periode} {v.tahun}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.petugas}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDeleteTarget(v)}
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

        {filtered.length > 0 && (
          <Pagination page={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </Card>

      <VitaminAFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        balitaList={balitaList}
        ibuHamilList={ibuHamilList}
        onSave={(data) => {
          addVitaminA(data);
          toast.success('Vitamin A berhasil dicatat', { description: `${data.namaPenerima} — ${data.dosis}` });
          setModalOpen(false);
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Hapus Record Vitamin A"
        description={`Apakah Anda yakin ingin menghapus catatan Vitamin A untuk "${deleteTarget?.namaPenerima}"?`}
        confirmLabel="Hapus"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}

// --- Vitamin A Form Modal ---
function VitaminAFormModal({
  open,
  onOpenChange,
  balitaList,
  ibuHamilList,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balitaList: { id: number; namaLengkap: string; usiaBulan: number }[];
  ibuHamilList: { id: number; namaLengkap: string; usiaKehamilanMinggu: number }[];
  onSave: (data: Omit<VitaminARecord, 'id'>) => void;
}) {
  const [target, setTarget] = useState<TargetVitaminA>('Balita');
  const [targetId, setTargetId] = useState<string>('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [periode, setPeriode] = useState<'Februari' | 'Agustus'>(
    new Date().getMonth() < 6 ? 'Februari' : 'Agustus',
  );
  const [tahun] = useState(new Date().getFullYear());
  const [petugas, setPetugas] = useState('Bidan Rina');
  const [catatan, setCatatan] = useState('');

  const eligibleBalita = balitaList.filter((b) => b.usiaBulan >= 6 && b.usiaBulan <= 59);
  const eligibleIbu = ibuHamilList.filter((i) => i.usiaKehamilanMinggu <= 12);

  const dosis = target === 'Balita' ? '200.000 IU (Biru)' : '100.000 IU (Merah)';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) {
      toast.error('Pilih penerima terlebih dahulu');
      return;
    }
    const id = parseInt(targetId);
    const namaPenerima = target === 'Balita'
      ? balitaList.find((b) => b.id === id)?.namaLengkap ?? ''
      : ibuHamilList.find((i) => i.id === id)?.namaLengkap ?? '';
    onSave({ target, targetId: id, namaPenerima, tanggalPemberian: tanggal, dosis, periode, tahun, petugas, catatan });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-violet-600" />
            Catat Pemberian Vitamin A
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Target Penerima</Label>
            <RadioGroup
              value={target}
              onValueChange={(v) => { setTarget(v as TargetVitaminA); setTargetId(''); }}
              className="flex gap-4 pt-1"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem id="vit-balita" value="Balita" />
                <Label htmlFor="vit-balita" className="cursor-pointer font-normal">Balita (6-59 bln)</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="vit-ibu" value="Ibu Hamil" />
                <Label htmlFor="vit-ibu" className="cursor-pointer font-normal">Ibu Hamil (T1)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vit-penerima">Pilih Penerima</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger id="vit-penerima"><SelectValue placeholder={`Pilih ${target}`} /></SelectTrigger>
              <SelectContent>
                {target === 'Balita'
                  ? eligibleBalita.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.namaLengkap} ({b.usiaBulan} bln)
                    </SelectItem>
                  ))
                  : eligibleIbu.map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.namaLengkap} ({i.usiaKehamilanMinggu} mgg)
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
            {target === 'Balita' && eligibleBalita.length === 0 && (
              <p className="text-xs text-amber-600">Tidak ada balita eligible (6-59 bulan)</p>
            )}
            {target === 'Ibu Hamil' && eligibleIbu.length === 0 && (
              <p className="text-xs text-amber-600">Tidak ada ibu hamil eligible (trimester 1)</p>
            )}
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Dosis otomatis:</p>
            <p className={`mt-0.5 text-sm font-semibold ${target === 'Balita' ? 'text-blue-600' : 'text-red-600'}`}>
              {dosis}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vit-tanggal">Tanggal Pemberian</Label>
              <Input id="vit-tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vit-periode">Periode</Label>
              <Select value={periode} onValueChange={(v) => setPeriode(v as 'Februari' | 'Agustus')}>
                <SelectTrigger id="vit-periode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Februari">Februari</SelectItem>
                  <SelectItem value="Agustus">Agustus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vit-petugas">Petugas</Label>
            <Input id="vit-petugas" value={petugas} onChange={(e) => setPetugas(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vit-catatan">Catatan</Label>
            <Textarea id="vit-catatan" rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Misal: tidak ada reaksi" />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" className="bg-violet-600 hover:bg-violet-700">Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
