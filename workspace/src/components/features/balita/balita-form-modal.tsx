'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';
import type { Balita } from '@/lib/data/types';

const balitaSchema = z.object({
  nik: z.string().regex(/^\d{16}$/, 'NIK harus 16 digit angka'),
  namaLengkap: z.string().min(2, 'Nama minimal 2 karakter'),
  tanggalLahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
  jenisKelamin: z.enum(['Laki-laki', 'Perempuan']),
  namaIbu: z.string().min(2, 'Nama ibu minimal 2 karakter'),
  beratLahirKg: z.coerce.number().min(0.5, 'Minimal 0.5 kg').max(6, 'Maksimal 6 kg'),
  panjangLahirCm: z.coerce.number().min(30, 'Minimal 30 cm').max(60, 'Maksimal 60 cm'),
  riwayatPenyakit: z.string().default('Tidak ada'),
  alamat: z.string().min(5, 'Alamat minimal 5 karakter'),
  status: z.enum(['Aktif', 'Tidak Aktif']).default('Aktif'),
});

// Input type (form values pre-resolve; coerce fields accept unknown)
// Output type (after resolver runs; coerce fields are number)
type BalitaFormInput = z.input<typeof balitaSchema>;
type BalitaFormOutput = z.output<typeof balitaSchema>;

interface BalitaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balita?: Balita | null;
}

export function BalitaFormModal({ open, onOpenChange, balita }: BalitaFormModalProps) {
  const { addBalita, updateBalita } = useStore();
  const isEdit = !!balita;

  const form = useForm<BalitaFormInput, any, BalitaFormOutput>({
    resolver: zodResolver(balitaSchema),
    defaultValues: balita
      ? {
          nik: balita.nik,
          namaLengkap: balita.namaLengkap,
          tanggalLahir: balita.tanggalLahir,
          jenisKelamin: balita.jenisKelamin,
          namaIbu: balita.namaIbu,
          beratLahirKg: balita.beratLahirKg,
          panjangLahirCm: balita.panjangLahirCm,
          riwayatPenyakit: balita.riwayatPenyakit,
          alamat: balita.alamat,
          status: balita.status,
        }
      : {
          nik: '',
          namaLengkap: '',
          tanggalLahir: '',
          jenisKelamin: 'Laki-laki',
          namaIbu: '',
          beratLahirKg: 3.0,
          panjangLahirCm: 50,
          riwayatPenyakit: 'Tidak ada',
          alamat: '',
          status: 'Aktif',
        },
  });

  const onSubmit = (data: BalitaFormOutput) => {
    if (isEdit && balita) {
      updateBalita(balita.id, data);
      toast.success('Data balita berhasil diperbarui', { description: data.namaLengkap });
    } else {
      addBalita(data);
      toast.success('Balita baru berhasil ditambahkan', { description: data.namaLengkap });
    }
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Data Balita' : 'Tambah Data Balita'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nik">NIK <span className="text-destructive">*</span></Label>
              <Input id="nik" placeholder="3171234567890001" maxLength={16} {...form.register('nik')} />
              {form.formState.errors.nik && (
                <p className="text-xs text-destructive">{form.formState.errors.nik.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="namaLengkap">Nama Lengkap <span className="text-destructive">*</span></Label>
              <Input id="namaLengkap" placeholder="Nama anak" {...form.register('namaLengkap')} />
              {form.formState.errors.namaLengkap && (
                <p className="text-xs text-destructive">{form.formState.errors.namaLengkap.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tanggalLahir">Tanggal Lahir <span className="text-destructive">*</span></Label>
              <Input id="tanggalLahir" type="date" {...form.register('tanggalLahir')} />
              {form.formState.errors.tanggalLahir && (
                <p className="text-xs text-destructive">{form.formState.errors.tanggalLahir.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Jenis Kelamin <span className="text-destructive">*</span></Label>
              <RadioGroup
                defaultValue={form.getValues('jenisKelamin')}
                onValueChange={(v) => form.setValue('jenisKelamin', v as 'Laki-laki' | 'Perempuan')}
                className="flex gap-4 pt-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="jk-l" value="Laki-laki" />
                  <Label htmlFor="jk-l" className="font-normal cursor-pointer">Laki-laki</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="jk-p" value="Perempuan" />
                  <Label htmlFor="jk-p" className="font-normal cursor-pointer">Perempuan</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="namaIbu">Nama Ibu <span className="text-destructive">*</span></Label>
              <Input id="namaIbu" placeholder="Nama ibu kandung" {...form.register('namaIbu')} />
              {form.formState.errors.namaIbu && (
                <p className="text-xs text-destructive">{form.formState.errors.namaIbu.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="beratLahirKg">Berat Lahir (kg) <span className="text-destructive">*</span></Label>
              <Input id="beratLahirKg" type="number" step="0.1" {...form.register('beratLahirKg')} />
              {form.formState.errors.beratLahirKg && (
                <p className="text-xs text-destructive">{form.formState.errors.beratLahirKg.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="panjangLahirCm">Panjang Lahir (cm) <span className="text-destructive">*</span></Label>
              <Input id="panjangLahirCm" type="number" step="0.1" {...form.register('panjangLahirCm')} />
              {form.formState.errors.panjangLahirCm && (
                <p className="text-xs text-destructive">{form.formState.errors.panjangLahirCm.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="riwayatPenyakit">Riwayat Penyakit</Label>
            <Textarea id="riwayatPenyakit" rows={2} placeholder="Tidak ada / alergi / dll" {...form.register('riwayatPenyakit')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="alamat">Alamat <span className="text-destructive">*</span></Label>
            <Textarea id="alamat" rows={2} placeholder="Jl. ... RT/RW ..." {...form.register('alamat')} />
            {form.formState.errors.alamat && (
              <p className="text-xs text-destructive">{form.formState.errors.alamat.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              {isEdit ? 'Simpan Perubahan' : 'Simpan Data'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
