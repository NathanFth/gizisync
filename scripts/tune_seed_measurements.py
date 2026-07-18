#!/usr/bin/env python3
"""
tune_seed_measurements.py — Find BB/TB values for non-showcase seed children
that land all three Z-Score indicators (BBU, TBU, BBTB) in the WHO Normal
range, producing an overall status of 'Normal'.

Approach: for each (sex, age) pair, search the BB×TB grid (0.1 kg × 0.5 cm
steps) and pick the combination that minimizes |Z_BBU| + |Z_TBU| + |Z_BBTB|
subject to all three Z's being in their Normal bands:
    BBU:  -2 ≤ Z ≤ 1
    TBU:  -2 ≤ Z ≤ 3   (effectively anything > -2)
    BBTB: -2 ≤ Z ≤ 1

Showcase cases (Bagas=Stunting, Zahra=Wasting) are NOT tuned here — their
measurements are set explicitly in recompute_seed_zscores.py.
"""

from __future__ import annotations

import math
import sys
from pathlib import Path
import importlib.util

SCRIPT_DIR = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("build_who_reference", SCRIPT_DIR / "build_who_reference.py")
bwr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bwr)


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


def hitung_z(jenis_kelamin, indikator, umur, nilai, tinggi=None):
    is_boy = jenis_kelamin == 'Laki-laki'
    if indikator == 'BBU':
        if umur < 0 or umur > 60: return float('nan')
        table = bwr.WFA_BOYS if is_boy else bwr.WFA_GIRLS
        key = umur
    elif indikator == 'TBU':
        if umur < 0 or umur > 60: return float('nan')
        table = bwr.HFA_BOYS if is_boy else bwr.HFA_GIRLS
        key = umur
    else:
        if tinggi is None or tinggi < 45 or tinggi > 120: return float('nan')
        table = bwr.WFH_BOYS if is_boy else bwr.WFH_GIRLS
        key = tinggi
    lms = interpolate_lms(table, key)
    if not lms: return float('nan')
    L, M, S = lms
    X = tinggi if (indikator == 'TBU' and tinggi is not None) else nilai
    if X <= 0 or M <= 0 or S <= 0: return float('nan')
    if abs(L) < 1e-7:
        z = math.log(X / M) / S
    else:
        z = (math.pow(X / M, L) - 1) / (L * S)
    return round(z, 2)


def in_normal_band(z_bbu, z_tbu, z_bbtb):
    """All three indicators must be in their WHO Normal bands."""
    if math.isnan(z_bbu) or math.isnan(z_tbu) or math.isnan(z_bbtb):
        return False
    return (-2 <= z_bbu <= 1) and (-2 <= z_tbu <= 3) and (-2 <= z_bbtb <= 1)


def tune(sex, age):
    """Find BB/TB that lands all three indicators in Normal range, minimizing |Z|."""
    best = None  # (score, bb, tb, z_bbu, z_tbu, z_bbtb)
    # Search TB around the WHO HFA median for this age (±3 cm, 0.5 cm step)
    is_boy = sex == 'Laki-laki'
    hfa_table = bwr.HFA_BOYS if is_boy else bwr.HFA_GIRLS
    median_tb = hfa_table[age][1]
    tb_min = max(45, median_tb - 4)
    tb_max = min(120, median_tb + 4)

    tb = tb_min
    while tb <= tb_max:
        # Search BB in a window around the WFH median for this TB
        wfh_table = bwr.WFH_BOYS if is_boy else bwr.WFH_GIRLS
        if round(tb) not in wfh_table:
            tb += 0.5
            continue
        wfh_m = wfh_table[round(tb)][1]
        bb_min = max(1.0, wfh_m - 2.0)
        bb_max = wfh_m + 2.0
        bb = bb_min
        while bb <= bb_max:
            z_bbu = hitung_z(sex, 'BBU', age, bb)
            z_tbu = hitung_z(sex, 'TBU', age, tb, tb)
            z_bbtb = hitung_z(sex, 'BBTB', age, bb, tb)
            if in_normal_band(z_bbu, z_tbu, z_bbtb):
                # Prefer solutions where all three Z's are close to 0
                score = abs(z_bbu) + abs(z_tbu) + abs(z_bbtb)
                # Slight preference for TB closer to median (avoids extreme heights)
                score += abs(tb - median_tb) * 0.05
                if best is None or score < best[0]:
                    best = (score, round(bb, 1), round(tb, 1), z_bbu, z_tbu, z_bbtb)
            bb += 0.1
        tb += 0.5
    return best


def main():
    cases = [
        # (id, balitaId, tanggal, umur, sex, label)
        (101, 1, '2026-01-15', 14, 'Laki-laki', 'Budi'),
        (102, 1, '2025-12-12', 13, 'Laki-laki', 'Budi'),
        (103, 1, '2025-11-14', 12, 'Laki-laki', 'Budi'),
        (201, 2, '2026-01-15', 8,  'Perempuan', 'Aisyah'),
        (202, 2, '2025-12-10', 7,  'Perempuan', 'Aisyah'),
        (301, 3, '2026-01-15', 22, 'Laki-laki', 'Rizky'),
        (302, 3, '2025-12-15', 21, 'Laki-laki', 'Rizky'),
        (401, 4, '2026-01-15', 11, 'Perempuan', 'Cinta'),
        (501, 5, '2026-01-15', 34, 'Laki-laki', 'Dika'),
        (502, 5, '2025-12-15', 33, 'Laki-laki', 'Dika'),
        (601, 6, '2026-01-15', 14, 'Perempuan', 'Nadia'),
        (701, 7, '2026-01-15', 18, 'Laki-laki', 'Arkan'),
        (801, 8, '2026-01-15', 24, 'Perempuan', 'Kayla'),
    ]

    print('// === TUNED MEASUREMENTS (target: overall status = Normal) ===')
    print('// Format: (id, balitaId, tanggal, umur, BB, TB) — ready to paste into seed_pengukuran')
    print()
    for (pid, bid, tgl, umur, sex, name) in cases:
        best = tune(sex, umur)
        if best is None:
            print(f'  // ⚠️ {name} (id={pid}, {sex}, {umur}mo): NO Normal solution found')
            continue
        score, bb, tb, z_bbu, z_tbu, z_bbtb = best
        print(f"  ({pid}, {bid}, '{tgl}', {umur}, {bb}, {tb}),  // {name} {umur}mo → BBU={z_bbu:+.2f}, TBU={z_tbu:+.2f}, BBTB={z_bbtb:+.2f} → Normal (score={score:.2f})")


if __name__ == '__main__':
    main()
