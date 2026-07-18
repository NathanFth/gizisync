#!/usr/bin/env python3
"""
recompute_seed_zscores.py — Recompute Z-Scores for every entry in
seedPengukuran (mock-data.ts) using the corrected WHO LMS engine.

This mirrors src/lib/data/who-reference.ts exactly:
  - WFA / HFA tables cover 0–60 months.
  - WFH table covers 45–120 cm (extended from the previous 45–90 cm).
  - HFA uses L = 1 constant (per WHO convention).
  - Box-Cox Z formula: L≠0 → ((X/M)^L - 1) / (L*S); L=0 → ln(X/M) / S.

For each seed entry we know:
  - balitaId  → looks up jenisKelamin (from seedBalitaList)
  - usiaBulan
  - beratBadanKg  (X for BBU and BBTB)
  - tinggiBadanCm (X for TBU; lookup key for BBTB)

Output: prints the seedPengukuran array literal with recomputed Z-Scores
and the derived `statusGizi` (using getStatusGiziKeseluruhan), ready to
paste back into mock-data.ts.
"""

from __future__ import annotations

import math
import json
import sys
from pathlib import Path

# Import the LMS tables from the generator script's table data
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

# Re-declare tables here by importing the build script's module-level data.
import importlib.util
spec = importlib.util.spec_from_file_location("build_who_reference", SCRIPT_DIR / "build_who_reference.py")
bwr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bwr)

WFA_BOYS = bwr.WFA_BOYS
WFA_GIRLS = bwr.WFA_GIRLS
HFA_BOYS = bwr.HFA_BOYS
HFA_GIRLS = bwr.HFA_GIRLS
WFH_BOYS = bwr.WFH_BOYS
WFH_GIRLS = bwr.WFH_GIRLS


def interpolate_lms(table, key: float):
    exact = table.get(round(key))
    if exact:
        return exact
    keys = sorted(table.keys())
    lo, hi = keys[0], keys[-1]
    for k in keys:
        if k <= key:
            lo = k
        if k >= key:
            hi = k
            break
    if key < lo or key > hi:
        return table.get(lo) or table.get(hi)
    l1, m1, s1 = table[lo]
    l2, m2, s2 = table[hi]
    t = (key - lo) / (hi - lo or 1)
    return (l1 + (l2 - l1) * t, m1 + (m2 - m1) * t, s1 + (s2 - s1) * t)


def hitung_z(jenis_kelamin: str, indikator: str, umur: int, nilai: float, tinggi=None) -> float:
    is_boy = jenis_kelamin == 'Laki-laki'
    if indikator == 'BBU':
        if umur < 0 or umur > 60:
            return float('nan')
        table = WFA_BOYS if is_boy else WFA_GIRLS
        key = umur
    elif indikator == 'TBU':
        if umur < 0 or umur > 60:
            return float('nan')
        table = HFA_BOYS if is_boy else HFA_GIRLS
        key = umur
    else:  # BBTB
        if tinggi is None or tinggi < 45 or tinggi > 120:
            return float('nan')
        table = WFH_BOYS if is_boy else WFH_GIRLS
        key = tinggi
    lms = interpolate_lms(table, key)
    if not lms:
        return float('nan')
    L, M, S = lms
    X = tinggi if (indikator == 'TBU' and tinggi is not None) else nilai
    if X <= 0 or M <= 0 or S <= 0:
        return float('nan')
    if abs(L) < 1e-7:
        z = math.log(X / M) / S
    else:
        z = (math.pow(X / M, L) - 1) / (L * S)
    return round(z, 2)


def get_status(z, indikator):
    if math.isnan(z):
        return 'Di luar rentang WHO'
    if indikator == 'BBU':
        if z < -3: return 'Wasting'
        if z < -2: return 'Wasting'
        if z <= 1: return 'Normal'
        if z <= 2: return 'Risiko Gizi Lebih'
        if z <= 3: return 'Gizi Lebih'
        return 'Obesitas'
    if indikator == 'TBU':
        if z < -3: return 'Severely Stunting'
        if z < -2: return 'Stunting'
        return 'Normal'
    # BBTB
    if z < -3: return 'Severely Wasting'
    if z < -2: return 'Wasting'
    if z <= 1: return 'Normal'
    if z <= 2: return 'Risiko Gizi Lebih'
    if z <= 3: return 'Gizi Lebih'
    return 'Obesitas'


def overall_status(z_bbu, z_tbu, z_bbtb):
    if math.isnan(z_bbu) and math.isnan(z_tbu) and math.isnan(z_bbtb):
        return 'Di luar rentang WHO'
    s_bbu = get_status(z_bbu, 'BBU')
    s_tbu = get_status(z_tbu, 'TBU')
    s_bbtb = get_status(z_bbtb, 'BBTB')
    if s_tbu == 'Severely Stunting': return 'Severely Stunting'
    if s_bbtb == 'Severely Wasting' or (s_bbu == 'Wasting' and z_bbu < -3): return 'Severely Wasting'
    if s_tbu == 'Stunting': return 'Stunting'
    if s_bbtb == 'Wasting' or (s_bbu == 'Wasting' and z_bbu < -2): return 'Wasting'
    if s_bbtb == 'Obesitas' or s_bbu == 'Obesitas': return 'Obesitas'
    if s_bbtb == 'Gizi Lebih' or s_bbu == 'Gizi Lebih': return 'Gizi Lebih'
    if s_bbtb == 'Risiko Gizi Lebih' or s_bbu == 'Risiko Gizi Lebih': return 'Risiko Gizi Lebih'
    return 'Normal'


# --- Source data (mirrors mock-data.ts) ---
seed_balita = [
    (1, 'Laki-laki'),  (2, 'Perempuan'), (3, 'Laki-laki'),  (4, 'Perempuan'),
    (5, 'Laki-laki'),  (6, 'Perempuan'), (7, 'Laki-laki'),  (8, 'Perempuan'),
    (9, 'Laki-laki'),  (10, 'Perempuan'),
]

# (id, balitaId, tanggalPengukuran, usiaBulan, beratBadanKg, tinggiBadanCm)
#
# NOTE on adjusted measurements (Fase 2.6):
# The previous seed used fabricated Z-Scores that did not match the real WHO
# LMS engine. After regenerating honestly with the corrected hitungZScore,
# most non-showcase children landed in "Risiko Gizi Lebih" / "Gizi Lebih"
# because their original BB/TB values were above the WHO median.
#
# To produce a clinically realistic demo distribution (~80% Normal, ~10%
# Stunting, ~10% Wasting), the BB/TB values for non-showcase children were
# tuned via scripts/tune_seed_measurements.py to land all three Z-Score
# indicators in their WHO Normal bands.
#
# Showcase cases (kept extreme):
#   • Bagas (id 9, Stunting) — TB ≈ -2.25 SD below median.
#   • Zahra (id 10, Wasting) — BB ≈ -2.66 SD below median (BB/U driven).
seed_pengukuran = [
    # Budi Santoso (L, ~14mo) — Normal
    (101, 1, '2026-01-15', 14, 7.9, 74.6),
    (102, 1, '2025-12-12', 13, 7.9, 73.9),  # bumped +0.2 kg for safety margin
    (103, 1, '2025-11-14', 12, 7.6, 72.6),
    # Aisyah Putri (P, ~8mo) — Normal
    (201, 2, '2026-01-15', 8, 6.3, 66.7),
    (202, 2, '2025-12-10', 7, 6.0, 65.0),
    # Rizky Pratama (L, ~22mo) — Normal
    (301, 3, '2026-01-15', 22, 8.9, 79.0),
    (302, 3, '2025-12-15', 21, 8.8, 79.0),
    # Cinta Laura (P, ~11mo) — Normal
    (401, 4, '2026-01-15', 11, 6.8, 69.8),
    # Dika Anggara (L, ~34mo) — Normal
    (501, 5, '2026-01-15', 34, 10.1, 84.8),
    (502, 5, '2025-12-15', 33, 10.0, 84.8),
    # Nadia (P, ~14mo) — Normal
    (601, 6, '2026-01-15', 14, 7.3, 71.8),
    # Arkan (L, ~18mo) — Normal
    (701, 7, '2026-01-15', 18, 8.4, 76.8),
    # Kayla (P, ~24mo) — Normal
    (801, 8, '2026-01-15', 24, 8.5, 77.5),  # bumped +0.2 kg for safety margin
    # Bagas Pratomo (L, ~16mo) — STUNTING case (TB ≈ -2.25 SD below median)
    (901, 9, '2026-01-15', 16, 7.5, 69),
    (902, 9, '2025-12-15', 15, 7.3, 68),
    (903, 9, '2025-11-15', 14, 7.1, 67),
    # Zahra Khairunnisa (P, ~13mo) — WASTING case (BB ≈ -2.66 SD below median)
    (1001, 10, '2026-01-15', 13, 6.5, 72),
    (1002, 10, '2025-12-15', 12, 6.3, 71),
]


def fmt_z(z):
    if math.isnan(z):
        return 'NaN'
    return f'{z}'


def main():
    print('// === RECOMPUTED seedPengukuran (Z-Scores via corrected WHO LMS engine) ===')
    print('// Format mirrors PengukuranBalita type. NaN = measurement outside WHO range.')
    print('export const seedPengukuran: PengukuranBalita[] = [')
    for (pid, bid, tgl, umur, bb, tb) in seed_pengukuran:
        jk = next(j for (i, j) in seed_balita if i == bid)
        z_bbu = hitung_z(jk, 'BBU', umur, bb)
        z_tbu = hitung_z(jk, 'TBU', umur, tb, tb)
        z_bbtb = hitung_z(jk, 'BBTB', umur, bb, tb)
        status = overall_status(z_bbu, z_tbu, z_bbtb)
        print(
            f"  {{ id: {pid}, balitaId: {bid}, tanggalPengukuran: '{tgl}', "
            f"usiaBulan: {umur}, beratBadanKg: {bb}, tinggiBadanCm: {tb}, "
            f"zScoreBBU: {fmt_z(z_bbu)}, zScoreTBU: {fmt_z(z_tbu)}, zScoreBBTB: {fmt_z(z_bbtb)}, "
            f"statusGizi: '{status}' }},"
        )
    print('];')
    print()

    # Verify intended cases
    print('// === INTENDED CASE VERIFICATION ===', file=sys.stderr)
    for (pid, bid, tgl, umur, bb, tb) in seed_pengukuran:
        jk = next(j for (i, j) in seed_balita if i == bid)
        z_bbu = hitung_z(jk, 'BBU', umur, bb)
        z_tbu = hitung_z(jk, 'TBU', umur, tb, tb)
        z_bbtb = hitung_z(jk, 'BBTB', umur, bb, tb)
        status = overall_status(z_bbu, z_tbu, z_bbtb)
        name_map = {1: 'Budi', 2: 'Aisyah', 3: 'Rizky', 4: 'Cinta', 5: 'Dika',
                    6: 'Nadia', 7: 'Arkan', 8: 'Kayla', 9: 'Bagas', 10: 'Zahra'}
        name = name_map.get(bid, f'balita#{bid}')
        flag = ''
        if bid == 9 and status != 'Stunting' and status != 'Severely Stunting':
            flag = ' ⚠️ expected Stunting/Severely Stunting'
        if bid == 10 and status != 'Wasting' and status != 'Severely Wasting':
            flag = ' ⚠️ expected Wasting/Severely Wasting'
        print(f"  id={pid:4d} {name:8s} (L/P={'L' if jk=='Laki-laki' else 'P'}, umur={umur:2d}mo, bb={bb:4.1f}kg, tb={tb:4.1f}cm) → BBU={fmt_z(z_bbu):>6}, TBU={fmt_z(z_tbu):>6}, BBTB={fmt_z(z_bbtb):>6} → {status}{flag}", file=sys.stderr)


if __name__ == '__main__':
    main()
