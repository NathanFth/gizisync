"use client";

import { useState, useMemo, useEffect } from "react";
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
import { useStore } from "@/lib/store";
import { hitungZScore, getStatusGizi } from "@/lib/data/who-reference";
import { toast } from "sonner";
import type { Balita, PengukuranBalita } from "@/lib/data/types";
import { GiziStatusBadge } from "@/components/shared/status-badge";
import {
  Calculator,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface PengukuranFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balita: Balita;
  // FASE BARU: Menerima data pengukuran lama jika mode Edit
  pengukuran?: PengukuranBalita | null;
}

export function PengukuranFormModal({
  open,
  onOpenChange,
  balita,
  pengukuran,
}: PengukuranFormModalProps) {
  const addPengukuran = useStore((s) => s.addPengukuran);
  const updatePengukuran = useStore((s) => s.updatePengukuran); // Hook untuk edit
  const today = new Date().toISOString().slice(0, 10);
  const isEdit = !!pengukuran; // Flag penanda mode

  // State untuk Data Wajib
  const [tanggal, setTanggal] = useState(today);
  const [beratBadan, setBeratBadan] = useState("");
  const [tinggiBadan, setTinggiBadan] = useState("");

  // State untuk Data Opsional (LKA & LiLA)
  const [lingkarKepala, setLingkarKepala] = useState("");
  const [lila, setLila] = useState("");
  const [isOptionalOpen, setIsOptionalOpen] = useState(false);

  // FASE BARU: CCTV untuk me-reset isi form saat mode berubah
  useEffect(() => {
    if (open) {
      if (pengukuran) {
        setTanggal(pengukuran.tanggalPengukuran);
        setBeratBadan(String(pengukuran.beratBadanKg));
        setTinggiBadan(String(pengukuran.tinggiBadanCm));
        setLingkarKepala(
          pengukuran.lingkarKepalaCm ? String(pengukuran.lingkarKepalaCm) : "",
        );
        setLila(pengukuran.lilaCm ? String(pengukuran.lilaCm) : "");
        setIsOptionalOpen(!!pengukuran.lingkarKepalaCm || !!pengukuran.lilaCm);
      } else {
        setTanggal(today);
        setBeratBadan("");
        setTinggiBadan("");
        setLingkarKepala("");
        setLila("");
        setIsOptionalOpen(false);
      }
    }
  }, [open, pengukuran, today]);

  // Live Z-Score preview derived from inputs
  const preview = useMemo<{
    zBBU: number;
    zTBU: number;
    zBBTB: number;
    zIMTU: number;
    zLKA: number | null;
    zLILA: number | null;
  } | null>(() => {
    // PROTEKSI NULL: Mesin WHO tidak bisa menghitung jika jenis kelamin null
    if (!balita.jenisKelamin) return null;

    const bb = parseFloat(beratBadan);
    const tb = parseFloat(tinggiBadan);

    if (!isNaN(bb) && !isNaN(tb) && bb > 0 && tb > 0) {
      // Jika edit dan tanggal tidak berubah (atau klien percaya hitungan lama), pakai umur dari data.
      // Namun demi keamanan preview, kita pinjam balita.usiaBulan (asumsi UI tidak perlu se-akurat Server)
      const usiaBulan = pengukuran ? pengukuran.usiaBulan : balita.usiaBulan;

      const zBBU = hitungZScore(balita.jenisKelamin, "BBU", usiaBulan, bb);
      const zTBU = hitungZScore(balita.jenisKelamin, "TBU", usiaBulan, tb, tb);
      const zBBTB = hitungZScore(
        balita.jenisKelamin,
        "BBTB",
        usiaBulan,
        bb,
        tb,
      );
      const zIMTU = hitungZScore(
        balita.jenisKelamin,
        "IMTU",
        usiaBulan,
        bb,
        tb,
      );

      let zLKA: number | null = null;
      let zLILA: number | null = null;

      const lkaVal = parseFloat(lingkarKepala);
      if (!isNaN(lkaVal) && lkaVal > 0) {
        zLKA = hitungZScore(balita.jenisKelamin, "LKA", usiaBulan, lkaVal);
      }

      const lilaVal = parseFloat(lila);
      if (!isNaN(lilaVal) && lilaVal > 0) {
        zLILA = hitungZScore(balita.jenisKelamin, "LILA", usiaBulan, lilaVal);
      }

      return { zBBU, zTBU, zBBTB, zIMTU, zLKA, zLILA };
    }
    return null;
  }, [beratBadan, tinggiBadan, lingkarKepala, lila, balita, pengukuran]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bb = parseFloat(beratBadan);
    const tb = parseFloat(tinggiBadan);

    if (isNaN(bb) || isNaN(tb) || bb <= 0 || tb <= 0) {
      toast.error("Mohon isi berat dan tinggi badan dengan valid");
      return;
    }

    const payload: any = {
      balitaId: String(balita.id),
      tanggalPengukuran: tanggal,
      // UsiaBulan tetap dikirim tapi akan ditimpa oleh Server-Side Calculation (Route API)
      usiaBulan: pengukuran ? pengukuran.usiaBulan : balita.usiaBulan,
      beratBadanKg: bb,
      tinggiBadanCm: tb,
    };

    // Kirim null (bukan undefined) jika dikosongkan secara sengaja oleh kader saat Edit
    const lkaVal = parseFloat(lingkarKepala);
    payload.lingkarKepalaCm = !isNaN(lkaVal) && lkaVal > 0 ? lkaVal : null;

    const lilaVal = parseFloat(lila);
    payload.lilaCm = !isNaN(lilaVal) && lilaVal > 0 ? lilaVal : null;

    try {
      if (isEdit && pengukuran) {
        await updatePengukuran(String(pengukuran.id), payload);
        toast.success("Pengukuran berhasil diperbarui", {
          description: `Koreksi: BB ${bb}kg, TB ${tb}cm`,
        });
      } else {
        await addPengukuran(payload);
        toast.success("Pengukuran berhasil disimpan", {
          description: `${balita.namaLengkap}: BB ${bb}kg, TB ${tb}cm`,
        });
      }

      onOpenChange(false);
      setLingkarKepala("");
      setLila("");
      setIsOptionalOpen(false);
    } catch (error: any) {
      console.error("Error saat menyimpan data pengukuran:", error);
      toast.error("Gagal menyimpan pengukuran", {
        description: error.message || "Terjadi kesalahan pada sistem.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-emerald-600" />
            {isEdit ? "Edit Riwayat Pengukuran" : "Input Pengukuran Baru"}
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 rounded-lg bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">
            Balita:{" "}
            <span className="font-semibold text-foreground">
              {balita.namaLengkap}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {balita.jenisKelamin || "Gender belum diisi"} ·{" "}
            {pengukuran ? pengukuran.usiaBulan : balita.usiaBulan} bulan
          </p>
        </div>

        {!balita.jenisKelamin && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>
              Jenis kelamin balita belum diisi. Kalkulasi Z-Score otomatis
              dinonaktifkan karena mesin WHO membutuhkan data gender. Silakan
              isi pengukuran seperti biasa, lalu lengkapi profil gender balita
              nanti.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Data Wajib */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="tanggal">Tanggal</Label>
              <Input
                id="tanggal"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="beratBadan">Berat Badan (kg)*</Label>
              <Input
                id="beratBadan"
                type="number"
                step="0.1"
                placeholder="10.5"
                value={beratBadan}
                onChange={(e) => setBeratBadan(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tinggiBadan">Tinggi Badan (cm)*</Label>
              <Input
                id="tinggiBadan"
                type="number"
                step="0.1"
                placeholder="82"
                value={tinggiBadan}
                onChange={(e) => setTinggiBadan(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Data Opsional (Collapsible) */}
          <div className="rounded-lg border border-border">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg bg-muted/30 px-4 py-2.5 text-sm font-medium hover:bg-muted/50"
              onClick={() => setIsOptionalOpen(!isOptionalOpen)}
            >
              <span>Data Opsional (LKA & LiLA)</span>
              {isOptionalOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {isOptionalOpen && (
              <div className="grid grid-cols-1 gap-4 p-4 pt-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="lingkarKepala"
                    className="text-muted-foreground"
                  >
                    Lingkar Kepala (cm)
                  </Label>
                  <Input
                    id="lingkarKepala"
                    type="number"
                    step="0.1"
                    placeholder="Contoh: 45.2"
                    value={lingkarKepala}
                    onChange={(e) => setLingkarKepala(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lila" className="text-muted-foreground">
                    Lingkar Lengan (cm)
                  </Label>
                  <Input
                    id="lila"
                    type="number"
                    step="0.1"
                    placeholder="Contoh: 14.5"
                    value={lila}
                    onChange={(e) => setLila(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Live Z-Score Preview */}
          {preview && (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Live Preview (Standar WHO)
              </p>

              {/* Grid 4 Kotak Utama */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "BB/U", z: preview.zBBU, indikator: "BBU" },
                  { label: "TB/U", z: preview.zTBU, indikator: "TBU" },
                  { label: "BB/TB", z: preview.zBBTB, indikator: "BBTB" },
                  { label: "IMT/U", z: preview.zIMTU, indikator: "IMTU" },
                ].map((item) => {
                  const status = getStatusGizi(item.z, item.indikator as any);
                  return (
                    <div
                      key={item.label}
                      className="rounded-lg border border-background bg-background/60 p-2.5 text-center shadow-sm"
                    >
                      <p className="text-[10px] font-medium text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="mt-0.5 font-mono text-lg font-bold text-foreground">
                        {isNaN(item.z)
                          ? "—"
                          : `${item.z > 0 ? "+" : ""}${item.z.toFixed(2)}`}
                      </p>
                      <div className="mt-1 flex justify-center">
                        <GiziStatusBadge status={status.status} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tambahan Baris untuk LKA & LiLA jika diisi */}
              {(preview.zLKA !== null || preview.zLILA !== null) && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {preview.zLKA !== null && (
                    <div className="flex-1 rounded-lg border border-background bg-background/60 p-2.5 text-center shadow-sm">
                      <p className="text-[10px] font-medium text-muted-foreground">
                        LKA
                      </p>
                      <p className="mt-0.5 font-mono text-base font-bold text-foreground">
                        {isNaN(preview.zLKA)
                          ? "—"
                          : `${preview.zLKA > 0 ? "+" : ""}${preview.zLKA.toFixed(2)}`}
                      </p>
                      <div className="mt-1 flex justify-center">
                        <GiziStatusBadge
                          status={getStatusGizi(preview.zLKA, "LKA").status}
                        />
                      </div>
                    </div>
                  )}
                  {preview.zLILA !== null && (
                    <div className="flex-1 rounded-lg border border-background bg-background/60 p-2.5 text-center shadow-sm">
                      <p className="text-[10px] font-medium text-muted-foreground">
                        LiLA
                      </p>
                      <p className="mt-0.5 font-mono text-base font-bold text-foreground">
                        {isNaN(preview.zLILA)
                          ? "—"
                          : `${preview.zLILA > 0 ? "+" : ""}${preview.zLILA.toFixed(2)}`}
                      </p>
                      <div className="mt-1 flex justify-center">
                        <GiziStatusBadge
                          status={getStatusGizi(preview.zLILA, "LILA").status}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
              {isEdit ? "Simpan Perubahan" : "Simpan Pengukuran"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
