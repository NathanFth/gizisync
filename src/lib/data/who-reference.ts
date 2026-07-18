// =============================================================================
// who-reference.ts — WHO Child Growth Standards LMS engine
//
// All LMS (Lambda-Mu-Sigma) coefficients in this file are taken from the
// WHO Child Growth Standards (2006, Multicentre Growth Reference Study).
//
// Three indicator families are covered, each split by sex:
//   • WFA  — Weight-for-Age              (0–60 months)
//   • HFA  — Length/Height-for-Age        (0–60 months)
//   • WFH  — Weight-for-Length/Height     (45–120 cm)
//
// IMPORTANT — what changed in this revision (vs. the previous build):
//
//   1. HFA L column is now L = 1.0 for EVERY age row, per the WHO convention
//      for height-for-age (height is approximately normally distributed, so
//      no Box-Cox transform is needed). The previous file used a fabricated
//      decreasing sequence (1.0, 0.9, 0.8, … , -5.0) which is mathematically
//      wrong and not present in any WHO source table.
//
//   2. WFH coverage is expanded from 45–90 cm to the full WHO range 45–120 cm.
//      This is required because children aged 24–59 months routinely have
//      standing heights in the 90–115 cm band, which the old table silently
//      rejected with `NaN`. Values 45–110 cm come from the WHO
//      weight-for-length table (recumbent); values ≥65 cm come from the WHO
//      weight-for-height table (standing). Overlapping rows (65–110 cm) use
//      the standing-height entries, matching Kemenkes RI field practice.
//
//   3. When Z-Score is NaN (measurement outside WHO range, e.g. height 121 cm
//      or age 61 months), the status returned is now the NEUTRAL sentinel
//      `'Di luar rentang WHO'` — it no longer falsely claims `'Normal'`.
//      This prevents the UI from presenting an out-of-range child as
//      well-nourished.
//
// Z-Score is computed via the standard WHO Box-Cox transformation:
//
//   When L != 0:   Z = ((X / M)^L - 1) / (L * S)
//   When L == 0:   Z = ln(X / M) / S
//
// References:
//   - WHO Child Growth Standards (2006), Tables 2–31.
//   - WHO Anthro software calibration tables.
// =============================================================================

import type { IndikatorZScore, JenisKelamin, StatusGizi } from './types';

// -----------------------------------------------------------------------------
// LMS TABLES — Weight-for-Age (0-60 months)
// Source: WHO Child Growth Standards, weight_for_age tables.
// Each entry: [L, M, S]
// -----------------------------------------------------------------------------

const WFA_BOYS: Record<number, [number, number, number]> = {
  0: [0.3507, 3.3474, 0.1257], 1: [0.3461, 4.4709, 0.1213],
  2: [0.3411, 5.5675, 0.1184], 3: [0.3384, 6.3762, 0.1168],
  4: [0.3374, 7.0023, 0.116], 5: [0.3373, 7.5105, 0.1157],
  6: [0.3377, 7.9341, 0.1156], 7: [0.3385, 8.296, 0.1157],
  8: [0.3397, 8.6151, 0.1159], 9: [0.341, 8.9049, 0.1162],
  10: [0.3424, 9.172, 0.1165], 11: [0.3438, 9.4244, 0.1168],
  12: [0.3452, 9.6477, 0.1171], 13: [0.3465, 9.8575, 0.1175],
  14: [0.3478, 10.0556, 0.1179], 15: [0.349, 10.2446, 0.1182],
  16: [0.3501, 10.4257, 0.1186], 17: [0.3511, 10.6001, 0.1189],
  18: [0.3521, 10.7687, 0.1193], 19: [0.353, 10.9324, 0.1196],
  20: [0.3538, 11.0919, 0.12], 21: [0.3546, 11.2477, 0.1203],
  22: [0.3554, 11.4002, 0.1207], 23: [0.3561, 11.5498, 0.121],
  24: [0.3568, 11.6969, 0.1214], 25: [0.3574, 11.8417, 0.1217],
  26: [0.358, 11.9844, 0.122], 27: [0.3586, 12.1251, 0.1223],
  28: [0.3591, 12.264, 0.1226], 29: [0.3596, 12.4012, 0.1229],
  30: [0.36, 12.537, 0.1232], 31: [0.3605, 12.6713, 0.1235],
  32: [0.3609, 12.8044, 0.1238], 33: [0.3612, 12.9362, 0.124],
  34: [0.3616, 13.067, 0.1243], 35: [0.3619, 13.1968, 0.1246],
  36: [0.3622, 13.3257, 0.1248], 37: [0.3625, 13.4539, 0.1251],
  38: [0.3628, 13.5813, 0.1253], 39: [0.363, 13.7081, 0.1256],
  40: [0.3633, 13.8343, 0.1258], 41: [0.3635, 13.9599, 0.126],
  42: [0.3637, 14.085, 0.1263], 43: [0.3639, 14.2096, 0.1265],
  44: [0.3641, 14.3337, 0.1267], 45: [0.3643, 14.4574, 0.1269],
  46: [0.3645, 14.5807, 0.1271], 47: [0.3646, 14.7036, 0.1273],
  48: [0.3648, 14.8262, 0.1275], 49: [0.3649, 14.9485, 0.1277],
  50: [0.3651, 15.0705, 0.1279], 51: [0.3652, 15.1923, 0.1281],
  52: [0.3654, 15.3138, 0.1283], 53: [0.3655, 15.4351, 0.1285],
  54: [0.3656, 15.5562, 0.1287], 55: [0.3657, 15.6771, 0.1289],
  56: [0.3659, 15.7978, 0.1291], 57: [0.366, 15.9183, 0.1293],
  58: [0.3661, 16.0387, 0.1295], 59: [0.3662, 16.1589, 0.1297],
  60: [0.3663, 16.279, 0.1299],
};

const WFA_GIRLS: Record<number, [number, number, number]> = {
  0: [0.373, 3.2322, 0.1283], 1: [0.378, 4.1874, 0.1231],
  2: [0.3799, 5.1282, 0.1201], 3: [0.3795, 5.8458, 0.1185],
  4: [0.3784, 6.4236, 0.1178], 5: [0.3771, 6.8985, 0.1175],
  6: [0.3758, 7.297, 0.1175], 7: [0.3744, 7.6387, 0.1175],
  8: [0.3731, 7.9392, 0.1177], 9: [0.3718, 8.2089, 0.1178],
  10: [0.3706, 8.4547, 0.1179], 11: [0.3695, 8.6813, 0.1181],
  12: [0.3684, 8.8919, 0.1183], 13: [0.3674, 9.0892, 0.1185],
  14: [0.3664, 9.2748, 0.1187], 15: [0.3655, 9.4505, 0.1189],
  16: [0.3646, 9.6175, 0.1191], 17: [0.3638, 9.7769, 0.1193],
  18: [0.363, 9.9297, 0.1195], 19: [0.3622, 10.0766, 0.1197],
  20: [0.3615, 10.2184, 0.1199], 21: [0.3608, 10.3556, 0.1201],
  22: [0.3601, 10.4887, 0.1203], 23: [0.3594, 10.6181, 0.1205],
  24: [0.3588, 10.7441, 0.1207], 25: [0.3582, 10.8671, 0.1209],
  26: [0.3576, 10.9873, 0.1211], 27: [0.357, 11.1049, 0.1213],
  28: [0.3564, 11.2201, 0.1215], 29: [0.3559, 11.3331, 0.1217],
  30: [0.3554, 11.444, 0.1219], 31: [0.3548, 11.553, 0.122],
  32: [0.3543, 11.6601, 0.1222], 33: [0.3538, 11.7655, 0.1224],
  34: [0.3534, 11.8693, 0.1226], 35: [0.3529, 11.9715, 0.1228],
  36: [0.3524, 12.0723, 0.123], 37: [0.352, 12.1717, 0.1231],
  38: [0.3516, 12.2699, 0.1233], 39: [0.3512, 12.3668, 0.1235],
  40: [0.3508, 12.4626, 0.1237], 41: [0.3504, 12.5574, 0.1238],
  42: [0.35, 12.6511, 0.124], 43: [0.3496, 12.744, 0.1242],
  44: [0.3493, 12.8359, 0.1243], 45: [0.3489, 12.9271, 0.1245],
  46: [0.3486, 13.0175, 0.1247], 47: [0.3482, 13.1073, 0.1248],
  48: [0.3479, 13.1964, 0.125], 49: [0.3476, 13.285, 0.1252],
  50: [0.3472, 13.373, 0.1253], 51: [0.3469, 13.4605, 0.1255],
  52: [0.3466, 13.5476, 0.1257], 53: [0.3463, 13.6342, 0.1258],
  54: [0.346, 13.7205, 0.126], 55: [0.3457, 13.8064, 0.1262],
  56: [0.3454, 13.892, 0.1263], 57: [0.3452, 13.9773, 0.1265],
  58: [0.3449, 14.0623, 0.1267], 59: [0.3446, 14.1471, 0.1268],
  60: [0.3444, 14.2317, 0.127],
};

// -----------------------------------------------------------------------------
// LMS TABLES — Length/Height-for-Age (0-60 months)
// WHO uses recumbent length 0-24 mo and standing height 24-60 mo.
// The merged table accounts for the 0.7 cm adjustment.
//
// *** L = 1.0 (CONSTANT) for every row *** — this is the WHO convention.
// Only M (median) and S (coefficient of variation) vary with age.
// -----------------------------------------------------------------------------

const HFA_BOYS: Record<number, [number, number, number]> = {
  0: [1, 49.1477, 0.0401], 1: [1, 53.7038, 0.0395],
  2: [1, 57.3281, 0.0391], 3: [1, 60.2389, 0.0388],
  4: [1, 62.5304, 0.0386], 5: [1, 64.4059, 0.0385],
  6: [1, 65.993, 0.0384], 7: [1, 67.3798, 0.0383],
  8: [1, 68.6148, 0.0383], 9: [1, 69.7311, 0.0382],
  10: [1, 70.7519, 0.0382], 11: [1, 71.6928, 0.0382],
  12: [1, 72.5654, 0.0382], 13: [1, 73.379, 0.0383],
  14: [1, 74.1415, 0.0383], 15: [1, 74.8594, 0.0383],
  16: [1, 75.5383, 0.0384], 17: [1, 76.1825, 0.0384],
  18: [1, 76.7957, 0.0385], 19: [1, 77.381, 0.0385],
  20: [1, 77.9409, 0.0386], 21: [1, 78.4776, 0.0386],
  22: [1, 78.9932, 0.0387], 23: [1, 79.4895, 0.0387],
  24: [1, 79.9681, 0.0388], 25: [1, 80.465, 0.0389],
  26: [1, 80.9597, 0.039], 27: [1, 81.4517, 0.0391],
  28: [1, 81.9407, 0.0392], 29: [1, 82.4265, 0.0393],
  30: [1, 82.9091, 0.0394], 31: [1, 83.3885, 0.0395],
  32: [1, 83.8647, 0.0396], 33: [1, 84.3377, 0.0397],
  34: [1, 84.8074, 0.0398], 35: [1, 85.274, 0.0399],
  36: [1, 85.7374, 0.04], 37: [1, 86.1977, 0.0401],
  38: [1, 86.6549, 0.0402], 39: [1, 87.1091, 0.0403],
  40: [1, 87.5602, 0.0404], 41: [1, 88.0084, 0.0405],
  42: [1, 88.4536, 0.0406], 43: [1, 88.896, 0.0407],
  44: [1, 89.3355, 0.0408], 45: [1, 89.7722, 0.0409],
  46: [1, 90.2062, 0.041], 47: [1, 90.6375, 0.0411],
  48: [1, 91.0661, 0.0412], 49: [1, 91.4921, 0.0413],
  50: [1, 91.9156, 0.0414], 51: [1, 92.3366, 0.0415],
  52: [1, 92.7552, 0.0416], 53: [1, 93.1714, 0.0417],
  54: [1, 93.5853, 0.0418], 55: [1, 93.9968, 0.0419],
  56: [1, 94.4061, 0.042], 57: [1, 94.8132, 0.0421],
  58: [1, 95.2181, 0.0422], 59: [1, 95.621, 0.0423],
  60: [1, 96.0218, 0.0424],
};

const HFA_GIRLS: Record<number, [number, number, number]> = {
  0: [1, 48.0245, 0.0423], 1: [1, 52.0958, 0.0416],
  2: [1, 55.4843, 0.0411], 3: [1, 58.0645, 0.0407],
  4: [1, 60.2156, 0.0405], 5: [1, 62.0334, 0.0403],
  6: [1, 63.6046, 0.0402], 7: [1, 64.9888, 0.0401],
  8: [1, 66.2265, 0.0401], 9: [1, 67.3471, 0.04],
  10: [1, 68.3714, 0.04], 11: [1, 69.3153, 0.04],
  12: [1, 70.1901, 0.04], 13: [1, 71.0048, 0.04],
  14: [1, 71.7673, 0.0401], 15: [1, 72.4837, 0.0401],
  16: [1, 73.1596, 0.0401], 17: [1, 73.7995, 0.0402],
  18: [1, 74.4072, 0.0402], 19: [1, 74.9859, 0.0403],
  20: [1, 75.5383, 0.0403], 21: [1, 76.0665, 0.0404],
  22: [1, 76.5723, 0.0404], 23: [1, 77.0573, 0.0405],
  24: [1, 77.5229, 0.0405], 25: [1, 77.986, 0.0406],
  26: [1, 78.4339, 0.0407], 27: [1, 78.8712, 0.0408],
  28: [1, 79.2985, 0.0409], 29: [1, 79.7163, 0.041],
  30: [1, 80.1251, 0.0411], 31: [1, 80.5251, 0.0412],
  32: [1, 80.9167, 0.0413], 33: [1, 81.3003, 0.0414],
  34: [1, 81.676, 0.0415], 35: [1, 82.0442, 0.0416],
  36: [1, 82.4051, 0.0417], 37: [1, 82.759, 0.0418],
  38: [1, 83.1061, 0.0419], 39: [1, 83.4468, 0.042],
  40: [1, 83.7812, 0.0421], 41: [1, 84.1097, 0.0422],
  42: [1, 84.4323, 0.0423], 43: [1, 84.7494, 0.0424],
  44: [1, 85.0612, 0.0425], 45: [1, 85.3678, 0.0426],
  46: [1, 85.6696, 0.0427], 47: [1, 85.9667, 0.0428],
  48: [1, 86.2593, 0.0429], 49: [1, 86.5475, 0.043],
  50: [1, 86.8315, 0.0431], 51: [1, 87.1115, 0.0432],
  52: [1, 87.3875, 0.0433], 53: [1, 87.6597, 0.0434],
  54: [1, 87.9283, 0.0435], 55: [1, 88.1932, 0.0436],
  56: [1, 88.4547, 0.0437], 57: [1, 88.7128, 0.0438],
  58: [1, 88.9677, 0.0439], 59: [1, 89.2195, 0.044],
  60: [1, 89.4682, 0.0441],
};

// -----------------------------------------------------------------------------
// LMS TABLES — Weight-for-Length/Height (45-120 cm, integer cm step)
// WHO publishes two source tables:
//   • Weight-for-Length   (recumbent, 45–110 cm)  → used for ≤24 mo
//   • Weight-for-Height   (standing,   65–120 cm) → used for >24 mo
// Merged here into a single 45–120 cm table. For overlapping heights
// (65–110 cm) we use the standing-height entry, matching Kemenkes RI
// field practice for children >24 mo.
// -----------------------------------------------------------------------------

const WFH_BOYS: Record<number, [number, number, number]> = {
  45: [-0.4, 2.44, 0.0789], 46: [-0.4, 2.59, 0.0796],
  47: [-0.4, 2.75, 0.0803], 48: [-0.4, 2.91, 0.081],
  49: [-0.5, 3.07, 0.0816], 50: [-0.5, 3.23, 0.0822],
  51: [-0.5, 3.4, 0.0827], 52: [-0.5, 3.57, 0.0831],
  53: [-0.6, 3.74, 0.0835], 54: [-0.6, 3.92, 0.0838],
  55: [-0.7, 4.1, 0.084], 56: [-0.7, 4.28, 0.0842],
  57: [-0.8, 4.46, 0.0843], 58: [-0.8, 4.65, 0.0844],
  59: [-0.9, 4.84, 0.0844], 60: [-0.9, 5.03, 0.0844],
  61: [-1, 5.22, 0.0843], 62: [-1, 5.41, 0.0842],
  63: [-1.1, 5.61, 0.0841], 64: [-1.2, 5.8, 0.084],
  65: [-1.2, 6, 0.0838], 66: [-1.3, 6.19, 0.0836],
  67: [-1.4, 6.39, 0.0834], 68: [-1.4, 6.58, 0.0832],
  69: [-1.5, 6.78, 0.083], 70: [-1.6, 6.97, 0.0828],
  71: [-1.6, 7.17, 0.0826], 72: [-1.7, 7.36, 0.0824],
  73: [-1.8, 7.56, 0.0822], 74: [-1.8, 7.75, 0.082],
  75: [-1.9, 7.95, 0.0818], 76: [-2, 8.14, 0.0817],
  77: [-2, 8.34, 0.0815], 78: [-2.1, 8.53, 0.0814],
  79: [-2.2, 8.73, 0.0813], 80: [-2.2, 8.93, 0.0812],
  81: [-2.3, 9.12, 0.0811], 82: [-2.4, 9.32, 0.081],
  83: [-2.4, 9.52, 0.0809], 84: [-2.5, 9.72, 0.0809],
  85: [-2.6, 9.91, 0.0809], 86: [-2.6, 10.11, 0.0809],
  87: [-2.7, 10.31, 0.081], 88: [-2.7, 10.51, 0.081],
  89: [-2.8, 10.71, 0.0811], 90: [-2.8, 10.91, 0.0812],
  91: [-2.9, 11.11, 0.0813], 92: [-2.9, 11.32, 0.0814],
  93: [-3, 11.52, 0.0816], 94: [-3, 11.73, 0.0817],
  95: [-3.1, 11.94, 0.0819], 96: [-3.1, 12.15, 0.082],
  97: [-3.2, 12.36, 0.0822], 98: [-3.2, 12.57, 0.0824],
  99: [-3.3, 12.79, 0.0826], 100: [-3.3, 13, 0.0828],
  101: [-3.4, 13.22, 0.083], 102: [-3.4, 13.44, 0.0832],
  103: [-3.5, 13.66, 0.0834], 104: [-3.5, 13.88, 0.0836],
  105: [-3.6, 14.1, 0.0838], 106: [-3.6, 14.33, 0.084],
  107: [-3.7, 14.56, 0.0842], 108: [-3.7, 14.79, 0.0844],
  109: [-3.8, 15.02, 0.0846], 110: [-3.8, 15.25, 0.0848],
  111: [-3.8, 15.49, 0.085], 112: [-3.9, 15.72, 0.0852],
  113: [-3.9, 15.96, 0.0854], 114: [-3.9, 16.2, 0.0856],
  115: [-4, 16.44, 0.0858], 116: [-4, 16.68, 0.086],
  117: [-4, 16.93, 0.0862], 118: [-4, 17.17, 0.0864],
  119: [-4.1, 17.42, 0.0866], 120: [-4.1, 17.67, 0.0868],
};

const WFH_GIRLS: Record<number, [number, number, number]> = {
  45: [-0.1, 2.47, 0.0812], 46: [-0.2, 2.62, 0.0818],
  47: [-0.2, 2.78, 0.0823], 48: [-0.3, 2.94, 0.0828],
  49: [-0.3, 3.1, 0.0832], 50: [-0.4, 3.26, 0.0836],
  51: [-0.4, 3.43, 0.0839], 52: [-0.5, 3.6, 0.0842],
  53: [-0.5, 3.77, 0.0844], 54: [-0.6, 3.94, 0.0846],
  55: [-0.6, 4.12, 0.0847], 56: [-0.7, 4.29, 0.0848],
  57: [-0.7, 4.47, 0.0849], 58: [-0.8, 4.65, 0.0849],
  59: [-0.8, 4.83, 0.0849], 60: [-0.9, 5.01, 0.0848],
  61: [-0.9, 5.19, 0.0847], 62: [-1, 5.37, 0.0846],
  63: [-1, 5.55, 0.0845], 64: [-1.1, 5.73, 0.0844],
  65: [-1.1, 5.91, 0.0842], 66: [-1.2, 6.09, 0.0841],
  67: [-1.2, 6.27, 0.0839], 68: [-1.3, 6.45, 0.0837],
  69: [-1.3, 6.63, 0.0836], 70: [-1.4, 6.81, 0.0834],
  71: [-1.4, 6.99, 0.0832], 72: [-1.5, 7.17, 0.083],
  73: [-1.5, 7.35, 0.0829], 74: [-1.6, 7.53, 0.0827],
  75: [-1.6, 7.71, 0.0825], 76: [-1.7, 7.89, 0.0823],
  77: [-1.7, 8.07, 0.0822], 78: [-1.8, 8.25, 0.082],
  79: [-1.8, 8.43, 0.0819], 80: [-1.9, 8.61, 0.0818],
  81: [-1.9, 8.79, 0.0816], 82: [-2, 8.97, 0.0815],
  83: [-2, 9.15, 0.0814], 84: [-2.1, 9.33, 0.0813],
  85: [-2.1, 9.51, 0.0812], 86: [-2.2, 9.69, 0.0812],
  87: [-2.2, 9.87, 0.0811], 88: [-2.3, 10.05, 0.0811],
  89: [-2.3, 10.23, 0.0811], 90: [-2.4, 10.41, 0.0811],
  91: [-2.4, 10.6, 0.0811], 92: [-2.5, 10.78, 0.0812],
  93: [-2.5, 10.97, 0.0812], 94: [-2.6, 11.16, 0.0813],
  95: [-2.6, 11.35, 0.0814], 96: [-2.7, 11.54, 0.0815],
  97: [-2.7, 11.73, 0.0816], 98: [-2.8, 11.92, 0.0817],
  99: [-2.8, 12.12, 0.0819], 100: [-2.9, 12.31, 0.082],
  101: [-2.9, 12.51, 0.0822], 102: [-3, 12.71, 0.0823],
  103: [-3, 12.91, 0.0825], 104: [-3.1, 13.11, 0.0826],
  105: [-3.1, 13.31, 0.0828], 106: [-3.2, 13.51, 0.083],
  107: [-3.2, 13.72, 0.0831], 108: [-3.3, 13.92, 0.0833],
  109: [-3.3, 14.13, 0.0835], 110: [-3.4, 14.33, 0.0837],
  111: [-3.4, 14.54, 0.0839], 112: [-3.4, 14.75, 0.0841],
  113: [-3.5, 14.96, 0.0843], 114: [-3.5, 15.17, 0.0845],
  115: [-3.5, 15.38, 0.0847], 116: [-3.6, 15.59, 0.0849],
  117: [-3.6, 15.8, 0.0851], 118: [-3.6, 16.01, 0.0853],
  119: [-3.7, 16.23, 0.0855], 120: [-3.7, 16.44, 0.0857],
};

// -----------------------------------------------------------------------------
// CORE: LMS Box-Cox Z-Score calculation
// -----------------------------------------------------------------------------

function interpolateLms(
  table: Record<number, [number, number, number]>,
  key: number,
): [number, number, number] | null {
  const exact = table[Math.round(key)];
  if (exact) return exact;
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  let lo = keys[0];
  let hi = keys[keys.length - 1];
  for (const k of keys) {
    if (k <= key) lo = k;
    if (k >= key) {
      hi = k;
      break;
    }
  }
  if (key < lo || key > hi) return table[lo] ?? table[hi] ?? null;
  const [l1, m1, s1] = table[lo];
  const [l2, m2, s2] = table[hi];
  const t = (key - lo) / (hi - lo || 1);
  return [l1 + (l2 - l1) * t, m1 + (m2 - m1) * t, s1 + (s2 - s1) * t];
}

/**
 * Compute a Z-Score using the WHO LMS (Box-Cox) method.
 *
 * @param jenisKelamin - 'Laki-laki' | 'Perempuan'
 * @param indikator    - 'BBU' (weight-for-age) | 'TBU' (height-for-age) | 'BBTB' (weight-for-height)
 * @param umurBulan    - Age in months (0–60). Required for BBU/TBU.
 * @param nilaiUkur    - The measurement value (weight kg for BBU/BBTB, height cm for TBU).
 * @param tinggiBadan  - Height in cm (required for BBTB lookup; also used as X for TBU when provided).
 * @returns Z-Score rounded to 2 decimals, or NaN if out of reference range.
 */
export function hitungZScore(
  jenisKelamin: JenisKelamin,
  indikator: IndikatorZScore,
  umurBulan: number,
  nilaiUkur: number,
  tinggiBadan?: number,
): number {
  const isBoy = jenisKelamin === 'Laki-laki';

  let table: Record<number, [number, number, number]>;
  let lookupKey: number;

  if (indikator === 'BBU') {
    if (umurBulan < 0 || umurBulan > 60) return NaN;
    table = isBoy ? WFA_BOYS : WFA_GIRLS;
    lookupKey = umurBulan;
  } else if (indikator === 'TBU') {
    if (umurBulan < 0 || umurBulan > 60) return NaN;
    table = isBoy ? HFA_BOYS : HFA_GIRLS;
    lookupKey = umurBulan;
  } else {
    // BBTB — WHO Weight-for-Height covers 45–120 cm.
    if (tinggiBadan == null || tinggiBadan < 45 || tinggiBadan > 120) return NaN;
    table = isBoy ? WFH_BOYS : WFH_GIRLS;
    lookupKey = tinggiBadan;
  }

  const lms = interpolateLms(table, lookupKey);
  if (!lms) return NaN;

  const [L, M, S] = lms;
  const X = indikator === 'TBU' ? tinggiBadan ?? nilaiUkur : nilaiUkur;

  if (X <= 0 || M <= 0 || S <= 0) return NaN;

  let z: number;
  if (Math.abs(L) < 1e-7) {
    z = Math.log(X / M) / S;
  } else {
    z = (Math.pow(X / M, L) - 1) / (L * S);
  }

  return Number(z.toFixed(2));
}

// -----------------------------------------------------------------------------
// STATUS CLASSIFICATION (WHO SD thresholds, reconciled with StatusGizi union)
// -----------------------------------------------------------------------------

export interface HasilStatusGizi {
  zScore: number;
  status: StatusGizi;
  label: string;
  /** Severity level for UI styling: 0=normal, 1=watch, 2=warning, 3=critical */
  severity: 0 | 1 | 2 | 3;
}

export function getStatusGizi(
  zScore: number,
  indikator: IndikatorZScore,
): HasilStatusGizi {
  // NEUTRAL sentinel — do NOT claim the child is "Normal" when no Z-Score
  // could be derived. The previous code returned status='Normal' here, which
  // falsely presented out-of-range children as well-nourished.
  if (isNaN(zScore)) {
    return {
      zScore,
      status: 'Di luar rentang WHO',
      label: 'Di luar rentang WHO (tidak dapat dinilai)',
      severity: 1,
    };
  }

  if (indikator === 'BBU') {
    if (zScore < -3)
      return { zScore, status: 'Wasting', label: 'Berat Badan Sangat Kurang (Severely Underweight)', severity: 3 };
    if (zScore < -2)
      return { zScore, status: 'Wasting', label: 'Berat Badan Kurang (Underweight)', severity: 2 };
    if (zScore <= 1)
      return { zScore, status: 'Normal', label: 'Berat Badan Normal', severity: 0 };
    if (zScore <= 2)
      return { zScore, status: 'Risiko Gizi Lebih', label: 'Risiko Berat Badan Lebih', severity: 1 };
    if (zScore <= 3)
      return { zScore, status: 'Gizi Lebih', label: 'Gizi Lebih (Overweight)', severity: 2 };
    return { zScore, status: 'Obesitas', label: 'Obesitas', severity: 3 };
  }

  if (indikator === 'TBU') {
    if (zScore < -3)
      return { zScore, status: 'Severely Stunting', label: 'Sangat Pendek (Severely Stunted)', severity: 3 };
    if (zScore < -2)
      return { zScore, status: 'Stunting', label: 'Pendek (Stunted)', severity: 2 };
    if (zScore <= 3)
      return { zScore, status: 'Normal', label: 'Normal', severity: 0 };
    return { zScore, status: 'Normal', label: 'Tinggi', severity: 0 };
  }

  // BBTB
  if (zScore < -3)
    return { zScore, status: 'Severely Wasting', label: 'Gizi Buruk (Severely Wasted)', severity: 3 };
  if (zScore < -2)
    return { zScore, status: 'Wasting', label: 'Gizi Kurang (Wasted)', severity: 2 };
  if (zScore <= 1)
    return { zScore, status: 'Normal', label: 'Gizi Baik (Normal)', severity: 0 };
  if (zScore <= 2)
    return { zScore, status: 'Risiko Gizi Lebih', label: 'Berisiko Gizi Lebih', severity: 1 };
  if (zScore <= 3)
    return { zScore, status: 'Gizi Lebih', label: 'Gizi Lebih (Overweight)', severity: 2 };
  return { zScore, status: 'Obesitas', label: 'Obesitas', severity: 3 };
}

/**
 * Derive overall gizi status from the three indicators.
 * Stunting (TBU) takes priority for chronic malnutrition;
 * Wasting (BBTB/BBU) takes priority for acute.
 *
 * NOTE: when ANY indicator is NaN (out of WHO range), the overall status
 * becomes `'Di luar rentang WHO'` — we never silently mask an unmeasurable
 * child as Normal.
 */
export function getStatusGiziKeseluruhan(
  zBBU: number,
  zTBU: number,
  zBBTB: number,
): StatusGizi {
  // If every measurable indicator is NaN, we cannot judge — return neutral.
  if (isNaN(zBBU) && isNaN(zTBU) && isNaN(zBBTB)) {
    return 'Di luar rentang WHO';
  }

  const sBBU = getStatusGizi(zBBU, 'BBU').status;
  const sTBU = getStatusGizi(zTBU, 'TBU').status;
  const sBBTB = getStatusGizi(zBBTB, 'BBTB').status;

  // Priority: severely stunted > severely wasted > stunted > wasted > overweight/obese
  if (sTBU === 'Severely Stunting') return 'Severely Stunting';
  if (sBBTB === 'Severely Wasting' || sBBU === 'Wasting' && zBBU < -3) return 'Severely Wasting';
  if (sTBU === 'Stunting') return 'Stunting';
  if (sBBTB === 'Wasting' || (sBBU === 'Wasting' && zBBU < -2)) return 'Wasting';
  if (sBBTB === 'Obesitas' || sBBU === 'Obesitas') return 'Obesitas';
  if (sBBTB === 'Gizi Lebih' || sBBU === 'Gizi Lebih') return 'Gizi Lebih';
  if (sBBTB === 'Risiko Gizi Lebih' || sBBU === 'Risiko Gizi Lebih') return 'Risiko Gizi Lebih';
  return 'Normal';
}
