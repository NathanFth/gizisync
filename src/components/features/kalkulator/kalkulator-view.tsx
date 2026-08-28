'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { hitungZScore, getStatusGizi } from '@/lib/data/who-reference';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GiziStatusBadge } from '@/components/shared/status-badge';
import { Calculator, Baby, TrendingUp, AlertCircle, CheckCircle2, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { JenisKelamin, IndikatorZScore, StatusGizi } from '@/lib/data/types';

interface HasilIndikator {
  zScore: number;
  status: ReturnType<typeof getStatusGizi>;
}

export function KalkulatorView() {
  const { balitaList, addPengukuran } = useStore();

  const [selectedBalitaId, setSelectedBalitaId] = useState<string>('');
  const [jenisKelamin, setJenisKelamin] = useState<JenisKelamin>('Laki-laki');
  const [umurBulan, setUmurBulan] = useState('24');
  const [beratBadan, setBeratBadan] = useState('12.0');
  const [tinggiBadan, setTinggiBadan] = useState('87');
  const [hasil, setHasil] = useState<{
    bbu: HasilIndikator;
    tbu: HasilIndikator;
    bbtb: HasilIndikator;
  } | null>(null);

  const selectedBalita = useMemo(
    () => balitaList.find((b) => b.id === Number(selectedBalitaId)),
    [balitaList, selectedBalitaId],
  );

  const handleSelectBalita = (id: string) => {
    setSelectedBalitaId(id);
    if (id === 'manual') {
      return;
    }
    const b = balitaList.find((x) => x.id === Number(id));
    if (b) {
      setJenisKelamin(b.jenisKelamin as JenisKelamin);
      setUmurBulan(String(b.usiaBulan));
      toast.info(`Data ${b.namaLengkap} dimuat`, {
        description: `Silakan isi berat & tinggi badan hasil pengukuran`,
      });
    }
  };

  const handleHitung = () => {
    const umur = parseInt(umurBulan);
    const bb = parseFloat(beratBadan);
    const tb = parseFloat(tinggiBadan);

    if (isNaN(umur) || umur < 0 || umur > 60) {
      toast.error('Usia harus antara 0-60 bulan');
      return;
    }
    if (isNaN(bb) || bb <= 0) {
      toast.error('Berat badan tidak valid');
      return;
    }
    if (isNaN(tb) || tb <= 0) {
      toast.error('Tinggi badan tidak valid');
      return;
    }

    const zBBU = hitungZScore(jenisKelamin, 'BBU', umur, bb);
    const zTBU = hitungZScore(jenisKelamin, 'TBU', umur, tb, tb);
    const zBBTB = hitungZScore(jenisKelamin, 'BBTB', umur, bb, tb);

    if (isNaN(zBBU) || isNaN(zTBU) || isNaN(zBBTB)) {
      toast.error('Nilai pengukuran di luar rentang WHO', {
        description: 'Pastikan tinggi badan 45-120 cm dan usia 0-60 bulan',
      });
      return;
    }

    setHasil({
      bbu: { zScore: zBBU, status: getStatusGizi(zBBU, 'BBU') },
      tbu: { zScore: zTBU, status: getStatusGizi(zTBU, 'TBU') },
      bbtb: { zScore: zBBTB, status: getStatusGizi(zBBTB, 'BBTB') },
    });

    toast.success('Z-Score berhasil dihitung dengan standar WHO (LMS)');
  };

  const handleSimpan = () => {
    if (!hasil || !selectedBalita) {
      toast.error('Pilih balita terlebih dahulu untuk menyimpan pengukuran');
      return;
    }
    addPengukuran({
      balitaId: selectedBalita.id,
      tanggalPengukuran: new Date().toISOString().slice(0, 10),
      usiaBulan: parseInt(umurBulan),
      beratBadanKg: parseFloat(beratBadan),
      tinggiBadanCm: parseFloat(tinggiBadan),
    } as any);
    toast.success('Pengukuran disimpan', {
      description: `${selectedBalita.namaLengkap} — BB ${beratBadan}kg, TB ${tinggiBadan}cm`,
    });
  };

  const handleReset = () => {
    setSelectedBalitaId('');
    setJenisKelamin('Laki-laki');
    setUmurBulan('24');
    setBeratBadan('12.0');
    setTinggiBadan('87');
    setHasil(null);
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
      {/* Input Form */}
      <div className="lg:col-span-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
              <Calculator className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Input Data Pengukuran</h3>
              <p className="text-xs text-muted-foreground">Z-Score dihitung dengan WHO LMS</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Balita selector */}
            <div className="space-y-1.5">
              <Label htmlFor="balita-select">Pilih Balita (opsional)</Label>
              <Select value={selectedBalitaId} onValueChange={handleSelectBalita}>
                <SelectTrigger id="balita-select">
                  <SelectValue placeholder="Input manual atau pilih balita" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">— Input Manual —</SelectItem>
                  {balitaList.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.namaLengkap} ({b.usiaBulan} bln, {b.jenisKelamin === 'Laki-laki' ? 'L' : 'P'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBalita && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  <Baby className="mr-1 inline h-3 w-3" />
                  {selectedBalita.namaLengkap} — {selectedBalita.jenisKelamin}, {selectedBalita.usiaBulan} bulan
                </p>
              )}
            </div>

            {/* Jenis Kelamin */}
            <div className="space-y-1.5">
              <Label>Jenis Kelamin</Label>
              <RadioGroup
                value={jenisKelamin}
                onValueChange={(v) => setJenisKelamin(v as JenisKelamin)}
                className="flex gap-4 pt-1"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="calc-l" value="Laki-laki" />
                  <Label htmlFor="calc-l" className="cursor-pointer font-normal">Laki-laki</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="calc-p" value="Perempuan" />
                  <Label htmlFor="calc-p" className="cursor-pointer font-normal">Perempuan</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Umur */}
            <div className="space-y-1.5">
              <Label htmlFor="umur">Usia (bulan)</Label>
              <Input id="umur" type="number" min={0} max={60} value={umurBulan} onChange={(e) => setUmurBulan(e.target.value)} />
              <p className="text-xs text-muted-foreground">Rentang valid: 0–60 bulan</p>
            </div>

            {/* BB & TB */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bb">Berat Badan (kg)</Label>
                <Input id="bb" type="number" step="0.1" value={beratBadan} onChange={(e) => setBeratBadan(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tb">Tinggi Badan (cm)</Label>
                <Input id="tb" type="number" step="0.1" value={tinggiBadan} onChange={(e) => setTinggiBadan(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleHitung} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <Calculator className="mr-2 h-4 w-4" /> Hitung Z-Score
              </Button>
              <Button variant="outline" size="icon" onClick={handleReset} title="Reset">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Results */}
      <div className="lg:col-span-3">
        {!hasil ? (
          <Card className="flex h-full min-h-[400px] flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Hasil Z-Score akan muncul di sini</h3>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Isi formulir di sebelah kiri dan klik "Hitung Z-Score" untuk melihat hasil perhitungan berdasarkan standar WHO.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Result cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ResultCard
                title="BB/U"
                subtitle="Berat Badan / Umur"
                hasil={hasil.bbu}
              />
              <ResultCard
                title="TB/U"
                subtitle="Tinggi Badan / Umur"
                hasil={hasil.tbu}
              />
              <ResultCard
                title="BB/TB"
                subtitle="Berat Badan / Tinggi"
                hasil={hasil.bbtb}
              />
            </div>

            {/* Summary */}
            <Card className="p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <AlertCircle className="h-4 w-4 text-emerald-600" /> Interpretasi Hasil
              </h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">BB/U (Berat Badan menurut Umur):</span>{' '}
                    {hasil.bbu.status.label}. Z-Score = <span className="font-mono font-semibold">{hasil.bbu.zScore > 0 ? '+' : ''}{hasil.bbu.zScore.toFixed(2)}</span>
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">TB/U (Tinggi Badan menurut Umur):</span>{' '}
                    {hasil.tbu.status.label}. Z-Score = <span className="font-mono font-semibold">{hasil.tbu.zScore > 0 ? '+' : ''}{hasil.tbu.zScore.toFixed(2)}</span>
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">BB/TB (Berat Badan menurut Tinggi):</span>{' '}
                    {hasil.bbtb.status.label}. Z-Score = <span className="font-mono font-semibold">{hasil.bbtb.zScore > 0 ? '+' : ''}{hasil.bbtb.zScore.toFixed(2)}</span>
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-3">
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  {/* FASE 2: Penghalusan Terminologi di Catatan */}
                  <strong>Catatan:</strong> Perhitungan menggunakan tabel LMS (Lambda-Mu-Sigma) resmi WHO Child Growth Standards 2006. Kasus Balita Pendek dideteksi dari TB/U, Gizi Kurang/Buruk dari BB/TB, dan BB Kurang dari BB/U.
                </p>
              </div>
            </Card>

            {/* Save button */}
            {selectedBalita && (
              <Button onClick={handleSimpan} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Save className="mr-2 h-4 w-4" /> Simpan ke Riwayat {selectedBalita.namaLengkap}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ title, subtitle, hasil }: { title: string; subtitle: string; hasil: HasilIndikator }) {
  const severityColors = [
    'border-l-emerald-500',
    'border-l-sky-500',
    'border-l-amber-500',
    'border-l-red-500',
  ];
  const color = severityColors[hasil.status.severity] ?? 'border-l-gray-500';

  return (
    <Card className={`border-l-4 ${color} p-4`}>
      <div className="mb-2">
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="mb-2">
        <p className="font-mono text-2xl font-bold text-foreground">
          {hasil.zScore > 0 ? '+' : ''}{hasil.zScore.toFixed(2)}
        </p>
        <p className="text-[10px] text-muted-foreground">Z-Score (SD)</p>
      </div>
      <div className="space-y-1">
        {/* Type assertion untuk menyesuaikan dengan StatusGizi enum yang baru */}
        <GiziStatusBadge status={hasil.status.status as StatusGizi} />
        <p className="text-xs text-muted-foreground leading-tight">{hasil.status.label}</p>
      </div>
    </Card>
  );
}