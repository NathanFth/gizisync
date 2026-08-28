"use client";

// BARU: Import useEffect
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import type { Balita } from "@/lib/data/types";

const balitaSchema = z.object({
  nik: z.string().regex(/^\d{16}$/, "NIK Balita harus 16 digit angka"),
  namaLengkap: z.string().min(2, "Nama minimal 2 karakter"),
  tanggalLahir: z.string().min(1, "Tanggal lahir wajib diisi"),
  jenisKelamin: z.enum(["Laki-laki", "Perempuan"]),
  namaIbu: z.string().min(2, "Nama ibu minimal 2 karakter"),
  namaAyah: z.string().min(2, "Nama ayah minimal 2 karakter"),
  nikOrtu: z
    .string()
    .regex(/^\d{16}$/, "NIK Orang Tua harus 16 digit angka")
    .or(z.literal(""))
    .optional(),
  noTelp: z
    .string()
    .regex(
      /^(?:\+62|62|0)[2-9]\d{7,11}$/,
      "Format nomor HP tidak valid (contoh: 0812...)",
    )
    .or(z.literal(""))
    .optional(),
  beratLahirKg: z.coerce
    .number()
    .min(0.5, "Minimal 0.5 kg")
    .max(6, "Maksimal 6 kg"),
  panjangLahirCm: z.coerce
    .number()
    .min(30, "Minimal 30 cm")
    .max(60, "Maksimal 60 cm"),
  kelompokDasawisma: z
    .string()
    .min(1, "Kelompok Dasawisma wajib diisi (Contoh: 01/06)"),
  status: z
    .enum(["Aktif", "Tidak Aktif", "Lulus", "Pindah", "Meninggal"])
    .default("Aktif"),
});

type BalitaFormInput = z.input<typeof balitaSchema>;
type BalitaFormOutput = z.output<typeof balitaSchema>;

interface BalitaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balita?: Balita | null;
}

export function BalitaFormModal({
  open,
  onOpenChange,
  balita,
}: BalitaFormModalProps) {
  const { addBalita, updateBalita } = useStore();
  const isEdit = !!balita;

  const form = useForm<BalitaFormInput, any, BalitaFormOutput>({
    resolver: zodResolver(balitaSchema),
    defaultValues: {
      nik: "",
      namaLengkap: "",
      tanggalLahir: "",
      jenisKelamin: "Laki-laki",
      namaIbu: "",
      namaAyah: "",
      nikOrtu: "",
      noTelp: "",
      beratLahirKg: 3.0,
      panjangLahirCm: 50,
      kelompokDasawisma: "",
      status: "Aktif",
    },
  });

  // BARU: Memaksa form untuk update isinya setiap kali modal dibuka/data balita berganti
  useEffect(() => {
    if (open) {
      if (balita) {
        form.reset({
          nik: balita.nik || "",
          namaLengkap: balita.namaLengkap || "",
          tanggalLahir: balita.tanggalLahir || "",
          jenisKelamin:
            balita.jenisKelamin === "Laki-laki" ||
            balita.jenisKelamin === "Perempuan"
              ? balita.jenisKelamin
              : "Laki-laki",
          namaIbu: balita.namaIbu || "",
          namaAyah: balita.namaAyah || "",
          nikOrtu: balita.nikOrtu || "",
          noTelp: balita.noTelp || "",
          beratLahirKg: balita.beratLahirKg || 0,
          panjangLahirCm: balita.panjangLahirCm || 0,
          kelompokDasawisma: balita.kelompokDasawisma || "",
          status: (balita.status as any) || "Aktif",
        });
      } else {
        form.reset({
          nik: "",
          namaLengkap: "",
          tanggalLahir: "",
          jenisKelamin: "Laki-laki",
          namaIbu: "",
          namaAyah: "",
          nikOrtu: "",
          noTelp: "",
          beratLahirKg: 3.0,
          panjangLahirCm: 50,
          kelompokDasawisma: "",
          status: "Aktif",
        });
      }
    }
  }, [balita, open, form]);

  const onSubmit = async (data: BalitaFormOutput) => {
    try {
      if (isEdit && balita) {
        // Hapus property alamat sebelum dikirim ke API karena sudah diganti dasawisma
        const payload = { ...data };
        (payload as any).alamat = null;

        await updateBalita(String(balita.id), payload as any);
        toast.success("Data balita berhasil diperbarui", {
          description: data.namaLengkap,
        });
      } else {
        await addBalita({
          ...data,
          alamat: null, // Set alamat ke null saat insert
          sumberData: "Aplikasi",
          catatanValidasi: null,
        } as any);
        toast.success("Balita baru berhasil ditambahkan", {
          description: data.namaLengkap,
        });
      }

      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error("Error saat menyimpan data balita:", error);
      toast.error("Gagal menyimpan data", {
        description: error.message || "Terjadi kesalahan pada sistem.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Data Balita" : "Tambah Data Balita"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* SECTION IDENTITAS ANAK */}
          <div className="rounded-lg border p-4 bg-muted/20">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Identitas Anak
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nik">
                  NIK Balita <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nik"
                  placeholder="16 digit angka"
                  maxLength={16}
                  {...form.register("nik")}
                />
                {form.formState.errors.nik && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.nik.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="namaLengkap">
                  Nama Lengkap <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="namaLengkap"
                  placeholder="Nama anak"
                  {...form.register("namaLengkap")}
                />
                {form.formState.errors.namaLengkap && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.namaLengkap.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tanggalLahir">
                  Tanggal Lahir <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tanggalLahir"
                  type="date"
                  {...form.register("tanggalLahir")}
                />
                {form.formState.errors.tanggalLahir && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.tanggalLahir.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>
                  Jenis Kelamin <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  defaultValue={form.getValues("jenisKelamin")}
                  onValueChange={(v) =>
                    form.setValue(
                      "jenisKelamin",
                      v as "Laki-laki" | "Perempuan",
                    )
                  }
                  className="flex gap-4 pt-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="jk-l" value="Laki-laki" />
                    <Label
                      htmlFor="jk-l"
                      className="font-normal cursor-pointer"
                    >
                      Laki-laki
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="jk-p" value="Perempuan" />
                    <Label
                      htmlFor="jk-p"
                      className="font-normal cursor-pointer"
                    >
                      Perempuan
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* SECTION DATA ORANG TUA */}
          <div className="rounded-lg border p-4 bg-muted/20">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Data Orang Tua
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="namaIbu">
                  Nama Ibu <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="namaIbu"
                  placeholder="Nama ibu"
                  {...form.register("namaIbu")}
                />
                {form.formState.errors.namaIbu && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.namaIbu.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="namaAyah">
                  Nama Ayah <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="namaAyah"
                  placeholder="Nama ayah"
                  {...form.register("namaAyah")}
                />
                {form.formState.errors.namaAyah && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.namaAyah.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nikOrtu">
                  NIK Orang Tua <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nikOrtu"
                  placeholder="16 digit angka"
                  maxLength={16}
                  {...form.register("nikOrtu")}
                />
                {form.formState.errors.nikOrtu && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.nikOrtu.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="noTelp">No. Telepon / WA (Opsional)</Label>
                <Input
                  id="noTelp"
                  type="tel"
                  placeholder="Contoh: 08123456789"
                  {...form.register("noTelp")}
                />
                {form.formState.errors.noTelp && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.noTelp.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION DATA LAHIR & WILAYAH */}
          <div className="rounded-lg border p-4 bg-muted/20">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Riwayat Lahir & Wilayah
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="beratLahirKg">
                  Berat Lahir (kg) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="beratLahirKg"
                  type="number"
                  step="0.1"
                  {...form.register("beratLahirKg")}
                />
                {form.formState.errors.beratLahirKg && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.beratLahirKg.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="panjangLahirCm">
                  Panjang Lahir (cm) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="panjangLahirCm"
                  type="number"
                  step="0.1"
                  {...form.register("panjangLahirCm")}
                />
                {form.formState.errors.panjangLahirCm && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.panjangLahirCm.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kelompokDasawisma">
                  Kelp. Dasawisma <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="kelompokDasawisma"
                  placeholder="Contoh: 01/06"
                  {...form.register("kelompokDasawisma")}
                />
                {form.formState.errors.kelompokDasawisma && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.kelompokDasawisma.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isEdit ? "Simpan Perubahan" : "Simpan Data"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
