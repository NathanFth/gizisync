'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { IbuHamilStatusBadge } from '@/components/shared/status-badge';
import { SearchBar, EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { formatTanggalID, AMBANG_LILA_KEK } from '@/lib/data/mock-data';
import { Plus, Pencil, Trash2, Eye, HeartPulse, Filter, Calendar, Ruler, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { IbuHamil } from '@/lib/data/types';

const PAGE_SIZE = 8;

const ibuHamilSchema = z.object({
  nik: z.string().regex(/^\d{16}$/, 'NIK harus 16 digit angka'),
  namaLengkap: z.string().min(2, 'Nama minimal 2 karakter'),
  usiaKehamilanMinggu: z.coerce.number().min(1, 'Minimal 1 minggu').max(45, 'Maksimal 45 minggu'),
  htp: z.string().min(1, 'HTP wajib diisi'),
  lilaTerakCm: z.coerce.number().min(15, 'Minimal 15 cm').max(40, 'Maksimal 40 cm'),
  beratBadanKg: z.coerce.number().min(30, 'Minimal 30 kg').max(150, 'Maksimal 150 kg').optional(),
  tekananDarah: z.string().optional(),
});

type IbuHamilFormInput = z.input<typeof ibuHamilSchema>;
type IbuHamilFormOutput = z.output<typeof ibuHamilSchema>;

export function IbuHamilView() {
  const { ibuHamilList, addIbuHamil, updateIbuHamil, deleteIbuHamil, viewIbuHamilDetail } = useStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IbuHamil | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IbuHamil | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return ibuHamilList;
    return ibuHamilList.filter(
      (i) => i.namaLengkap.toLowerCase().includes(q) || i.nik.includes(q),
    );
  }, [ibuHamilList, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageData = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const handleEdit = (i: IbuHamil) => {
    setEditing(i);
    setModalOpen(true);
  };
  const confirmDelete = () => {
    if (deleteTarget) {
      deleteIbuHamil(deleteTarget.id);
      toast.success('Data ibu hamil dihapus', { description: deleteTarget.namaLengkap });
      setDeleteTarget(null);
    }
  };

  const totalKEK = ibuHamilList.filter((i) => i.status === 'Risiko KEK').length;

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10">
              <HeartPulse className="h-4 w-4 text-rose-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Ibu Hamil</p>
              <p className="text-lg font-bold text-foreground">{ibuHamilList.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Risiko KEK</p>
              <p className="text-lg font-bold text-foreground">{totalKEK}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
              <Calendar className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ambang LILA</p>
              <p className="text-lg font-bold text-foreground">&lt;{AMBANG_LILA_KEK} cm</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <SearchBar
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Cari nama atau NIK..."
              className="flex-1 sm:max-w-xs"
            />
            <Button variant="outline" size="sm" className="w-fit">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
          </div>
          <Button onClick={handleAdd} className="bg-rose-600 hover:bg-rose-700 w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Tambah Ibu Hamil
          </Button>
        </div>

        {/* Table */}
        {pageData.length === 0 ? (
          <EmptyState
            icon={HeartPulse}
            title="Belum ada data ibu hamil"
            description={search ? 'Tidak ada hasil yang cocok.' : 'Tambahkan data ibu hamil pertama.'}
            action={!search ? (
              <Button onClick={handleAdd} className="bg-rose-600 hover:bg-rose-700">
                <Plus className="mr-2 h-4 w-4" /> Tambah Ibu Hamil
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-zebra w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">NIK</th>
                  <th className="px-4 py-3 font-medium">Usia Hamil</th>
                  <th className="px-4 py-3 font-medium">HTP</th>
                  <th className="px-4 py-3 font-medium">LILA</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageData.map((i) => (
                  <tr key={i.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-xs font-bold text-white">
                          {i.namaLengkap.charAt(0)}
                        </div>
                        <span className="font-semibold text-foreground">{i.namaLengkap}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{i.nik}</td>
                    <td className="px-4 py-3 text-muted-foreground">{i.usiaKehamilanMinggu} minggu</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatTanggalID(i.htp)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${i.lilaTerakCm < AMBANG_LILA_KEK ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                        {i.lilaTerakCm} cm
                      </span>
                    </td>
                    <td className="px-4 py-3"><IbuHamilStatusBadge status={i.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => viewIbuHamilDetail(i.id)} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" title="Lihat Detail">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleEdit(i)} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-sky-600" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(i)} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive" title="Hapus">
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

      <IbuHamilFormModal open={modalOpen} onOpenChange={setModalOpen} ibuHamil={editing} onSave={(data) => {
        if (editing) {
          updateIbuHamil(editing.id, data);
          toast.success('Data ibu hamil diperbarui', { description: data.namaLengkap });
        } else {
          addIbuHamil({ ...data, status: data.lilaTerakCm < AMBANG_LILA_KEK ? 'Risiko KEK' : 'Normal' });
          toast.success('Ibu hamil baru ditambahkan', { description: data.namaLengkap });
        }
        setModalOpen(false);
      }} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Hapus Data Ibu Hamil"
        description={`Apakah Anda yakin ingin menghapus data "${deleteTarget?.namaLengkap}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}

// --- Ibu Hamil Form Modal ---

function IbuHamilFormModal({
  open,
  onOpenChange,
  ibuHamil,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ibuHamil: IbuHamil | null;
  onSave: (data: Omit<IbuHamil, 'id' | 'status'>) => void;
}) {
  const form = useForm<IbuHamilFormInput, any, IbuHamilFormOutput>({
    resolver: zodResolver(ibuHamilSchema),
    defaultValues: ibuHamil
      ? {
          nik: ibuHamil.nik,
          namaLengkap: ibuHamil.namaLengkap,
          usiaKehamilanMinggu: ibuHamil.usiaKehamilanMinggu,
          htp: ibuHamil.htp,
          lilaTerakCm: ibuHamil.lilaTerakCm,
          beratBadanKg: ibuHamil.beratBadanKg,
          tekananDarah: ibuHamil.tekananDarah,
        }
      : {
          nik: '',
          namaLengkap: '',
          usiaKehamilanMinggu: 12,
          htp: '',
          lilaTerakCm: 24.0,
          beratBadanKg: undefined,
          tekananDarah: '',
        },
  });

  const lila = useWatch({ control: form.control, name: 'lilaTerakCm' });
  const isKEK = typeof lila === 'number' && lila < AMBANG_LILA_KEK;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ibuHamil ? 'Edit Data Ibu Hamil' : 'Tambah Data Ibu Hamil'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((data) => onSave(data))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ih-nik">NIK <span className="text-destructive">*</span></Label>
            <Input id="ih-nik" maxLength={16} {...form.register('nik')} />
            {form.formState.errors.nik && <p className="text-xs text-destructive">{form.formState.errors.nik.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ih-nama">Nama Lengkap <span className="text-destructive">*</span></Label>
            <Input id="ih-nama" {...form.register('namaLengkap')} />
            {form.formState.errors.namaLengkap && <p className="text-xs text-destructive">{form.formState.errors.namaLengkap.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ih-usia">Usia Kehamilan (minggu)</Label>
              <Input id="ih-usia" type="number" min={1} max={45} {...form.register('usiaKehamilanMinggu')} />
              {form.formState.errors.usiaKehamilanMinggu && <p className="text-xs text-destructive">{form.formState.errors.usiaKehamilanMinggu.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ih-htp">HTP (Taksiran Persalinan)</Label>
              <Input id="ih-htp" type="date" {...form.register('htp')} />
              {form.formState.errors.htp && <p className="text-xs text-destructive">{form.formState.errors.htp.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ih-lila">LILA Terakhir (cm)</Label>
              <Input id="ih-lila" type="number" step="0.1" {...form.register('lilaTerakCm', { valueAsNumber: true })} />
              {form.formState.errors.lilaTerakCm && <p className="text-xs text-destructive">{form.formState.errors.lilaTerakCm.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ih-bb">Berat Badan (kg)</Label>
              <Input id="ih-bb" type="number" step="0.1" {...form.register('beratBadanKg')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ih-td">Tekanan Darah</Label>
            <Input id="ih-td" placeholder="120/80" {...form.register('tekananDarah')} />
          </div>

          {isKEK && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Risiko KEK Terdeteksi</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">LILA &lt; {AMBANG_LILA_KEK} cm mengindikasikan Kekurangan Energi Kronis. Status akan otomatis diatur menjadi "Risiko KEK".</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" className="bg-rose-600 hover:bg-rose-700">
              {ibuHamil ? 'Simpan Perubahan' : 'Simpan Data'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
