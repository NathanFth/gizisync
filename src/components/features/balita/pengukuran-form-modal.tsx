'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/lib/store';
import { hitungZScore, getStatusGizi } from '@/lib/data/who-reference';
import { toast } from 'sonner';
import type { Balita } from '@/lib/data/types';
import { GiziStatusBadge } from '@/components/shared/status-badge';
import { Calculator } from 'lucide-react';

interface PengukuranFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balita: Balita;
}

export function PengukuranFormModal({ open, onOpenChange, balita }: PengukuranFormModalProps) {
  const addPengukuran = useStore((s) => s.addPengukuran);
  const today = new Date().toISOString().slice(0, 10);

  const [tanggal, setTanggal] = useState(today);
  const [beratBadan, setBeratBadan] = useState('');
  const [tinggiBadan, setTinggiBadan] = useState('');

  // Live Z-Score preview derived from inputs (no useEffect needed)
  const preview = useMemo<{ zBBU: number; zTBU: number; zBBTB: number } | null>(() => {
    const bb = parseFloat(beratBadan);
    const tb = parseFloat(tinggiBadan);
    if (!isNaN(bb) && !isNaN(tb) && bb > 0 && tb > 0) {
      const usiaBulan = balita.usiaBulan;
      const zBBU = hitungZScore(balita.jenisKelamin, 'BBU', usiaBulan, bb);
      const zTBU = hitungZScore(balita.jenisKelamin, 'TBU', usiaBulan, tb, tb);
      const zBBTB = hitungZScore(balita.jenisKelamin, 'BBTB', usiaBulan, bb, tb);
      return { zBBU, zTBU, zBBTB };
    }
    return null;
  }, [beratBadan, tinggiBadan, balita]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bb = parseFloat(beratBadan);
    const tb = parseFloat(tinggiBadan);
    if (isNaN(bb) || isNaN(tb) || bb <= 0 || tb <= 0) {
      toast.error('Mohon isi berat dan tinggi badan dengan valid');
      return;
    }
    addPengukuran({
      balitaId: balita.id,
      tanggalPengukuran: tanggal,
      usiaBulan: balita.usiaBulan,
      beratBadanKg: bb,
      tinggiBadanCm: tb,
    });
    toast.success('Pengukuran berhasil disimpan', {
      description: `${balita.namaLengkap}: BB ${bb}kg, TB ${tb}cm`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-emerald-600" />
            Input Pengukuran Baru
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="tanggal">Tanggal</Label>
              <Input id="tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="beratBadan">Berat Badan (kg)</Label>
              <Input
                id="beratBadan"
                type="number"
                step="0.1"
                placeholder="10.5"
                value={beratBadan}
                onChange={(e) => setBeratBadan(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tinggiBadan">Tinggi Badan (cm)</Label>
              <Input
                id="tinggiBadan"
                type="number"
                step="0.1"
                placeholder="82"
                value={tinggiBadan}
                onChange={(e) => setTinggiBadan(e.target.value)}
              />
            </div>
          </div>

          {/* Live Z-Score Preview */}
          {preview && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Hasil Otomatis (WHO LMS)
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'BB/U', z: preview.zBBU },
                  { label: 'TB/U', z: preview.zTBU },
                  { label: 'BB/TB', z: preview.zBBTB },
                ].map((item) => {
                  // BUG FIX (Fase 2.5): previously compared item.label === 'TBU'
                  // (without slash) but the actual label is 'TB/U' (with slash),
                  // so TB/U always fell through to the BBTB branch and was
                  // classified using the wrong WHO threshold table.
                  const indikator: 'BBU' | 'TBU' | 'BBTB' =
                    item.label === 'BB/U' ? 'BBU' : item.label === 'TB/U' ? 'TBU' : 'BBTB';
                  const status = getStatusGizi(item.z, indikator);
                  return (
                    <div key={item.label} className="rounded-lg bg-muted/50 p-2.5 text-center">
                      <p className="text-[10px] font-medium text-muted-foreground">{item.label}</p>
                      <p className="mt-0.5 font-mono text-lg font-bold text-foreground">
                        {isNaN(item.z) ? '—' : `${item.z > 0 ? '+' : ''}${item.z.toFixed(2)}`}
                      </p>
                      <div className="mt-1">
                        <GiziStatusBadge status={status.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              Simpan Pengukuran
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
