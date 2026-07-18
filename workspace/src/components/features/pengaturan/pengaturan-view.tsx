'use client';

import { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Building2, Lock, Eye, EyeOff, Save, Check, Database, Download, Upload, AlertTriangle, FileJson, RefreshCw, Bell, Shield, HeartPulse, Syringe, Utensils, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const profilSchema = z.object({
  namaLengkap: z.string().min(2, 'Nama minimal 2 karakter'),
  nomorTelepon: z.string().min(8, 'Nomor telepon tidak valid'),
  email: z.string().email('Email tidak valid'),
});

const posyanduSchema = z.object({
  namaPosyandu: z.string().min(2, 'Nama Posyandu minimal 2 karakter'),
  namaKetua: z.string().min(2, 'Nama ketua minimal 2 karakter'),
  alamatLengkap: z.string().min(5, 'Alamat minimal 5 karakter'),
  kelurahan: z.string().min(2, 'Kelurahan minimal 2 karakter'),
  kecamatan: z.string().min(2, 'Kecamatan minimal 2 karakter'),
});

const passwordSchema = z.object({
  kataSandiLama: z.string().min(1, 'Kata sandi lama wajib diisi'),
  kataSandiBaru: z.string().min(8, 'Minimal 8 karakter'),
  konfirmasiSandi: z.string().min(1, 'Konfirmasi wajib diisi'),
}).refine((data) => data.kataSandiBaru === data.konfirmasiSandi, {
  message: 'Konfirmasi sandi tidak cocok',
  path: ['konfirmasiSandi'],
});

export function PengaturanView() {
  const { pengaturan, updatePengaturan } = useStore();

  const profilForm = useForm({
    resolver: zodResolver(profilSchema),
    defaultValues: {
      namaLengkap: pengaturan.profil.namaLengkap,
      nomorTelepon: pengaturan.profil.nomorTelepon,
      email: pengaturan.profil.email,
    },
  });

  const posyanduForm = useForm({
    resolver: zodResolver(posyanduSchema),
    defaultValues: {
      namaPosyandu: pengaturan.posyandu.namaPosyandu,
      namaKetua: pengaturan.posyandu.namaKetua,
      alamatLengkap: pengaturan.posyandu.alamatLengkap,
      kelurahan: pengaturan.posyandu.kelurahan,
      kecamatan: pengaturan.posyandu.kecamatan,
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { kataSandiLama: '', kataSandiBaru: '', konfirmasiSandi: '' },
  });

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const onProfilSubmit = (data: z.infer<typeof profilSchema>) => {
    updatePengaturan({ profil: { ...pengaturan.profil, ...data } });
    toast.success('Profil berhasil diperbarui');
  };

  const onPosyanduSubmit = (data: z.infer<typeof posyanduSchema>) => {
    updatePengaturan({ posyandu: { ...pengaturan.posyandu, ...data } });
    toast.success('Data Posyandu diperbarui');
  };

  const onPasswordSubmit = () => {
    toast.success('Kata sandi berhasil diubah');
    passwordForm.reset();
  };

  const getInitials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="mx-auto max-w-3xl">
      <Tabs defaultValue="profil" className="space-y-5">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="profil" className="gap-1.5">
            <User className="h-4 w-4" /> <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="posyandu" className="gap-1.5">
            <Building2 className="h-4 w-4" /> <span className="hidden sm:inline">Posyandu</span>
          </TabsTrigger>
          <TabsTrigger value="keamanan" className="gap-1.5">
            <Lock className="h-4 w-4" /> <span className="hidden sm:inline">Keamanan</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-1.5">
            <Database className="h-4 w-4" /> <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
        </TabsList>

        {/* Profil Tab */}
        <TabsContent value="profil">
          <Card className="p-5 sm:p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-xl font-bold text-white">
                {getInitials(pengaturan.profil.namaLengkap)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{pengaturan.profil.namaLengkap}</h3>
                <p className="text-sm text-muted-foreground">{pengaturan.profil.peran}</p>
              </div>
            </div>
            <form onSubmit={profilForm.handleSubmit(onProfilSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-nama">Nama Lengkap</Label>
                <Input id="p-nama" {...profilForm.register('namaLengkap')} />
                {profilForm.formState.errors.namaLengkap && <p className="text-xs text-destructive">{profilForm.formState.errors.namaLengkap.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-username">Username</Label>
                <Input id="p-username" value={pengaturan.profil.username} disabled className="bg-muted/50" />
                <p className="text-xs text-muted-foreground">Username tidak dapat diubah</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="p-telp">Nomor Telepon</Label>
                  <Input id="p-telp" {...profilForm.register('nomorTelepon')} />
                  {profilForm.formState.errors.nomorTelepon && <p className="text-xs text-destructive">{profilForm.formState.errors.nomorTelepon.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-email">Email</Label>
                  <Input id="p-email" type="email" {...profilForm.register('email')} />
                  {profilForm.formState.errors.email && <p className="text-xs text-destructive">{profilForm.formState.errors.email.message}</p>}
                </div>
              </div>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
              </Button>
            </form>
          </Card>
        </TabsContent>

        {/* Posyandu Tab */}
        <TabsContent value="posyandu">
          <Card className="p-5 sm:p-6">
            <h3 className="mb-4 text-base font-semibold text-foreground">Informasi Posyandu</h3>
            <form onSubmit={posyanduForm.handleSubmit(onPosyanduSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ps-nama">Nama Posyandu</Label>
                  <Input id="ps-nama" {...posyanduForm.register('namaPosyandu')} />
                  {posyanduForm.formState.errors.namaPosyandu && <p className="text-xs text-destructive">{posyanduForm.formState.errors.namaPosyandu.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ps-ketua">Nama Ketua</Label>
                  <Input id="ps-ketua" {...posyanduForm.register('namaKetua')} />
                  {posyanduForm.formState.errors.namaKetua && <p className="text-xs text-destructive">{posyanduForm.formState.errors.namaKetua.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ps-alamat">Alamat Lengkap</Label>
                <Input id="ps-alamat" {...posyanduForm.register('alamatLengkap')} />
                {posyanduForm.formState.errors.alamatLengkap && <p className="text-xs text-destructive">{posyanduForm.formState.errors.alamatLengkap.message}</p>}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ps-kel">Kelurahan</Label>
                  <Input id="ps-kel" {...posyanduForm.register('kelurahan')} />
                  {posyanduForm.formState.errors.kelurahan && <p className="text-xs text-destructive">{posyanduForm.formState.errors.kelurahan.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ps-kec">Kecamatan</Label>
                  <Input id="ps-kec" {...posyanduForm.register('kecamatan')} />
                  {posyanduForm.formState.errors.kecamatan && <p className="text-xs text-destructive">{posyanduForm.formState.errors.kecamatan.message}</p>}
                </div>
              </div>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
              </Button>
            </form>
          </Card>
        </TabsContent>

        {/* Keamanan Tab */}
        <TabsContent value="keamanan">
          <Card className="p-5 sm:p-6">
            <h3 className="mb-1 text-base font-semibold text-foreground">Ubah Kata Sandi</h3>
            <p className="mb-4 text-sm text-muted-foreground">Gunakan kata sandi yang kuat dengan minimal 8 karakter.</p>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pwd-old">Kata Sandi Lama</Label>
                <div className="relative">
                  <Input id="pwd-old" type={showOld ? 'text' : 'password'} {...passwordForm.register('kataSandiLama')} className="pr-10" />
                  <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordForm.formState.errors.kataSandiLama && <p className="text-xs text-destructive">{passwordForm.formState.errors.kataSandiLama.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pwd-new">Kata Sandi Baru</Label>
                <div className="relative">
                  <Input id="pwd-new" type={showNew ? 'text' : 'password'} {...passwordForm.register('kataSandiBaru')} className="pr-10" />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordForm.formState.errors.kataSandiBaru && <p className="text-xs text-destructive">{passwordForm.formState.errors.kataSandiBaru.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pwd-confirm">Konfirmasi Kata Sandi Baru</Label>
                <div className="relative">
                  <Input id="pwd-confirm" type={showConfirm ? 'text' : 'password'} {...passwordForm.register('konfirmasiSandi')} className="pr-10" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordForm.formState.errors.konfirmasiSandi && <p className="text-xs text-destructive">{passwordForm.formState.errors.konfirmasiSandi.message}</p>}
              </div>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                <Check className="mr-2 h-4 w-4" /> Ubah Kata Sandi
              </Button>
            </form>
          </Card>
        </TabsContent>

        {/* Data Tab — Backup & Restore */}
        <TabsContent value="data">
          <DataBackupTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Data Backup Tab ---
function DataBackupTab() {
  const store = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const dataStats = [
    { label: 'Balita', count: store.balitaList.length, icon: '👶' },
    { label: 'Pengukuran', count: store.pengukuranList.length, icon: '📏' },
    { label: 'Ibu Hamil', count: store.ibuHamilList.length, icon: '🤰' },
    { label: 'Imunisasi', count: store.imunisasiList.length, icon: '💉' },
    { label: 'Vitamin A', count: store.vitaminAList.length, icon: '💧' },
    { label: 'PMT', count: store.pmtList.length, icon: '🍽️' },
    { label: 'Jadwal', count: store.jadwalList.length, icon: '📅' },
    { label: 'ANC', count: store.kunjunganANCList.length, icon: '🩺' },
  ];

  const handleExport = () => {
    const data = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      balitaList: store.balitaList,
      pengukuranList: store.pengukuranList,
      ibuHamilList: store.ibuHamilList,
      imunisasiList: store.imunisasiList,
      kunjunganANCList: store.kunjunganANCList,
      vitaminAList: store.vitaminAList,
      pmtList: store.pmtList,
      jadwalList: store.jadwalList,
      laporanRecords: store.laporanRecords,
      pengaturan: store.pengaturan,
      notifikasiList: store.notifikasiList,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gizisync-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Backup berhasil diunduh', {
      description: `File JSON berisi ${data.balitaList.length} balita, ${data.pengukuranList.length} pengukuran`,
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.balitaList || !data.pengaturan) {
          throw new Error('Format file tidak valid');
        }
        // Replace all data in store
        useStore.setState({
          balitaList: data.balitaList || [],
          pengukuranList: data.pengukuranList || [],
          ibuHamilList: data.ibuHamilList || [],
          imunisasiList: data.imunisasiList || [],
          kunjunganANCList: data.kunjunganANCList || [],
          vitaminAList: data.vitaminAList || [],
          pmtList: data.pmtList || [],
          jadwalList: data.jadwalList || [],
          laporanRecords: data.laporanRecords || [],
          pengaturan: data.pengaturan,
          notifikasiList: data.notifikasiList || [],
        });
        toast.success('Data berhasil dipulihkan', {
          description: `${data.balitaList.length} balita, ${data.pengukuranList.length} pengukuran`,
        });
      } catch (err) {
        toast.error('Gagal memulihkan data', {
          description: 'File JSON tidak valid atau rusak',
        });
      }
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('PERINGATAN: Semua data akan direset ke data awal. Lanjutkan?')) {
      localStorage.removeItem('gizisync-store');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-5">
      {/* Data overview */}
      <Card className="p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Database className="h-4 w-4 text-emerald-600" /> Ringkasan Data
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {dataStats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p className="text-xl">{stat.icon}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{stat.count}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Backup */}
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
            <Download className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">Backup Data</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Unduh seluruh data Posyandu dalam format JSON untuk cadangan atau migrasi.
            </p>
            <Button onClick={handleExport} className="mt-3 bg-emerald-600 hover:bg-emerald-700" size="sm">
              <FileJson className="mr-2 h-4 w-4" /> Unduh Backup JSON
            </Button>
          </div>
        </div>
      </Card>

      {/* Restore */}
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-500/10">
            <Upload className="h-5 w-5 text-sky-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">Pulihkan Data</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Unggah file backup JSON untuk memulihkan data. Data saat ini akan ditimpa.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              variant="outline"
              className="mt-3"
              size="sm"
            >
              {importing ? (
                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" /> Pilih File JSON</>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Reset warning */}
      <Card className="border-red-200 bg-red-50/50 p-5 dark:border-red-500/20 dark:bg-red-500/5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/15">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">Reset Data ke Awal</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Hapus semua data dan kembali ke data contoh awal. Tindakan ini tidak dapat dibatalkan.
            </p>
            <Button onClick={handleReset} variant="destructive" className="mt-3" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" /> Reset Semua Data
            </Button>
          </div>
        </div>
      </Card>

      {/* Info */}
      <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        <Shield className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Data disimpan secara lokal di browser Anda (localStorage). Lakukan backup berkala untuk mencegah kehilangan data.
          Backup JSON berisi seluruh data: balita, pengukuran, ibu hamil, imunisasi, Vitamin A, PMT, jadwal, ANC, dan pengaturan.
        </p>
      </div>

      {/* Notification Preferences */}
      <Card className="p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Bell className="h-4 w-4 text-amber-600" /> Preferensi Notifikasi
        </h3>
        <div className="space-y-3">
          {[
            { id: 'stunting', label: 'Alert Balita Prioritas', desc: 'Notifikasi saat ada balita dengan Z-Score < -2 SD', icon: AlertTriangle, color: 'text-red-600 bg-red-50 dark:bg-red-500/10' },
            { id: 'kek', label: 'Alert Ibu Hamil KEK', desc: 'Notifikasi saat ada ibu hamil dengan LILA < 23.5 cm', icon: HeartPulse, color: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10' },
            { id: 'imunisasi', label: 'Reminder Imunisasi', desc: 'Pengingat jadwal imunisasi balita', icon: Syringe, color: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10' },
            { id: 'posyandu', label: 'Reminder Jadwal Posyandu', desc: 'Pengingat jadwal kegiatan Posyandu', icon: Calendar, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
            { id: 'pmt', label: 'Update Program PMT', desc: 'Notifikasi status program PMT', icon: Utensils, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
          ].map((pref) => (
            <NotificationPref key={pref.id} label={pref.label} desc={pref.desc} icon={pref.icon} color={pref.color} />
          ))}
        </div>
      </Card>
    </div>
  );
}

// --- Notification Preference Item ---
function NotificationPref({
  label,
  desc,
  icon: Icon,
  color,
}: {
  label: string;
  desc: string;
  icon: typeof Bell;
  color: string;
}) {
  const [enabled, setEnabled] = useState(true);
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => setEnabled(!enabled)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${enabled ? 'bg-emerald-600' : 'bg-muted'}`}
      >
        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
