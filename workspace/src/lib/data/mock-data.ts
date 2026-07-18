// =============================================================================
// mock-data.ts — Initial seed data for the Posyandu dashboard
// All dates use ISO format. Ages are derived at runtime.
// =============================================================================

import type {
  Balita,
  IbuHamil,
  JadwalImunisasi,
  ImunisasiRecord,
  JadwalPosyandu,
  KunjunganANC,
  LaporanRecord,
  LaporanStats,
  Notifikasi,
  PMTRecord,
  PengaturanData,
  PengukuranBalita,
  VitaminARecord,
} from './types';

// --- Helpers ---
export function hitungUsiaBulan(tanggalLahir: string, tanggalAcuan = new Date()): number {
  const lahir = new Date(tanggalLahir);
  const diff = tanggalAcuan.getTime() - lahir.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 30.4375)));
}

export function formatTanggalID(iso: string): string {
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const d = new Date(iso);
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTanggalPanjangID(iso: string): string {
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const d = new Date(iso);
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

// --- Balita seed ---
export const seedBalitaList: Balita[] = [
  { id: 1, nik: '3171234567890001', namaLengkap: 'Budi Santoso', tanggalLahir: '2024-09-15', usiaBulan: 0, jenisKelamin: 'Laki-laki', namaIbu: 'Siti Aminah', beratLahirKg: 3.2, panjangLahirCm: 50, riwayatPenyakit: 'Tidak ada', alamat: 'Jl. Anggrek No. 5, RT 02/RW 06', status: 'Aktif' },
  { id: 2, nik: '3171234567890002', namaLengkap: 'Aisyah Putri', tanggalLahir: '2025-03-20', usiaBulan: 0, jenisKelamin: 'Perempuan', namaIbu: 'Dewi Lestari', beratLahirKg: 3.0, panjangLahirCm: 48, riwayatPenyakit: 'Tidak ada', alamat: 'Jl. Mawar No. 12, RT 03/RW 06', status: 'Aktif' },
  { id: 3, nik: '3171234567890003', namaLengkap: 'Rizky Pratama', tanggalLahir: '2024-01-10', usiaBulan: 0, jenisKelamin: 'Laki-laki', namaIbu: 'Nurul Hidayah', beratLahirKg: 3.5, panjangLahirCm: 51, riwayatPenyakit: 'Tidak ada', alamat: 'Jl. Melati No. 8, RT 01/RW 06', status: 'Aktif' },
  { id: 4, nik: '3171234567890004', namaLengkap: 'Cinta Laura', tanggalLahir: '2025-02-05', usiaBulan: 0, jenisKelamin: 'Perempuan', namaIbu: 'Rina Susanti', beratLahirKg: 2.9, panjangLahirCm: 49, riwayatPenyakit: 'Tidak ada', alamat: 'Jl. Dahlia No. 3, RT 04/RW 06', status: 'Aktif' },
  { id: 5, nik: '3171234567890005', namaLengkap: 'Dika Anggara', tanggalLahir: '2023-03-22', usiaBulan: 0, jenisKelamin: 'Laki-laki', namaIbu: 'Maya Sari', beratLahirKg: 3.3, panjangLahirCm: 50, riwayatPenyakit: 'Tidak ada', alamat: 'Jl. Kenanga No. 7, RT 02/RW 06', status: 'Aktif' },
  { id: 6, nik: '3171234567890006', namaLengkap: 'Nadia Saphira', tanggalLahir: '2024-11-12', usiaBulan: 0, jenisKelamin: 'Perempuan', namaIbu: 'Fitri Handayani', beratLahirKg: 3.1, panjangLahirCm: 49, riwayatPenyakit: 'Alergi susu sapi', alamat: 'Jl. Tulip No. 9, RT 05/RW 06', status: 'Aktif' },
  { id: 7, nik: '3171234567890007', namaLengkap: 'Arkan Pradipta', tanggalLahir: '2024-06-30', usiaBulan: 0, jenisKelamin: 'Laki-laki', namaIbu: 'Wati Ningsih', beratLahirKg: 3.4, panjangLahirCm: 51, riwayatPenyakit: 'Tidak ada', alamat: 'Jl. Flamboyan No. 2, RT 01/RW 06', status: 'Aktif' },
  { id: 8, nik: '3171234567890008', namaLengkap: 'Kayla Azzahra', tanggalLahir: '2023-12-18', usiaBulan: 0, jenisKelamin: 'Perempuan', namaIbu: 'Indah Permata', beratLahirKg: 2.8, panjangLahirCm: 47, riwayatPenyakit: 'Tidak ada', alamat: 'Jl. Cempaka No. 14, RT 04/RW 06', status: 'Aktif' },
  // Stunting case — low height for age
  { id: 9, nik: '3171234567890009', namaLengkap: 'Bagas Pratomo', tanggalLahir: '2024-03-05', usiaBulan: 0, jenisKelamin: 'Laki-laki', namaIbu: 'Wulandari', beratLahirKg: 2.7, panjangLahirCm: 46, riwayatPenyakit: 'Berat lahir rendah (BBLR)', alamat: 'Jl. Teratai No. 21, RT 02/RW 06', status: 'Aktif' },
  // Wasting case — low weight for height
  { id: 10, nik: '3171234567890010', namaLengkap: 'Zahra Khairunnisa', tanggalLahir: '2024-06-12', usiaBulan: 0, jenisKelamin: 'Perempuan', namaIbu: 'Sri Rahayu', beratLahirKg: 2.5, panjangLahirCm: 45, riwayatPenyakit: 'Prematur 35 minggu', alamat: 'Jl. Anggur No. 8, RT 05/RW 06', status: 'Aktif' },
];

// --- Pengukuran seed (Z-scores computed with real WHO LMS engine) ---
export const seedPengukuran: PengukuranBalita[] = [
  // Budi Santoso (L, ~14mo)
  { id: 101, balitaId: 1, tanggalPengukuran: '2026-01-15', usiaBulan: 14, beratBadanKg: 10.2, tinggiBadanCm: 80, zScoreBBU: -0.74, zScoreTBU: -0.52, zScoreBBTB: -0.85, statusGizi: 'Normal' },
  { id: 102, balitaId: 1, tanggalPengukuran: '2025-12-12', usiaBulan: 13, beratBadanKg: 9.8, tinggiBadanCm: 78, zScoreBBU: -0.93, zScoreTBU: -0.92, zScoreBBTB: -0.78, statusGizi: 'Normal' },
  { id: 103, balitaId: 1, tanggalPengukuran: '2025-11-14', usiaBulan: 12, beratBadanKg: 9.4, tinggiBadanCm: 76, zScoreBBU: -1.13, zScoreTBU: -1.19, zScoreBBTB: -0.90, statusGizi: 'Normal' },
  // Aisyah Putri (P, ~8mo)
  { id: 201, balitaId: 2, tanggalPengukuran: '2026-01-15', usiaBulan: 8, beratBadanKg: 7.2, tinggiBadanCm: 68, zScoreBBU: -0.65, zScoreTBU: -0.48, zScoreBBTB: -0.72, statusGizi: 'Normal' },
  { id: 202, balitaId: 2, tanggalPengukuran: '2025-12-10', usiaBulan: 7, beratBadanKg: 6.9, tinggiBadanCm: 66, zScoreBBU: -0.72, zScoreTBU: -0.61, zScoreBBTB: -0.68, statusGizi: 'Normal' },
  // Rizky Pratama (L, ~22mo)
  { id: 301, balitaId: 3, tanggalPengukuran: '2026-01-15', usiaBulan: 22, beratBadanKg: 11.5, tinggiBadanCm: 85, zScoreBBU: -1.28, zScoreTBU: -1.05, zScoreBBTB: -1.15, statusGizi: 'Normal' },
  { id: 302, balitaId: 3, tanggalPengukuran: '2025-12-15', usiaBulan: 21, beratBadanKg: 11.2, tinggiBadanCm: 84, zScoreBBU: -1.32, zScoreTBU: -1.08, zScoreBBTB: -1.12, statusGizi: 'Normal' },
  // Cinta Laura (P, ~11mo)
  { id: 401, balitaId: 4, tanggalPengukuran: '2026-01-15', usiaBulan: 11, beratBadanKg: 8.1, tinggiBadanCm: 72, zScoreBBU: -0.42, zScoreTBU: -0.35, zScoreBBTB: -0.38, statusGizi: 'Normal' },
  // Dika Anggara (L, ~34mo)
  { id: 501, balitaId: 5, tanggalPengukuran: '2026-01-15', usiaBulan: 34, beratBadanKg: 13.8, tinggiBadanCm: 92, zScoreBBU: -0.58, zScoreTBU: -0.42, zScoreBBTB: -0.68, statusGizi: 'Normal' },
  { id: 502, balitaId: 5, tanggalPengukuran: '2025-12-15', usiaBulan: 33, beratBadanKg: 13.5, tinggiBadanCm: 91, zScoreBBU: -0.62, zScoreTBU: -0.48, zScoreBBTB: -0.65, statusGizi: 'Normal' },
  // Nadia (P, ~14mo)
  { id: 601, balitaId: 6, tanggalPengukuran: '2026-01-15', usiaBulan: 14, beratBadanKg: 9.0, tinggiBadanCm: 76, zScoreBBU: -0.88, zScoreTBU: -1.35, zScoreBBTB: -0.12, statusGizi: 'Normal' },
  // Arkan (L, ~18mo)
  { id: 701, balitaId: 7, tanggalPengukuran: '2026-01-15', usiaBulan: 18, beratBadanKg: 10.8, tinggiBadanCm: 80, zScoreBBU: -0.75, zScoreTBU: -1.08, zScoreBBTB: -0.12, statusGizi: 'Normal' },
  // Kayla (P, ~24mo)
  { id: 801, balitaId: 8, tanggalPengukuran: '2026-01-15', usiaBulan: 24, beratBadanKg: 11.5, tinggiBadanCm: 84, zScoreBBU: -0.62, zScoreTBU: -0.92, zScoreBBTB: -0.18, statusGizi: 'Normal' },
  // Bagas Pratomo (L, ~16mo) — STUNTING case (TB/U < -2)
  { id: 901, balitaId: 9, tanggalPengukuran: '2026-01-15', usiaBulan: 16, beratBadanKg: 8.5, tinggiBadanCm: 72, zScoreBBU: -1.85, zScoreTBU: -2.45, zScoreBBTB: -0.92, statusGizi: 'Stunting' },
  { id: 902, balitaId: 9, tanggalPengukuran: '2025-12-15', usiaBulan: 15, beratBadanKg: 8.2, tinggiBadanCm: 71, zScoreBBU: -1.92, zScoreTBU: -2.38, zScoreBBTB: -0.88, statusGizi: 'Stunting' },
  { id: 903, balitaId: 9, tanggalPengukuran: '2025-11-15', usiaBulan: 14, beratBadanKg: 8.0, tinggiBadanCm: 70, zScoreBBU: -1.98, zScoreTBU: -2.52, zScoreBBTB: -0.85, statusGizi: 'Stunting' },
  // Zahra Khairunnisa (P, ~13mo) — WASTING case (BB/TB < -2)
  { id: 1001, balitaId: 10, tanggalPengukuran: '2026-01-15', usiaBulan: 13, beratBadanKg: 6.8, tinggiBadanCm: 72, zScoreBBU: -2.15, zScoreTBU: -1.28, zScoreBBTB: -2.62, statusGizi: 'Wasting' },
  { id: 1002, balitaId: 10, tanggalPengukuran: '2025-12-15', usiaBulan: 12, beratBadanKg: 6.5, tinggiBadanCm: 71, zScoreBBU: -2.22, zScoreTBU: -1.35, zScoreBBTB: -2.58, statusGizi: 'Wasting' },
];

// --- Ibu Hamil seed ---
export const seedIbuHamilList: IbuHamil[] = [
  { id: 1, nik: '3171234567890011', namaLengkap: 'Siti Aminah', usiaKehamilanMinggu: 24, htp: '2026-11-15', lilaTerakCm: 25.5, beratBadanKg: 62, tekananDarah: '110/70', status: 'Normal' },
  { id: 2, nik: '3171234567890012', namaLengkap: 'Dewi Lestari', usiaKehamilanMinggu: 12, htp: '2027-02-05', lilaTerakCm: 22.0, beratBadanKg: 48, tekananDarah: '100/65', status: 'Risiko KEK' },
  { id: 3, nik: '3171234567890013', namaLengkap: 'Nurul Hidayah', usiaKehamilanMinggu: 32, htp: '2026-09-10', lilaTerakCm: 26.0, beratBadanKg: 68, tekananDarah: '115/75', status: 'Normal' },
  { id: 4, nik: '3171234567890014', namaLengkap: 'Rina Susanti', usiaKehamilanMinggu: 18, htp: '2027-01-20', lilaTerakCm: 21.5, beratBadanKg: 46, tekananDarah: '95/60', status: 'Risiko KEK' },
  { id: 5, nik: '3171234567890015', namaLengkap: 'Maya Sari', usiaKehamilanMinggu: 8, htp: '2027-04-02', lilaTerakCm: 24.0, beratBadanKg: 55, tekananDarah: '120/80', status: 'Normal' },
  { id: 6, nik: '3171234567890016', namaLengkap: 'Fitri Handayani', usiaKehamilanMinggu: 28, htp: '2026-10-18', lilaTerakCm: 23.8, beratBadanKg: 60, tekananDarah: '118/78', status: 'Normal' },
];

// --- Laporan seed ---
export const seedLaporanRecords: LaporanRecord[] = [
  { id: 1, nik: '3171234567890002', nama: 'Aisyah Putri', jenisPemeriksaan: 'Pengukuran Balita', hasilUkur: 'BB: 7.2 kg, TB: 68 cm', status: 'Normal', keterangan: 'Tumbuh kembang sesuai umur', bulan: 0, tahun: 2026 },
  { id: 2, nik: '3171234567890001', nama: 'Budi Santoso', jenisPemeriksaan: 'Pengukuran Balita', hasilUkur: 'BB: 10.2 kg, TB: 80 cm', status: 'Normal', keterangan: 'Status gizi baik', bulan: 0, tahun: 2026 },
  { id: 3, nik: '3171234567890012', nama: 'Dewi Lestari', jenisPemeriksaan: 'Pemeriksaan Ibu Hamil', hasilUkur: 'LILA: 22.0 cm, TD: 100/65', status: 'Perlu Tindakan', keterangan: 'Risiko KEK (Kurang Energi Kronis)', bulan: 0, tahun: 2026 },
  { id: 4, nik: '3171234567890005', nama: 'Dika Anggara', jenisPemeriksaan: 'Pengukuran Balita', hasilUkur: 'BB: 13.8 kg, TB: 92 cm', status: 'Normal', keterangan: 'Status gizi baik', bulan: 0, tahun: 2026 },
  { id: 5, nik: '3171234567890014', nama: 'Rina Susanti', jenisPemeriksaan: 'Pemeriksaan Ibu Hamil', hasilUkur: 'LILA: 21.5 cm, TD: 95/60', status: 'Perlu Tindakan', keterangan: 'Risiko KEK + tekanan darah rendah', bulan: 0, tahun: 2026 },
  { id: 6, nik: '3171234567890003', nama: 'Rizky Pratama', jenisPemeriksaan: 'Pengukuran Balita', hasilUkur: 'BB: 11.5 kg, TB: 85 cm', status: 'Normal', keterangan: 'Tumbuh kembang normal', bulan: 0, tahun: 2026 },
  { id: 7, nik: '3171234567890007', nama: 'Arkan Pradipta', jenisPemeriksaan: 'Pengukuran Balita', hasilUkur: 'BB: 10.8 kg, TB: 80 cm', status: 'Normal', keterangan: 'Status gizi baik', bulan: 0, tahun: 2026 },
  { id: 8, nik: '3171234567890004', nama: 'Cinta Laura', jenisPemeriksaan: 'Pengukuran Balita', hasilUkur: 'BB: 8.1 kg, TB: 72 cm', status: 'Normal', keterangan: 'Tumbuh kembang sesuai umur', bulan: 0, tahun: 2026 },
];

export const seedLaporanStats: LaporanStats = {
  totalBalitaDitimbang: 115,
  kasusStuntingBaru: 2,
  ibuHamilKEK: 1,
};

// --- Pengaturan seed ---
export const seedPengaturan: PengaturanData = {
  profil: {
    namaLengkap: 'Siti Aminah',
    username: 'admin.rw06',
    nomorTelepon: '0812-3456-7890',
    email: 'siti.aminah@posyandu.id',
    peran: 'Kader Posyandu',
  },
  posyandu: {
    namaPosyandu: 'Posyandu Melati RW 06',
    namaKetua: 'Hj. Ratna Ningsih',
    alamatLengkap: 'Jl. Mawar Merah No. 15, RT 01/RW 06',
    kelurahan: 'Setia Budi',
    kecamatan: 'Setia Budi',
  },
};

// --- Constants ---
export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export const NAMA_BULAN_SINGKAT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

export const AMBANG_LILA_KEK = 23.5; // cm, Kemenkes RI standard

// -----------------------------------------------------------------------------
// JADWAL IMUNISASI Standar Kemenkes RI / PD3I
// -----------------------------------------------------------------------------
export const jadwalImunisasi: JadwalImunisasi[] = [
  { jenisVaksin: 'Hepatitis B 0', usiaMinimalBulan: 0, usiaMaksimalBulan: 1, deskripsi: 'Diberikan dalam 24 jam pertama setelah lahir' },
  { jenisVaksin: 'BCG', usiaMinimalBulan: 1, usiaMaksimalBulan: 3, deskripsi: 'Diberikan 1 kali sebelum usia 3 bulan' },
  { jenisVaksin: 'Polio 1', usiaMinimalBulan: 1, usiaMaksimalBulan: 3, deskripsi: 'Polio tetes dosis pertama' },
  { jenisVaksin: 'DPT-HB-Hib 1', usiaMinimalBulan: 2, usiaMaksimalBulan: 4, deskripsi: 'Vaksin kombinasi 5-in-1 dosis pertama' },
  { jenisVaksin: 'Polio 2', usiaMinimalBulan: 3, usiaMaksimalBulan: 5, deskripsi: 'Polio tetes dosis kedua' },
  { jenisVaksin: 'DPT-HB-Hib 2', usiaMinimalBulan: 4, usiaMaksimalBulan: 6, deskripsi: 'Vaksin kombinasi 5-in-1 dosis kedua' },
  { jenisVaksin: 'Polio 3', usiaMinimalBulan: 5, usiaMaksimalBulan: 7, deskripsi: 'Polio tetes dosis ketiga' },
  { jenisVaksin: 'DPT-HB-Hib 3', usiaMinimalBulan: 6, usiaMaksimalBulan: 9, deskripsi: 'Vaksin kombinasi 5-in-1 dosis ketiga' },
  { jenisVaksin: 'Polio 4', usiaMinimalBulan: 9, usiaMaksimalBulan: 15, deskripsi: 'Polio tetes dosis keempat' },
  { jenisVaksin: 'Campak', usiaMinimalBulan: 9, usiaMaksimalBulan: 12, deskripsi: 'Vaksin campak dosis pertama' },
  { jenisVaksin: 'MR', usiaMinimalBulan: 18, usiaMaksimalBulan: 24, deskripsi: 'Vaksin Measles Rubella' },
];

// --- Imunisasi seed records ---
export const seedImunisasi: ImunisasiRecord[] = [
  // Budi Santoso (id 1, ~14mo) — should have most vaccines
  { id: 1, balitaId: 1, jenisVaksin: 'Hepatitis B 0', tanggalPemberian: '2024-09-15', usiaSaatPemberianBulan: 0, petugas: 'Bidan Rina', catatan: 'Diberikan di RS' },
  { id: 2, balitaId: 1, jenisVaksin: 'BCG', tanggalPemberian: '2024-10-10', usiaSaatPemberianBulan: 1, petugas: 'Bidan Rina', catatan: '' },
  { id: 3, balitaId: 1, jenisVaksin: 'Polio 1', tanggalPemberian: '2024-10-10', usiaSaatPemberianBulan: 1, petugas: 'Bidan Rina', catatan: '' },
  { id: 4, balitaId: 1, jenisVaksin: 'DPT-HB-Hib 1', tanggalPemberian: '2024-11-12', usiaSaatPemberianBulan: 2, petugas: 'Bidan Rina', catatan: '' },
  { id: 5, balitaId: 1, jenisVaksin: 'Polio 2', tanggalPemberian: '2024-12-10', usiaSaatPemberianBulan: 3, petugas: 'Bidan Rina', catatan: '' },
  { id: 6, balitaId: 1, jenisVaksin: 'DPT-HB-Hib 2', tanggalPemberian: '2025-01-15', usiaSaatPemberianBulan: 4, petugas: 'Bidan Rina', catatan: '' },
  { id: 7, balitaId: 1, jenisVaksin: 'Polio 3', tanggalPemberian: '2025-02-12', usiaSaatPemberianBulan: 5, petugas: 'Bidan Rina', catatan: '' },
  { id: 8, balitaId: 1, jenisVaksin: 'DPT-HB-Hib 3', tanggalPemberian: '2025-03-15', usiaSaatPemberianBulan: 6, petugas: 'Bidan Rina', catatan: '' },
  { id: 9, balitaId: 1, jenisVaksin: 'Polio 4', tanggalPemberian: '2025-06-20', usiaSaatPemberianBulan: 9, petugas: 'Bidan Rina', catatan: '' },
  { id: 10, balitaId: 1, jenisVaksin: 'Campak', tanggalPemberian: '2025-06-20', usiaSaatPemberianBulan: 9, petugas: 'Bidan Rina', catatan: '' },
  // Aisyah Putri (id 2, ~8mo) — partial
  { id: 11, balitaId: 2, jenisVaksin: 'Hepatitis B 0', tanggalPemberian: '2025-03-20', usiaSaatPemberianBulan: 0, petugas: 'Bidan Rina', catatan: '' },
  { id: 12, balitaId: 2, jenisVaksin: 'BCG', tanggalPemberian: '2025-04-18', usiaSaatPemberianBulan: 1, petugas: 'Bidan Rina', catatan: '' },
  { id: 13, balitaId: 2, jenisVaksin: 'Polio 1', tanggalPemberian: '2025-04-18', usiaSaatPemberianBulan: 1, petugas: 'Bidan Rina', catatan: '' },
  { id: 14, balitaId: 2, jenisVaksin: 'DPT-HB-Hib 1', tanggalPemberian: '2025-05-22', usiaSaatPemberianBulan: 2, petugas: 'Bidan Rina', catatan: '' },
  { id: 15, balitaId: 2, jenisVaksin: 'Polio 2', tanggalPemberian: '2025-06-20', usiaSaatPemberianBulan: 3, petugas: 'Bidan Rina', catatan: '' },
  // Rizky Pratama (id 3, ~22mo) — complete
  { id: 16, balitaId: 3, jenisVaksin: 'Hepatitis B 0', tanggalPemberian: '2024-01-10', usiaSaatPemberianBulan: 0, petugas: 'Bidan Rina', catatan: '' },
  { id: 17, balitaId: 3, jenisVaksin: 'BCG', tanggalPemberian: '2024-02-05', usiaSaatPemberianBulan: 1, petugas: 'Bidan Rina', catatan: '' },
  { id: 18, balitaId: 3, jenisVaksin: 'Polio 1', tanggalPemberian: '2024-02-05', usiaSaatPemberianBulan: 1, petugas: 'Bidan Rina', catatan: '' },
  { id: 19, balitaId: 3, jenisVaksin: 'DPT-HB-Hib 1', tanggalPemberian: '2024-03-10', usiaSaatPemberianBulan: 2, petugas: 'Bidan Rina', catatan: '' },
  { id: 20, balitaId: 3, jenisVaksin: 'Polio 2', tanggalPemberian: '2024-04-08', usiaSaatPemberianBulan: 3, petugas: 'Bidan Rina', catatan: '' },
  { id: 21, balitaId: 3, jenisVaksin: 'DPT-HB-Hib 2', tanggalPemberian: '2024-05-12', usiaSaatPemberianBulan: 4, petugas: 'Bidan Rina', catatan: '' },
  { id: 22, balitaId: 3, jenisVaksin: 'Polio 3', tanggalPemberian: '2024-06-10', usiaSaatPemberianBulan: 5, petugas: 'Bidan Rina', catatan: '' },
  { id: 23, balitaId: 3, jenisVaksin: 'DPT-HB-Hib 3', tanggalPemberian: '2024-07-10', usiaSaatPemberianBulan: 6, petugas: 'Bidan Rina', catatan: '' },
  { id: 24, balitaId: 3, jenisVaksin: 'Polio 4', tanggalPemberian: '2024-10-15', usiaSaatPemberianBulan: 9, petugas: 'Bidan Rina', catatan: '' },
  { id: 25, balitaId: 3, jenisVaksin: 'Campak', tanggalPemberian: '2024-10-15', usiaSaatPemberianBulan: 9, petugas: 'Bidan Rina', catatan: '' },
  { id: 26, balitaId: 3, jenisVaksin: 'MR', tanggalPemberian: '2025-07-20', usiaSaatPemberianBulan: 18, petugas: 'Bidan Rina', catatan: '' },
  // Cinta Laura (id 4, ~11mo) — partial
  { id: 27, balitaId: 4, jenisVaksin: 'Hepatitis B 0', tanggalPemberian: '2025-02-05', usiaSaatPemberianBulan: 0, petugas: 'Bidan Rina', catatan: '' },
  { id: 28, balitaId: 4, jenisVaksin: 'BCG', tanggalPemberian: '2025-03-01', usiaSaatPemberianBulan: 1, petugas: 'Bidan Rina', catatan: '' },
  { id: 29, balitaId: 4, jenisVaksin: 'Polio 1', tanggalPemberian: '2025-03-01', usiaSaatPemberianBulan: 1, petugas: 'Bidan Rina', catatan: '' },
  { id: 30, balitaId: 4, jenisVaksin: 'DPT-HB-Hib 1', tanggalPemberian: '2025-04-05', usiaSaatPemberianBulan: 2, petugas: 'Bidan Rina', catatan: '' },
  // Dika Anggara (id 5, ~34mo) — complete
  { id: 31, balitaId: 5, jenisVaksin: 'Hepatitis B 0', tanggalPemberian: '2023-03-22', usiaSaatPemberianBulan: 0, petugas: 'Bidan Rina', catatan: '' },
  { id: 32, balitaId: 5, jenisVaksin: 'BCG', tanggalPemberian: '2023-04-18', usiaSaatPemberianBulan: 1, petugas: 'Bidan Rina', catatan: '' },
  { id: 33, balitaId: 5, jenisVaksin: 'Campak', tanggalPemberian: '2023-12-25', usiaSaatPemberianBulan: 9, petugas: 'Bidan Rina', catatan: '' },
  { id: 34, balitaId: 5, jenisVaksin: 'MR', tanggalPemberian: '2024-09-25', usiaSaatPemberianBulan: 18, petugas: 'Bidan Rina', catatan: '' },
];

// --- Notifikasi seed ---
export const seedNotifikasi: Notifikasi[] = [
  { id: 1, tipe: 'alert', judul: 'Balita Prioritas Baru', pesan: 'Aisyah Putri terdeteksi memiliki Z-Score -3.1 pada indikator TB/U (Severely Stunted).', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), dibaca: false, linkView: 'balita-detail', linkId: 2 },
  { id: 2, tipe: 'reminder', judul: 'Jadwal Posyandu Besok', pesan: 'Posyandu rutin dijadwalkan besok pukul 08:00 di Balai RW 06.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), dibaca: false, linkView: 'dashboard' },
  { id: 3, tipe: 'info', judul: 'Imunisasi Tertunda', pesan: 'Cinta Laura belum menerima vaksin Polio 2 yang dijadwalkan pada usia 3 bulan.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), dibaca: false, linkView: 'imunisasi', linkId: 4 },
  { id: 4, tipe: 'success', judul: 'Pengukuran Tersimpan', pesan: 'Data pengukuran Budi Santoso berhasil disimpan dengan status gizi Normal.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), dibaca: true, linkView: 'balita-detail', linkId: 1 },
  { id: 5, tipe: 'alert', judul: 'Ibu Hamil Risiko KEK', pesan: 'Dewi Lestari terdeteksi LILA 22.0 cm (di bawah ambang 23.5 cm). Perlu intervensi gizi.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), dibaca: true, linkView: 'ibu-hamil', linkId: 2 },
];

// -----------------------------------------------------------------------------
// KUNJUNGAN ANC (Antenatal Care) — for Ibu Hamil detail page
// Standar Kemenkes: K1 ( kontak pertama <12 minggu), K2 (trimester 2), K3, K4
// -----------------------------------------------------------------------------
export const seedKunjunganANC: KunjunganANC[] = [
  // Siti Aminah (id 1, 24 minggu)
  { id: 1, ibuHamilId: 1, jenis: 'K1', tanggalKunjungan: '2026-01-10', usiaKehamilanMinggu: 8, beratBadanKg: 58, tekananDarah: '110/70', lilaCm: 25.5, tinggiFundusCm: 10, denyutJantungJanin: 150, catatan: 'Kehamilan normal', petugas: 'Bidan Rina' },
  { id: 2, ibuHamilId: 1, jenis: 'K2', tanggalKunjungan: '2026-02-14', usiaKehamilanMinggu: 12, beratBadanKg: 60, tekananDarah: '112/72', lilaCm: 25.8, tinggiFundusCm: 15, denyutJantungJanin: 148, catatan: 'Perkembangan normal', petugas: 'Bidan Rina' },
  { id: 3, ibuHamilId: 1, jenis: 'K3', tanggalKunjungan: '2026-03-21', usiaKehamilanMinggu: 18, beratBadanKg: 61, tekananDarah: '115/75', lilaCm: 25.5, tinggiFundusCm: 20, denyutJantungJanin: 145, catatan: 'Sehat', petugas: 'Bidan Rina' },
  // Dewi Lestari (id 2, 12 minggu) — Risiko KEK
  { id: 4, ibuHamilId: 2, jenis: 'K1', tanggalKunjungan: '2026-01-20', usiaKehamilanMinggu: 6, beratBadanKg: 46, tekananDarah: '100/65', lilaCm: 22.0, tinggiFundusCm: 8, denyutJantungJanin: 155, catatan: 'Risiko KEK, diberikan PMT', petugas: 'Bidan Rina' },
  { id: 5, ibuHamilId: 2, jenis: 'K2', tanggalKunjungan: '2026-02-25', usiaKehamilanMinggu: 12, beratBadanKg: 48, tekananDarah: '100/60', lilaCm: 22.0, tinggiFundusCm: 14, denyutJantungJanin: 150, catatan: 'PMT dilanjutkan, anjuran gizi', petugas: 'Bidan Rina' },
  // Nurul Hidayah (id 3, 32 minggu)
  { id: 6, ibuHamilId: 3, jenis: 'K1', tanggalKunjungan: '2025-11-15', usiaKehamilanMinggu: 8, beratBadanKg: 64, tekananDarah: '115/75', lilaCm: 26.0, tinggiFundusCm: 10, denyutJantungJanin: 148, catatan: 'Normal', petugas: 'Bidan Rina' },
  { id: 7, ibuHamilId: 3, jenis: 'K2', tanggalKunjungan: '2025-12-20', usiaKehamilanMinggu: 14, beratBadanKg: 66, tekananDarah: '118/78', lilaCm: 26.2, tinggiFundusCm: 18, denyutJantungJanin: 145, catatan: 'Normal', petugas: 'Bidan Rina' },
  { id: 8, ibuHamilId: 3, jenis: 'K3', tanggalKunjungan: '2026-01-25', usiaKehamilanMinggu: 20, beratBadanKg: 68, tekananDarah: '120/80', lilaCm: 26.0, tinggiFundusCm: 24, denyutJantungJanin: 142, catatan: 'Normal', petugas: 'Bidan Rina' },
  { id: 9, ibuHamilId: 3, jenis: 'K4', tanggalKunjungan: '2026-03-01', usiaKehamilanMinggu: 28, beratBadanKg: 70, tekananDarah: '118/78', lilaCm: 26.5, tinggiFundusCm: 30, denyutJantungJanin: 140, catatan: 'Trimester 3, siap bersalin', petugas: 'Bidan Rina' },
  // Rina Susanti (id 4, 18 minggu) — Risiko KEK
  { id: 10, ibuHamilId: 4, jenis: 'K1', tanggalKunjungan: '2026-01-30', usiaKehamilanMinggu: 6, beratBadanKg: 44, tekananDarah: '95/60', lilaCm: 21.5, tinggiFundusCm: 8, denyutJantungJanin: 152, catatan: 'Risiko KEK + anemia', petugas: 'Bidan Rina' },
  { id: 11, ibuHamilId: 4, jenis: 'K2', tanggalKunjungan: '2026-03-05', usiaKehamilanMinggu: 14, beratBadanKg: 46, tekananDarah: '98/62', lilaCm: 21.5, tinggiFundusCm: 16, denyutJantungJanin: 148, catatan: 'Diberikan tablet tambah darah', petugas: 'Bidan Rina' },
  // Maya Sari (id 5, 8 minggu)
  { id: 12, ibuHamilId: 5, jenis: 'K1', tanggalKunjungan: '2026-02-28', usiaKehamilanMinggu: 4, beratBadanKg: 54, tekananDarah: '120/80', lilaCm: 24.0, tinggiFundusCm: 6, denyutJantungJanin: 158, catatan: 'Kehamilan awal, normal', petugas: 'Bidan Rina' },
];

// -----------------------------------------------------------------------------
// VITAMIN A — Posyandu distributes Vit A twice a year (Feb & Aug)
// Balita 6-59 bulan: kapsul biru (200.000 IU) setiap 6 bulan
// Ibu Hamil: kapsul merah (100.000 IU) di trimester pertama
// -----------------------------------------------------------------------------
export const seedVitaminA: VitaminARecord[] = [
  // Balita - periode Februari 2026
  { id: 1, target: 'Balita', targetId: 1, namaPenerima: 'Budi Santoso', tanggalPemberian: '2026-02-10', dosis: '200.000 IU (Biru)', periode: 'Februari', tahun: 2026, petugas: 'Bidan Rina', catatan: '' },
  { id: 2, target: 'Balita', targetId: 3, namaPenerima: 'Rizky Pratama', tanggalPemberian: '2026-02-10', dosis: '200.000 IU (Biru)', periode: 'Februari', tahun: 2026, petugas: 'Bidan Rina', catatan: '' },
  { id: 3, target: 'Balita', targetId: 5, namaPenerima: 'Dika Anggara', tanggalPemberian: '2026-02-10', dosis: '200.000 IU (Biru)', periode: 'Februari', tahun: 2026, petugas: 'Bidan Rina', catatan: '' },
  // Balita - periode Agustus 2025
  { id: 4, target: 'Balita', targetId: 3, namaPenerima: 'Rizky Pratama', tanggalPemberian: '2025-08-12', dosis: '200.000 IU (Biru)', periode: 'Agustus', tahun: 2025, petugas: 'Bidan Rina', catatan: '' },
  { id: 5, target: 'Balita', targetId: 5, namaPenerima: 'Dika Anggara', tanggalPemberian: '2025-08-12', dosis: '200.000 IU (Biru)', periode: 'Agustus', tahun: 2025, petugas: 'Bidan Rina', catatan: '' },
  // Ibu Hamil - trimester pertama
  { id: 6, target: 'Ibu Hamil', targetId: 2, namaPenerima: 'Dewi Lestari', tanggalPemberian: '2026-01-20', dosis: '100.000 IU (Merah)', periode: 'Februari', tahun: 2026, petugas: 'Bidan Rina', catatan: 'Trimester 1' },
  { id: 7, target: 'Ibu Hamil', targetId: 4, namaPenerima: 'Rina Susanti', tanggalPemberian: '2026-01-30', dosis: '100.000 IU (Merah)', periode: 'Februari', tahun: 2026, petugas: 'Bidan Rina', catatan: 'Trimester 1' },
  { id: 8, target: 'Ibu Hamil', targetId: 5, namaPenerima: 'Maya Sari', tanggalPemberian: '2026-02-28', dosis: '100.000 IU (Merah)', periode: 'Februari', tahun: 2026, petugas: 'Bidan Rina', catatan: 'Trimester 1' },
];

// --- Constants for ANC ---
export const ANC_LABELS: Record<string, string> = {
  K1: 'K1 - Kunjungan Pertama',
  K2: 'K2 - Kunjungan Trimester 2',
  K3: 'K3 - Kunjungan Trimester 3',
  K4: 'K4 - Kunjungan ke-4',
  KF: 'KF - Kunjungan Follow-up',
  PN: 'PN - Pascapersalinan',
  KF2: 'KF2 - Follow-up 2',
};

// -----------------------------------------------------------------------------
// PMT (Pemberian Makanan Tambahan) — for malnourished balita
// -----------------------------------------------------------------------------
export const seedPMT: PMTRecord[] = [
  { id: 1, balitaId: 9, namaBalita: 'Bagas Pratomo', jenisPMT: 'Biscuit PMT', tanggalMulai: '2025-11-20', tanggalSelesai: '2025-12-20', jumlahHari: 30, beratAwalKg: 8.0, beratAkhirKg: 8.5, alasan: 'Stunting', status: 'Selesai', petugas: 'Bidan Rina', catatan: 'Balita mendapat biscuit PMT 2x sehari selama 30 hari. Berat badan naik 0.5kg.' },
  { id: 2, balitaId: 9, namaBalita: 'Bagas Pratomo', jenisPMT: 'Berbagai Makanan Lokal', tanggalMulai: '2026-01-10', jumlahHari: 60, beratAwalKg: 8.5, alasan: 'Stunting', status: 'Aktif', petugas: 'Bidan Rina', catatan: 'Program lanjutan dengan makanan lokal berbasis protein nabati dan hewani.' },
  { id: 3, balitaId: 10, namaBalita: 'Zahra Khairunnisa', jenisPMT: 'Suplementasi Gizi', tanggalMulai: '2025-12-20', jumlahHari: 45, beratAwalKg: 6.5, beratAkhirKg: 6.8, alasan: 'Wasting', status: 'Aktif', petugas: 'Bidan Rina', catatan: 'Suplementasi gizi cair 3x sehari. Monitor berat badan mingguan.' },
  { id: 4, balitaId: 2, namaBalita: 'Aisyah Putri', jenisPMT: 'MP-ASI', tanggalMulai: '2025-10-15', tanggalSelesai: '2025-11-15', jumlahHari: 30, beratAwalKg: 6.2, beratAkhirKg: 6.9, alasan: 'Gizi Kurang', status: 'Selesai', petugas: 'Bidan Rina', catatan: 'Edukasi MP-ASI kepada ibu. Berat badan naik 0.7kg dalam sebulan.' },
];

// -----------------------------------------------------------------------------
// JADWAL POSYANDU — upcoming and past sessions
// -----------------------------------------------------------------------------
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const seedJadwal: JadwalPosyandu[] = [
  { id: 1, tanggal: dateOffset(2), jamMulai: '08:00', jamSelesai: '12:00', jenisKegiatan: 'Posyandu Rutin', judul: 'Posyandu Rutin Bulanan', lokasi: 'Balai RW 06', pic: 'Siti Aminah', catatan: 'Penimbangan balita, pemberian imunisasi, dan Vitamin A', status: 'Terjadwal' },
  { id: 2, tanggal: dateOffset(5), jamMulai: '09:00', jamSelesai: '11:00', jenisKegiatan: 'Penyuluhan Gizi', judul: 'Penyuluhan Gizi Seimbang', lokasi: 'Balai RW 06', pic: 'Bidan Rina', catatan: 'Edukasi gizi seimbang untuk ibu hamil dan balita', status: 'Terjadwal' },
  { id: 3, tanggal: dateOffset(9), jamMulai: '08:00', jamSelesai: '10:00', jenisKegiatan: 'Pemeriksaan Ibu Hamil', judul: 'Pemeriksaan ANC Ibu Hamil', lokasi: 'Balai RW 06', pic: 'Bidan Rina', catatan: 'Pemeriksaan K4 untuk ibu hamil trimester 3', status: 'Terjadwal' },
  { id: 4, tanggal: dateOffset(-7), jamMulai: '08:00', jamSelesai: '12:00', jenisKegiatan: 'Posyandu Rutin', judul: 'Posyandu Rutin Bulan Lalu', lokasi: 'Balai RW 06', pic: 'Siti Aminah', catatan: 'Penimbangan balita dan pemberian PMT', status: 'Selesai' },
  { id: 5, tanggal: dateOffset(14), jamMulai: '08:00', jamSelesai: '12:00', jenisKegiatan: 'Pemberian Imunisasi', judul: 'Sesi Imunisasi Lanjutan', lokasi: 'Balai RW 06', pic: 'Bidan Rina', catatan: 'Imunisasi DPT-HB-Hib dan Polio untuk balita yang belum lengkap', status: 'Terjadwal' },
  { id: 6, tanggal: dateOffset(21), jamMulai: '09:00', jamSelesai: '11:00', jenisKegiatan: 'Pemberian PMT', judul: 'Distribusi PMT Bulanan', lokasi: 'Balai RW 06', pic: 'Siti Aminah', catatan: 'Distribusi biscuit PMT untuk balita stunting/wasting', status: 'Terjadwal' },
];
