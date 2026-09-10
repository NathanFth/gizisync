"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { hitungZScore, getStatusGizi } from "@/lib/data/who-reference";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GiziStatusBadge } from "@/components/shared/status-badge";
import {
  Calculator,
  Baby,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import type {
  JenisKelamin,
  IndikatorZScore,
  StatusGizi,
} from "@/lib/data/types";

interface HasilIndikator {
  zScore: number;
  status: ReturnType<typeof getStatusGizi>;
}

export function KalkulatorView() {
  const { balitaList, addPengukuran } = useStore();

  const today = new Date().toISOString().slice(0, 10);

  const [selectedBalitaId, setSelectedBalitaId] = useState<string>("");
  const [jenisKelamin, setJenisKelamin] = useState<JenisKelamin>("Laki-laki");
  const [tanggal, setTanggal] = useState(today);
  const [umurBulan, setUmurBulan] = useState("");
  const [beratBadan, setBeratBadan] = useState("");
  const [tinggiBadan, setTinggiBadan] = useState("");
  const [lingkarKepala, setLingkarKepala] = useState("");
  const [lila, setLila] = useState("");
  const [isOptionalOpen, setIsOptionalOpen] = useState(false);
  const [hasil, setHasil] = useState<{
    bbu: HasilIndikator;
    tbu: HasilIndikator;
    bbtb: HasilIndikator;
    imtu: HasilIndikator;
    lka: HasilIndikator | null;
    lila: HasilIndikator | null;
  } | null>(null);

  const selectedBalita = useMemo(
    () => balitaList.find((b) => String(b.id) === String(selectedBalitaId)),
    [balitaList, selectedBalitaId],
  );

  const handleSelectBalita = (id: string) => {
    setSelectedBalitaId(id);
    if (id === "manual") {
      return;
    }
    const b = balitaList.find((x) => String(x.id) === String(id));
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
      toast.error("Usia harus antara 0-60 bulan");
      return;
    }
    if (isNaN(bb) || bb <= 0) {
      toast.error("Berat badan tidak valid");
      return;
    }
    if (isNaN(tb) || tb <= 0) {
      toast.error("Tinggi badan tidak valid");
      return;
    }

    const zBBU = hitungZScore(jenisKelamin, "BBU", umur, bb);
    const zTBU = hitungZScore(jenisKelamin, "TBU", umur, tb, tb);
    const zBBTB = hitungZScore(jenisKelamin, "BBTB", umur, bb, tb);
    const zIMTU = hitungZScore(jenisKelamin, "IMTU", umur, bb, tb);

    if (isNaN(zBBU) || isNaN(zTBU) || isNaN(zBBTB) || isNaN(zIMTU)) {
      toast.error("Nilai pengukuran di luar rentang WHO", {
        description: "Pastikan tinggi badan 45-120 cm dan usia 0-60 bulan",
      });
      return;
    }

    // LKA & LiLA bersifat opsional — kosong berarti tidak diukur, bukan error.
    let zLKA: number | null = null;
    if (lingkarKepala.trim() !== "") {
      const lkaVal = parseFloat(lingkarKepala);
      if (isNaN(lkaVal) || lkaVal <= 0) {
        toast.error("Lingkar kepala tidak valid");
        return;
      }
      zLKA = hitungZScore(jenisKelamin, "LKA", umur, lkaVal);
      if (isNaN(zLKA)) {
        toast.error("Lingkar kepala di luar rentang WHO", {
          description: "Standar LKA WHO berlaku untuk usia 0-60 bulan",
        });
        return;
      }
    }

    let zLILA: number | null = null;
    if (lila.trim() !== "") {
      const lilaVal = parseFloat(lila);
      if (isNaN(lilaVal) || lilaVal <= 0) {
        toast.error("Lingkar lengan (LiLA) tidak valid");
        return;
      }
      zLILA = hitungZScore(jenisKelamin, "LILA", umur, lilaVal);
      if (isNaN(zLILA)) {
        toast.error("Lingkar lengan (LiLA) di luar rentang WHO", {
          description: "Standar LiLA WHO berlaku untuk usia 3-60 bulan",
        });
        return;
      }
    }

    setHasil({
      bbu: { zScore: zBBU, status: getStatusGizi(zBBU, "BBU") },
      tbu: { zScore: zTBU, status: getStatusGizi(zTBU, "TBU") },
      bbtb: { zScore: zBBTB, status: getStatusGizi(zBBTB, "BBTB") },
      imtu: { zScore: zIMTU, status: getStatusGizi(zIMTU, "IMTU") },
      lka:
        zLKA !== null
          ? { zScore: zLKA, status: getStatusGizi(zLKA, "LKA") }
          : null,
      lila:
        zLILA !== null
          ? { zScore: zLILA, status: getStatusGizi(zLILA, "LILA") }
          : null,
    });

    toast.success("Z-Score berhasil dihitung dengan standar WHO (LMS)");
  };

    const handleSimpan = () => {
    if (!hasil || !selectedBalita) {
      toast.error("Pilih balita terlebih dahulu untuk menyimpan pengukuran");
      return;
    }

    const lkaVal = parseFloat(lingkarKepala);
    const lilaVal = parseFloat(lila);

    addPengukuran({
      balitaId: selectedBalita.id,
      tanggalPengukuran: tanggal,
      usiaBulan: parseInt(umurBulan),
      beratBadanKg: parseFloat(beratBadan),
      tinggiBadanCm: parseFloat(tinggiBadan),
      lingkarKepalaCm: !isNaN(lkaVal) && lkaVal > 0 ? lkaVal : null,
      lilaCm: !isNaN(lilaVal) && lilaVal > 0 ? lilaVal : null,
    });
    toast.success("Pengukuran disimpan", {
      description: `${selectedBalita.namaLengkap} — BB ${beratBadan}kg, TB ${tinggiBadan}cm`,
    });
  };

    const handleReset = () => {
    setSelectedBalitaId("");
    setJenisKelamin("Laki-laki");
    setTanggal(today);
    setUmurBulan("24");
    setBeratBadan("12.0");
    setTinggiBadan("87");
    setLingkarKepala("");
    setLila("");
    setIsOptionalOpen(false);
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
              <h3 className="text-sm font-semibold text-foreground">
                Input Data Pengukuran
              </h3>
              <p className="text-xs text-muted-foreground">
                Z-Score dihitung dengan WHO LMS
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Balita selector */}
            <div className="space-y-1.5">
              <Label htmlFor="balita-select">Pilih Balita (opsional)</Label>
              <Select
                value={selectedBalitaId}
                onValueChange={handleSelectBalita}
              >
                <SelectTrigger id="balita-select">
                  <SelectValue placeholder="Input manual atau pilih balita" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">— Input Manual —</SelectItem>
                  {balitaList.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.namaLengkap} ({b.usiaBulan} bln,{" "}
                      {b.jenisKelamin === "Laki-laki" ? "L" : "P"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBalita && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  <Baby className="mr-1 inline h-3 w-3" />
                  {selectedBalita.namaLengkap} — {selectedBalita.jenisKelamin},{" "}
                  {selectedBalita.usiaBulan} bulan
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
                  <Label
                    htmlFor="calc-l"
                    className="cursor-pointer font-normal"
                  >
                    Laki-laki
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="calc-p" value="Perempuan" />
                  <Label
                    htmlFor="calc-p"
                    className="cursor-pointer font-normal"
                  >
                    Perempuan
                  </Label>
                </div>
              </RadioGroup>
            </div>

                        {/* Tanggal Pengukuran */}
            <div className="space-y-1.5">
              <Label htmlFor="tanggal-ukur">Tanggal Pengukuran</Label>
              <Input
                id="tanggal-ukur"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
              />
            </div>

            {/* Umur */}
            <div className="space-y-1.5">
              <Label htmlFor="umur">Usia (bulan)</Label>
              <Input
                id="umur"
                type="number"
                min={0}
                max={60}
                value={umurBulan}
                onChange={(e) => setUmurBulan(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Rentang valid: 0–60 bulan
              </p>
            </div>

            {/* BB & TB */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bb">Berat Badan (kg)</Label>
                <Input
                  id="bb"
                  type="number"
                  step="0.1"
                  value={beratBadan}
                  onChange={(e) => setBeratBadan(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tb">Tinggi Badan (cm)</Label>
                <Input
                  id="tb"
                  type="number"
                  step="0.1"
                  value={tinggiBadan}
                  onChange={(e) => setTinggiBadan(e.target.value)}
                />
              </div>
            </div>

            {/* Data Opsional (LKA & LiLA) */}
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
                    <Label htmlFor="calc-lka" className="text-muted-foreground">
                      Lingkar Kepala (cm)
                    </Label>
                    <Input
                      id="calc-lka"
                      type="number"
                      step="0.1"
                      placeholder=""
                      value={lingkarKepala}
                      onChange={(e) => setLingkarKepala(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="calc-lila"
                      className="text-muted-foreground"
                    >
                      Lingkar Lengan / LiLA (cm)
                    </Label>
                    <Input
                      id="calc-lila"
                      type="number"
                      step="0.1"
                      placeholder=""
                      value={lila}
                      onChange={(e) => setLila(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleHitung}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Calculator className="mr-2 h-4 w-4" /> Hitung Z-Score
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
                title="Reset"
              >
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
            <h3 className="text-sm font-semibold text-foreground">
              Hasil Z-Score akan muncul di sini
            </h3>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Isi formulir di sebelah kiri dan klik "Hitung Z-Score" untuk
              melihat hasil perhitungan berdasarkan standar WHO.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Result cards — 4 indikator wajib */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
              <ResultCard
                title="IMT/U"
                subtitle="Indeks Massa Tubuh / Umur"
                hasil={hasil.imtu}
              />
            </div>

            {/* Result cards — LKA & LiLA, hanya tampil jika diisi */}
            {(hasil.lka || hasil.lila) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {hasil.lka && (
                  <ResultCard
                    title="LKA"
                    subtitle="Lingkar Kepala / Umur"
                    hasil={hasil.lka}
                  />
                )}
                {hasil.lila && (
                  <ResultCard
                    title="LiLA"
                    subtitle="Lingkar Lengan Atas"
                    hasil={hasil.lila}
                  />
                )}
              </div>
            )}

            {/* Summary */}
            <Card className="p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <AlertCircle className="h-4 w-4 text-emerald-600" />{" "}
                Interpretasi Hasil
              </h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      BB/U (Berat Badan menurut Umur):
                    </span>{" "}
                    {hasil.bbu.status.label}. Z-Score ={" "}
                    <span className="font-mono font-semibold">
                      {hasil.bbu.zScore > 0 ? "+" : ""}
                      {hasil.bbu.zScore.toFixed(2)}
                    </span>
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      TB/U (Tinggi Badan menurut Umur):
                    </span>{" "}
                    {hasil.tbu.status.label}. Z-Score ={" "}
                    <span className="font-mono font-semibold">
                      {hasil.tbu.zScore > 0 ? "+" : ""}
                      {hasil.tbu.zScore.toFixed(2)}
                    </span>
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      BB/TB (Berat Badan menurut Tinggi):
                    </span>{" "}
                    {hasil.bbtb.status.label}. Z-Score ={" "}
                    <span className="font-mono font-semibold">
                      {hasil.bbtb.zScore > 0 ? "+" : ""}
                      {hasil.bbtb.zScore.toFixed(2)}
                    </span>
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      IMT/U (Indeks Massa Tubuh menurut Umur):
                    </span>{" "}
                    {hasil.imtu.status.label}. Z-Score ={" "}
                    <span className="font-mono font-semibold">
                      {hasil.imtu.zScore > 0 ? "+" : ""}
                      {hasil.imtu.zScore.toFixed(2)}
                    </span>
                  </p>
                </div>
                {hasil.lka && (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        LKA (Lingkar Kepala menurut Umur):
                      </span>{" "}
                      {hasil.lka.status.label}. Z-Score ={" "}
                      <span className="font-mono font-semibold">
                        {hasil.lka.zScore > 0 ? "+" : ""}
                        {hasil.lka.zScore.toFixed(2)}
                      </span>
                    </p>
                  </div>
                )}
                {hasil.lila && (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        LiLA (Lingkar Lengan Atas):
                      </span>{" "}
                      {hasil.lila.status.label}. Z-Score ={" "}
                      <span className="font-mono font-semibold">
                        {hasil.lila.zScore > 0 ? "+" : ""}
                        {hasil.lila.zScore.toFixed(2)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-3">
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  {/* FASE 2: Penghalusan Terminologi di Catatan */}
                  <strong>Catatan:</strong> Perhitungan menggunakan tabel LMS
                  (Lambda-Mu-Sigma) resmi WHO Child Growth Standards 2006. Kasus
                  Balita Pendek dideteksi dari TB/U, Gizi Kurang/Buruk dari
                  BB/TB, dan BB Kurang dari BB/U.
                </p>
              </div>
            </Card>

            {/* Save button */}
            {selectedBalita && (
              <Button
                onClick={handleSimpan}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="mr-2 h-4 w-4" /> Simpan ke Riwayat{" "}
                {selectedBalita.namaLengkap}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({
  title,
  subtitle,
  hasil,
}: {
  title: string;
  subtitle: string;
  hasil: HasilIndikator;
}) {
  const severityColors = [
    "border-l-emerald-500",
    "border-l-sky-500",
    "border-l-amber-500",
    "border-l-red-500",
  ];
  const color = severityColors[hasil.status.severity] ?? "border-l-gray-500";

  return (
    <Card className={`border-l-4 ${color} p-4`}>
      <div className="mb-2">
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="mb-2">
        <p className="font-mono text-2xl font-bold text-foreground">
          {hasil.zScore > 0 ? "+" : ""}
          {hasil.zScore.toFixed(2)}
        </p>
        <p className="text-[10px] text-muted-foreground">Z-Score (SD)</p>
      </div>
      <div className="space-y-1">
        {/* Type assertion untuk menyesuaikan dengan StatusGizi enum yang baru */}
        <GiziStatusBadge status={hasil.status.status as StatusGizi} />
        <p className="text-xs text-muted-foreground leading-tight">
          {hasil.status.label}
        </p>
      </div>
    </Card>
  );
}
