// =============================================================================
// types.ts — Single source of truth for all domain types (GiziSync Posyandu)
// =============================================================================

// --- Shared ---
export type JenisKelamin = 'Laki-laki' | 'Perempuan';

// --- Balita ---
export type StatusBalita = 'Aktif' | 'Tidak Aktif';

/** Reconciled gizi status vocabulary (matches WHO + Kemenkes RI).
 *  `'Di luar rentang WHO'` is a NEUTRAL sentinel — it does NOT claim the child
 *  is well-nourished; it only signals that no Z-Score could be derived because
 *  the measurement falls outside the WHO LMS reference range. */
export type StatusGizi =
  | 'Normal'
  | 'Stunting'
  | 'Severely Stunting'
  | 'Wasting'
  | 'Severely Wasting'
  | 'Gizi Lebih'
  | 'Obesitas'
  | 'Risiko Gizi Lebih'
  | 'Di luar rentang WHO';

export type StatusAlert = 'Warning' | 'Critical';

export interface Balita {
  id: number;
  nik: string;
  namaLengkap: string;
  tanggalLahir: string; // ISO 'YYYY-MM-DD'
  usiaBulan: number; // derived from tanggalLahir
  jenisKelamin: JenisKelamin;
  namaIbu: string;
  beratLahirKg: number;
  panjangLahirCm: number;
  riwayatPenyakit: string;
  alamat: string;
  status: StatusBalita;
}

export type IndikatorZScore = 'BBU' | 'TBU' | 'BBTB';

export interface PengukuranBalita {
  id: number;
  balitaId: number;
  tanggalPengukuran: string; // ISO 'YYYY-MM-DD'
  usiaBulan: number;
  beratBadanKg: number;
  tinggiBadanCm: number;
  zScoreBBU: number;
  zScoreTBU: number;
  zScoreBBTB: number;
  statusGizi: StatusGizi;
}

export interface ZScoreChartPoint {
  bulan: string;
  zScoreBBU: number | null;
  zScoreTBU: number | null;
  zScoreBBTB: number | null;
}

export interface PriorityAlert {
  id: number;
  namaBalita: string;
  usiaBulan: number;
  zScoreTerakhir: number;
  indikator: IndikatorZScore;
  statusAlert: StatusAlert;
}

// --- Ibu Hamil ---
export type StatusIbuHamil = 'Normal' | 'Risiko KEK';

export interface IbuHamil {
  id: number;
  nik: string;
  namaLengkap: string;
  usiaKehamilanMinggu: number;
  htp: string; // 'YYYY-MM-DD'
  lilaTerakCm: number;
  beratBadanKg?: number;
  tekananDarah?: string;
  status: StatusIbuHamil;
}

// --- Dashboard ---
export interface DashboardStats {
  totalBalita: number;
  perubahanBalitaBulanIni: number;
  totalIbuHamil: number;
  perubahanIbuHamilBulanIni: number;
  persentaseGiziBaik: number;
  /** Month-over-month delta of % gizi baik. `null` when no comparable
   *  historical data exists (so the UI can hide the trend indicator instead
   *  of displaying a misleading static number). */
  perubahanPersentaseGiziBaik: number | null;
  totalRisikoStunting: number;
}

export interface GiziDistribusiItem {
  nama: string;
  nilai: number;
  warna: string;
}

// --- Laporan ---
export type JenisPemeriksaan = 'Pengukuran Balita' | 'Pemeriksaan Ibu Hamil';
export type StatusLaporan = 'Normal' | 'Perlu Tindakan';

export interface LaporanRecord {
  id: number;
  nik: string;
  nama: string;
  jenisPemeriksaan: JenisPemeriksaan;
  hasilUkur: string;
  status: StatusLaporan;
  keterangan: string;
  bulan: number;
  tahun: number;
}

export interface LaporanStats {
  totalBalitaDitimbang: number;
  kasusStuntingBaru: number;
  ibuHamilKEK: number;
}

// --- Pengaturan ---
export interface ProfilKader {
  namaLengkap: string;
  username: string;
  nomorTelepon: string;
  email: string;
  peran: string;
}

export interface DataPosyandu {
  namaPosyandu: string;
  namaKetua: string;
  alamatLengkap: string;
  kelurahan: string;
  kecamatan: string;
}

export interface PengaturanData {
  profil: ProfilKader;
  posyandu: DataPosyandu;
}

// --- Imunisasi ---
/** Jenis vaksin imunisasi sesuai program PD3I (Program Pengembangan Imunisasi) */
export type JenisVaksin =
  | 'BCG'
  | 'Hepatitis B 0'
  | 'Polio 1'
  | 'Polio 2'
  | 'Polio 3'
  | 'Polio 4'
  | 'DPT-HB-Hib 1'
  | 'DPT-HB-Hib 2'
  | 'DPT-HB-Hib 3'
  | 'Campak'
  | 'MR'
  | 'PCV'
  | 'Rotavirus';

export type StatusImunisasi = 'Lengkap' | 'Belum Lengkap' | 'Terlambat' | 'Belum Dimulai';

export interface ImunisasiRecord {
  id: number;
  balitaId: number;
  jenisVaksin: JenisVaksin;
  tanggalPemberian: string; // ISO 'YYYY-MM-DD'
  usiaSaatPemberianBulan: number;
  petugas: string;
  catatan: string;
}

/** Jadwal imunisasi standar Kemenkes RI (usia pemberian dalam bulan) */
export interface JadwalImunisasi {
  jenisVaksin: JenisVaksin;
  usiaMinimalBulan: number;
  usiaMaksimalBulan: number;
  deskripsi: string;
}

// --- View types (referenced by Notifikasi, defined here to avoid circular import) ---
export type AppViewType =
  | 'dashboard'
  | 'balita'
  | 'balita-detail'
  | 'kalkulator'
  | 'ibu-hamil'
  | 'ibu-hamil-detail'
  | 'laporan'
  | 'pengaturan'
  | 'imunisasi'
  | 'vitamin-a'
  | 'pmt'
  | 'jadwal'
  | 'analitik';

// --- ANC (Antenatal Care) visits for Ibu Hamil ---
export type JenisPemeriksaanANC = 'K1' | 'K2' | 'K3' | 'K4' | 'KF' | 'PN' | 'KF2';

export interface KunjunganANC {
  id: number;
  ibuHamilId: number;
  jenis: JenisPemeriksaanANC;
  tanggalKunjungan: string; // ISO
  usiaKehamilanMinggu: number;
  beratBadanKg: number;
  tekananDarah: string;
  lilaCm: number;
  tinggiFundusCm?: number;
  denyutJantungJanin?: number;
  catatan: string;
  petugas: string;
}

// --- Vitamin A ---
export type TargetVitaminA = 'Balita' | 'Ibu Hamil';
export type StatusVitaminA = 'Diberikan' | 'Belum Diberikan';

export interface VitaminARecord {
  id: number;
  target: TargetVitaminA;
  targetId: number; // balitaId or ibuHamilId
  namaPenerima: string;
  tanggalPemberian: string; // ISO
  dosis: string; // e.g. '200.000 IU' (biru) or '100.000 IU' (merah)
  periode: 'Februari' | 'Agustus'; // Posyandu distributes Vit A twice a year
  tahun: number;
  petugas: string;
  catatan: string;
}

// --- Notifikasi ---
export type TipeNotifikasi = 'alert' | 'info' | 'success' | 'reminder';

export interface Notifikasi {
  id: number;
  tipe: TipeNotifikasi;
  judul: string;
  pesan: string;
  timestamp: string; // ISO datetime
  dibaca: boolean;
  linkView?: AppViewType;
  linkId?: number;
}

// --- Auth ---
export interface AuthUser {
  username: string;
  namaLengkap: string;
  peran: string;
  loginAt: string;
}

// --- PMT (Pemberian Makanan Tambahan) ---
export type JenisPMT = 'Biscuit PMT' | 'Berbagai Makanan Lokal' | 'Suplementasi Gizi' | 'MP-ASI';
export type StatusPMT = 'Aktif' | 'Selesai' | 'Dihentikan';

export interface PMTRecord {
  id: number;
  balitaId: number;
  namaBalita: string;
  jenisPMT: JenisPMT;
  tanggalMulai: string; // ISO
  tanggalSelesai?: string; // ISO, optional
  jumlahHari: number;
  beratAwalKg: number;
  beratAkhirKg?: number;
  alasan: 'Stunting' | 'Wasting' | 'Underweight' | 'Risiko KEK' | 'Gizi Kurang';
  status: StatusPMT;
  petugas: string;
  catatan: string;
}

// --- Jadwal Posyandu (Schedule) ---
export type JenisKegiatan =
  | 'Posyandu Rutin'
  | 'Penimbangan Balita'
  | 'Pemberian Imunisasi'
  | 'Pemberian Vitamin A'
  | 'Pemberian PMT'
  | 'Penyuluhan Gizi'
  | 'Pemeriksaan Ibu Hamil'
  | 'Posyandu Balita'
  | 'Posyandu Lansia';

export type StatusJadwal = 'Terjadwal' | 'Berlangsung' | 'Selesai' | 'Dibatalkan';

export interface JadwalPosyandu {
  id: number;
  tanggal: string; // ISO date
  jamMulai: string; // 'HH:mm'
  jamSelesai: string; // 'HH:mm'
  jenisKegiatan: JenisKegiatan;
  judul: string;
  lokasi: string;
  pic: string; // person in charge
  catatan: string;
  status: StatusJadwal;
}
