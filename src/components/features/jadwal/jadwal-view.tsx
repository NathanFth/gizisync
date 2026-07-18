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
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { formatTanggalPanjangID, NAMA_BULAN_SINGKAT } from '@/lib/data/mock-data';
import { Calendar, Plus, Trash2, Clock, MapPin, User, CheckCircle2, XCircle, CalendarDays, ChevronRight, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import type { JadwalPosyandu, JenisKegiatan, StatusJadwal } from '@/lib/data/types';

export function JadwalView() {
  const { jadwalList, addJadwal, updateJadwal, deleteJadwal } = useStore();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<JadwalPosyandu | null>(null);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const sorted = useMemo(() => {
    return jadwalList
      .filter((j) => filterStatus === 'all' || j.status === filterStatus)
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  }, [jadwalList, filterStatus]);

  // Split into upcoming and past
  const upcoming = sorted.filter((j) => j.tanggal >= todayStr && j.status !== 'Dibatalkan');
  const past = sorted.filter((j) => j.tanggal < todayStr || j.status === 'Dibatalkan').reverse();

  const stats = useMemo(() => {
    const terjadwal = jadwalList.filter((j) => j.status === 'Terjadwal' && j.tanggal >= todayStr).length;
    const selesai = jadwalList.filter((j) => j.status === 'Selesai').length;
    const nextSession = upcoming[0];
    return { terjadwal, selesai, nextSession };
  }, [jadwalList, upcoming, todayStr]);

  const handleStatusChange = (j: JadwalPosyandu, status: StatusJadwal) => {
    updateJadwal(j.id, { status });
    toast.success(`Status jadwal diubah: ${status}`, { description: j.judul });
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteJadwal(deleteTarget.id);
      toast.success('Jadwal dihapus');
      setDeleteTarget(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Tanggal', 'Jam Mulai', 'Jam Selesai', 'Jenis Kegiatan', 'Judul', 'Lokasi', 'PIC', 'Status', 'Catatan'];
    const rows = sorted.map((j) => [
      j.tanggal, j.jamMulai, j.jamSelesai, j.jenisKegiatan, j.judul, j.lokasi, j.pic, j.status, j.catatan,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Jadwal_Posyandu_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Export CSV berhasil', { description: `${sorted.length} jadwal` });
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
              <Calendar className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jadwal Mendatang</p>
              <p className="text-2xl font-bold text-foreground">{stats.terjadwal}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-500/10">
              <CheckCircle2 className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kegiatan Selesai</p>
              <p className="text-2xl font-bold text-foreground">{stats.selesai}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Kegiatan Terdekat</p>
              <p className="truncate text-sm font-bold text-foreground">
                {stats.nextSession ? stats.nextSession.judul : 'Tidak ada'}
              </p>
              {stats.nextSession && (
                <p className="text-xs text-muted-foreground">{formatTanggalPanjangID(stats.nextSession.tanggal)}</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Filter Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="Terjadwal">Terjadwal</SelectItem>
              <SelectItem value="Selesai">Selesai</SelectItem>
              <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={sorted.length === 0}>
              <FileDown className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button onClick={() => setModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Tambah Jadwal
            </Button>
          </div>
        </div>
      </Card>

      {/* Upcoming sessions */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarDays className="h-4 w-4 text-emerald-600" /> Jadwal Mendatang
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
            {upcoming.length}
          </span>
        </h3>
        {upcoming.length === 0 ? (
          <Card>
            <EmptyState
              icon={Calendar}
              title="Tidak ada jadwal mendatang"
              description="Tambahkan jadwal kegiatan Posyandu berikutnya."
              action={<Button onClick={() => setModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="mr-2 h-4 w-4" /> Tambah Jadwal</Button>}
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((j) => (
              <JadwalCard
                key={j.id}
                jadwal={j}
                isUpcoming
                onStatusChange={handleStatusChange}
                onDelete={() => setDeleteTarget(j)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past sessions */}
      {past.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="h-4 w-4 text-muted-foreground" /> Riwayat Kegiatan
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {past.length}
            </span>
          </h3>
          <div className="space-y-3">
            {past.map((j) => (
              <JadwalCard
                key={j.id}
                jadwal={j}
                isUpcoming={false}
                onStatusChange={handleStatusChange}
                onDelete={() => setDeleteTarget(j)}
              />
            ))}
          </div>
        </div>
      )}

      <JadwalFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={(data) => {
          addJadwal(data);
          toast.success('Jadwal ditambahkan', { description: data.judul });
          setModalOpen(false);
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Hapus Jadwal"
        description={`Apakah Anda yakin ingin menghapus jadwal "${deleteTarget?.judul}"?`}
        confirmLabel="Hapus"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}

function JadwalCard({
  jadwal,
  isUpcoming,
  onStatusChange,
  onDelete,
}: {
  jadwal: JadwalPosyandu;
  isUpcoming: boolean;
  onStatusChange: (j: JadwalPosyandu, status: StatusJadwal) => void;
  onDelete: () => void;
}) {
  const date = new Date(jadwal.tanggal);
  const dayName = date.toLocaleDateString('id-ID', { weekday: 'long' });
  const dayNum = date.getDate();
  const monthShort = NAMA_BULAN_SINGKAT[date.getMonth()];

  const jenisColor: Record<JenisKegiatan, string> = {
    'Posyandu Rutin': 'border-l-emerald-500',
    'Penimbangan Balita': 'border-l-sky-500',
    'Pemberian Imunisasi': 'border-l-violet-500',
    'Pemberian Vitamin A': 'border-l-blue-500',
    'Pemberian PMT': 'border-l-amber-500',
    'Penyuluhan Gizi': 'border-l-teal-500',
    'Pemeriksaan Ibu Hamil': 'border-l-rose-500',
    'Posyandu Balita': 'border-l-emerald-500',
    'Posyandu Lansia': 'border-l-orange-500',
  };

  return (
    <Card className={`border-l-4 ${jenisColor[jadwal.jenisKegiatan]} p-4 transition-all hover:shadow-md`}>
      <div className="flex items-start gap-4">
        {/* Date block */}
        <div className="flex shrink-0 flex-col items-center justify-center rounded-lg bg-muted px-3 py-2 min-w-[60px]">
          <span className="text-xs font-medium text-muted-foreground">{monthShort}</span>
          <span className="text-xl font-bold text-foreground">{dayNum}</span>
          <span className="text-[10px] text-muted-foreground">{dayName.slice(0, 3)}</span>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-semibold text-foreground">{jadwal.judul}</h4>
              <p className="text-xs text-muted-foreground">{jadwal.jenisKegiatan}</p>
            </div>
            <JadwalStatusBadge status={jadwal.status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {dayName}, {formatTanggalPanjangID(jadwal.tanggal)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {jadwal.jamMulai} - {jadwal.jamSelesai} WIB
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {jadwal.lokasi}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" /> {jadwal.pic}
            </span>
          </div>
          {jadwal.catatan && (
            <p className="mt-2 text-xs text-muted-foreground">{jadwal.catatan}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col gap-1">
          {isUpcoming && jadwal.status === 'Terjadwal' && (
            <>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStatusChange(jadwal, 'Selesai')}>
                <CheckCircle2 className="mr-1 h-3 w-3" /> Selesai
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => onStatusChange(jadwal, 'Dibatalkan')}>
                <XCircle className="mr-1 h-3 w-3" /> Batal
              </Button>
            </>
          )}
          <button
            onClick={onDelete}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
            title="Hapus"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}

function JadwalStatusBadge({ status }: { status: StatusJadwal }) {
  const config = {
    'Terjadwal': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    'Berlangsung': 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    'Selesai': 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
    'Dibatalkan': 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config}`}>
      {status}
    </span>
  );
}

// --- Jadwal Form Modal ---
function JadwalFormModal({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<JadwalPosyandu, 'id'>) => void;
}) {
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [jamMulai, setJamMulai] = useState('08:00');
  const [jamSelesai, setJamSelesai] = useState('12:00');
  const [jenisKegiatan, setJenisKegiatan] = useState<JenisKegiatan>('Posyandu Rutin');
  const [judul, setJudul] = useState('');
  const [lokasi, setLokasi] = useState('Balai RW 06');
  const [pic, setPic] = useState('Siti Aminah');
  const [catatan, setCatatan] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul) {
      toast.error('Judul kegiatan wajib diisi');
      return;
    }
    onSave({
      tanggal,
      jamMulai,
      jamSelesai,
      jenisKegiatan,
      judul,
      lokasi,
      pic,
      catatan,
      status: 'Terjadwal',
    });
    setJudul(''); setCatatan('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            Tambah Jadwal Posyandu
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="jadwal-judul">Judul Kegiatan <span className="text-destructive">*</span></Label>
            <Input id="jadwal-judul" value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Misal: Posyandu Rutin Bulanan" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jadwal-jenis">Jenis Kegiatan</Label>
            <Select value={jenisKegiatan} onValueChange={(v) => setJenisKegiatan(v as JenisKegiatan)}>
              <SelectTrigger id="jadwal-jenis"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Posyandu Rutin">Posyandu Rutin</SelectItem>
                <SelectItem value="Penimbangan Balita">Penimbangan Balita</SelectItem>
                <SelectItem value="Pemberian Imunisasi">Pemberian Imunisasi</SelectItem>
                <SelectItem value="Pemberian Vitamin A">Pemberian Vitamin A</SelectItem>
                <SelectItem value="Pemberian PMT">Pemberian PMT</SelectItem>
                <SelectItem value="Penyuluhan Gizi">Penyuluhan Gizi</SelectItem>
                <SelectItem value="Pemeriksaan Ibu Hamil">Pemeriksaan Ibu Hamil</SelectItem>
                <SelectItem value="Posyandu Balita">Posyandu Balita</SelectItem>
                <SelectItem value="Posyandu Lansia">Posyandu Lansia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="jadwal-tanggal">Tanggal</Label>
              <Input id="jadwal-tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jadwal-mulai">Jam Mulai</Label>
              <Input id="jadwal-mulai" type="time" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jadwal-selesai">Jam Selesai</Label>
              <Input id="jadwal-selesai" type="time" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="jadwal-lokasi">Lokasi</Label>
              <Input id="jadwal-lokasi" value={lokasi} onChange={(e) => setLokasi(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jadwal-pic">Penanggung Jawab</Label>
              <Input id="jadwal-pic" value={pic} onChange={(e) => setPic(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jadwal-catatan">Catatan</Label>
            <Textarea id="jadwal-catatan" rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Detail kegiatan..." />
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
