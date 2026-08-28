// =============================================================================
// types.ts — Single source of truth for all domain types (GiziSync Posyandu)
// =============================================================================

// --- Shared ---
export type JenisKelamin = "Laki-laki" | "Perempuan";

// --- Balita ---
export type StatusBalita = "Aktif" | "Lulus" | "Pindah" | "Meninggal";

/** Reconciled gizi status vocabulary (Matches WHO LMS thresholds,
 *  but using Kemenkes RI culturally-sensitive labels as requested by Posyandu).
 *  `'Di luar rentang WHO'` is a NEUTRAL sentinel. */
export type StatusGizi =
  | "Normal"
  | "BB Kurang"
  | "BB Lebih"
  | "Pendek"
  | "Tinggi"
  | "Gizi Buruk"
  | "Gizi Kurang"
  | "Berisiko Gizi Lebih"
  | "Gizi Lebih"
  | "Mikrosefali"
  | "Makrosefali"
  | "Di luar rentang WHO";

export type StatusAlert = "Warning" | "Critical";

export interface Balita {
  id: string | number;
  nik: string | null;
  namaLengkap: string;
  tanggalLahir: string; // ISO 'YYYY-MM-DD'
  usiaBulan: number; // derived from tanggalLahir
  jenisKelamin: JenisKelamin | null;
  namaIbu: string | null;
  namaAyah: string | null;
  nikOrtu: string | null;
  kelompokDasawisma: string | null;
  beratLahirKg: number | null;
  panjangLahirCm: number | null;
  noTelp: string | null;
  alamat: string | null;
  status: StatusBalita;
  sumberData: "INPUT_MANUAL" | "IMPOR_EXCEL";
  catatanValidasi: string | null;
}

export type IndikatorZScore = "BBU" | "TBU" | "BBTB" | "IMTU" | "LKA" | "LILA";

export interface PengukuranBalita {
  id: string;
  balitaId: string | number;
  tanggalPengukuran: string; // ISO 'YYYY-MM-DD'
  usiaBulan: number;
  beratBadanKg: number;
  tinggiBadanCm: number;
  lingkarKepalaCm?: number | null;
  lilaCm?: number | null;
  zScoreBBU: number | null;
  zScoreTBU: number | null;
  zScoreBBTB: number | null;
  zScoreIMTU: number | null;
  zScoreLKA: number | null;
  zScoreLILA: number | null;
  statusGizi: string | null;
}

export interface ZScoreChartPoint {
  bulan: string;
  zScoreBBU: number | null;
  zScoreTBU: number | null;
  zScoreBBTB: number | null;
}

export interface PriorityAlert {
  id: string | number;
  namaBalita: string;
  usiaBulan: number;
  zScoreTerakhir: number;
  indikator: IndikatorZScore;
  statusAlert: StatusAlert;
}

// --- Ibu Hamil ---
export type StatusIbuHamil = "Normal" | "Risiko KEK";

export interface IbuHamil {
  id: string | number;
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
  perubahanPersentaseGiziBaik: number | null;
  totalRisikoStunting: number;
}

export interface GiziDistribusiItem {
  nama: string;
  nilai: number;
  warna: string;
}

// --- Laporan ---
export type JenisPemeriksaan = "Pengukuran Balita" | "Pemeriksaan Ibu Hamil";
export type StatusLaporan = "Normal" | "Perlu Tindakan";

export interface LaporanRecord {
  id: string | number;
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
export type JenisVaksin =
  | "BCG"
  | "Hepatitis B 0"
  | "Polio 1"
  | "Polio 2"
  | "Polio 3"
  | "Polio 4"
  | "DPT-HB-Hib 1"
  | "DPT-HB-Hib 2"
  | "DPT-HB-Hib 3"
  | "Campak"
  | "MR"
  | "PCV"
  | "Rotavirus";

export type StatusImunisasi =
  | "Lengkap"
  | "Belum Lengkap"
  | "Terlambat"
  | "Belum Dimulai";

export interface ImunisasiRecord {
  id: string | number;
  balitaId: string | number;
  jenisVaksin: JenisVaksin;
  tanggalPemberian: string; // ISO 'YYYY-MM-DD'
  usiaSaatPemberianBulan: number;
  petugas: string;
  catatan: string;
}

export interface JadwalImunisasi {
  jenisVaksin: JenisVaksin;
  usiaMinimalBulan: number;
  usiaMaksimalBulan: number;
  deskripsi: string;
}

// --- View types ---
export type AppViewType =
  | "dashboard"
  | "balita"
  | "balita-detail"
  | "kalkulator"
  | "ibu-hamil"
  | "ibu-hamil-detail"
  | "laporan"
  | "pengaturan"
  | "imunisasi"
  | "vitamin-a"
  | "pmt"
  | "jadwal"
  | "analitik";

// --- ANC (Antenatal Care) visits for Ibu Hamil ---
export type JenisPemeriksaanANC =
  | "K1"
  | "K2"
  | "K3"
  | "K4"
  | "KF"
  | "PN"
  | "KF2";

export interface KunjunganANC {
  id: string | number;
  ibuHamilId: string | number;
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
export type TargetVitaminA = "Balita" | "Ibu Hamil";
export type StatusVitaminA = "Diberikan" | "Belum Diberikan";

export interface VitaminARecord {
  id: string | number;
  target: TargetVitaminA;
  targetId: string | number; // balitaId or ibuHamilId
  namaPenerima: string;
  tanggalPemberian: string; // ISO
  dosis: string; // e.g. '200.000 IU' (biru) or '100.000 IU' (merah)
  periode: "Februari" | "Agustus";
  tahun: number;
  petugas: string;
  catatan: string;
}

// --- Notifikasi ---
export type TipeNotifikasi = "alert" | "info" | "success" | "reminder";

export interface Notifikasi {
  id: string | number;
  tipe: TipeNotifikasi;
  judul: string;
  pesan: string;
  timestamp: string; // ISO datetime
  dibaca: boolean;
  linkView?: AppViewType;
  linkId?: string | number;
}

// --- Auth ---
export interface AuthUser {
  username: string;
  namaLengkap: string;
  peran: string;
  loginAt: string;
}

// --- PMT (Pemberian Makanan Tambahan) ---
export type JenisPMT =
  | "Biscuit PMT"
  | "Berbagai Makanan Lokal"
  | "Suplementasi Gizi"
  | "MP-ASI";
export type StatusPMT = "Aktif" | "Selesai" | "Dihentikan";

export interface PMTRecord {
  id: string | number;
  balitaId: string | number;
  namaBalita: string;
  jenisPMT: JenisPMT;
  tanggalMulai: string; // ISO
  tanggalSelesai?: string; // ISO, optional
  jumlahHari: number;
  beratAwalKg: number;
  beratAkhirKg?: number;
  alasan: "Pendek" | "Gizi Buruk" | "Gizi Kurang" | "BB Kurang" | "Risiko KEK"; // Pembaruan Terminologi
  status: StatusPMT;
  petugas: string;
  catatan: string;
}

// --- Jadwal Posyandu (Schedule) ---
export type JenisKegiatan =
  | "Posyandu Rutin"
  | "Penimbangan Balita"
  | "Pemberian Imunisasi"
  | "Pemberian Vitamin A"
  | "Pemberian PMT"
  | "Penyuluhan Gizi"
  | "Pemeriksaan Ibu Hamil"
  | "Posyandu Balita"
  | "Posyandu Lansia";

export type StatusJadwal =
  | "Terjadwal"
  | "Berlangsung"
  | "Selesai"
  | "Dibatalkan";

export interface JadwalPosyandu {
  id: string | number;
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
