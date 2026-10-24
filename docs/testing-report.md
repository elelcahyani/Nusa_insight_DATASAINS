# NUSA Insight — Comprehensive Testing & Verification Report

**Tanggal Pengujian:** 2026-10-24  
**Versi:** 2.0.0 (Research Artifacts Aligned)  
**Lingkungan Uji:** Windows 11, Python 3.12.10, Node.js 18+, Vite 8, scikit-learn 1.5.2  

---

## 1. Ringkasan Eksekutif Pengujian

Pengujian dilakukan untuk memverifikasi bahwa seluruh data, model, endpoint API, halaman antarmuka pengguna, dan visualisasi telah selaras 100% dengan hasil eksperimen penelitian terbaru (Project 2 Panel 32 Provinsi):

1. **Backend Testing (pytest)**: **31 / 31 test LULUS (PASS)**.
   * `backend/tests/test_api.py`: 26 tes integrasi endpoint API.
   * `backend/tests/test_data_integrity.py`: 3 tes konsistensi panel, missing value, dan eksklusi wilayah.
   * `backend/tests/test_model_evaluation.py`: 2 tes validasi numerik metrik evaluasi dan residual provinsi kunci.
2. **Frontend Type Verification**: **0 Error (`npx tsc --noEmit` PASS)**.
3. **Production Build**: **`npm run build` BERHASIL (PASS)** (vite client production bundle dihasilkan tanpa kegagalan).

---

## 2. Tabel Hasil Uji Otomatis Backend (pytest)

| Test ID | Modul / Test Case | Ekspektasi | Hasil Aktual | Status |
|---|---|---|---|:---:|
| **T01** | `test_health` | HTTP 200, status "ok", data loaded | `{"status":"ok", "data_loaded":true}` | **PASS** |
| **T02** | `test_metadata` | 288 baris model, 314 baris dashboard, 6 eksklusi | Sesuai metadata penelitian | **PASS** |
| **T03** | `test_dashboard_trend` | 9 baris data deret waktu (2017–2025), tanpa NaN error | 9 baris valid JSON | **PASS** |
| **T04** | `test_dashboard_summary_2023` | Cakupan tahun 2023 = 34 provinsi | 34 provinsi | **PASS** |
| **T05** | `test_dashboard_summary_2025` | Cakupan tahun 2025 = 38 provinsi (termasuk 4 pemekaran Papua) | 38 provinsi | **PASS** |
| **T06** | `test_dashboard_summary_invalid_year` | Tahun 1990 mengembalikan HTTP 404 | HTTP 404 Not Found | **PASS** |
| **T07** | `test_provinces_all` | Daftar seluruh provinsi berjumlah 38 | 38 provinsi | **PASS** |
| **T08** | `test_provinces_model_only` | Daftar provinsi model berjumlah 32 (tanpa 6 Papua) | 32 provinsi, Papua 0 | **PASS** |
| **T09** | `test_province_history` | Riwayat Aceh mencakup 2017–2025 | 9 baris lengkap | **PASS** |
| **T10** | `test_province_history_not_found` | Provinsi tidak ada mengembalikan 404 | HTTP 404 | **PASS** |
| **T11** | `test_province_features` | Fitur Aceh 2025 berisi rls, garis, penduduk, kepadatan | Semua fitur > 0 | **PASS** |
| **T12** | `test_province_features_excluded_province` | Fitur Papua mengembalikan 404 (bukan bagian model) | HTTP 404 | **PASS** |
| **T13** | `test_dataset_profile` | Total rows 314, missing values 0, duplicate 0 | Sesuai profil | **PASS** |
| **T14** | `test_dataset_records_pagination` | Paginasi data page 1 size 10 mengembalikan 10 baris | Total 314, returned 10 | **PASS** |
| **T15** | `test_dataset_records_search` | Filter search 'Aceh' hanya menyaring baris Aceh | Seluruh baris adalah Aceh | **PASS** |
| **T16** | `test_evaluation_metrics` | Mengembalikan 4 model evaluasi | 4 model tercantum | **PASS** |
| **T17** | `test_evaluation_metrics_values` | Persistence MAE=0.645, RF=1.488, LR=2.336, Persistence < RF | Persis sesuai data eksperimen | **PASS** |
| **T18** | `test_evaluation_predictions` | Prediksi test target 2025 mencakup 32 provinsi | 32 prediksi per model | **PASS** |
| **T19** | `test_feature_importance` | Total impurity importance = 1.0, kepadatan tertinggi | Sum = 1.0, kepadatan = 0.433 | **PASS** |
| **T20** | `test_predict_valid_rf` | Request valid RF menghasilkan prediksi target $t+1$ | Target 2026, 0 < pred < 100 | **PASS** |
| **T21** | `test_predict_valid_lr` | Request valid LR menghasilkan prediksi target $t+1$ | Target 2024, model linear | **PASS** |
| **T22** | `test_predict_excluded_province` | Request provinsi Papua mengembalikan HTTP 422 | HTTP 422 validasi penolakan | **PASS** |
| **T23** | `test_predict_missing_year_data` | Tahun di luar rentang mengembalikan HTTP 422 | HTTP 422 | **PASS** |
| **T24** | `test_predict_invalid_model_type` | Model 'xgboost' ditolak | HTTP 422 | **PASS** |
| **T25** | `test_predict_no_feature_substitution_with_zero` | Fitur dibaca dari dataset asli, tidak ada substitusi nol | Fitur valid asli | **PASS** |
| **T26** | `test_predict_deterministic` | Model tidak dilatih ulang saat request inferensi | Output identik pada 2 pemanggilan | **PASS** |
| **T27** | `test_dataset_32_provinces` | Integritas file CSV panel model: 288 baris, 32 prov | 288 baris, 0 missing | **PASS** |
| **T28** | `test_feature_target_pairs` | Integritas pasangan fitur-target: 256 baris | 256 baris | **PASS** |
| **T29** | `test_dashboard_dataset_coverage` | Integritas dataset dashboard: 314 baris | 314 baris (34 th 2017-23, 38 th 2024-25) | **PASS** |
| **T30** | `test_metrics_consistency` | Konsistensi numerik perbandingan model testing 2025 | Persistence < RF, RF Base == RF Tuned | **PASS** |
| **T31** | `test_residuals_key_provinces` | Validasi residual kasus NTT (+9.32 pp) dan Bengkulu (+3.82 pp) | Akurat sesuai data evaluasi | **PASS** |

---

## 3. Hasil Verifikasi Frontend & Komponen

1. **Halaman Overview (`Overview.tsx`)**:
   * Data diakses melalui API `/api/dashboard/trend` dan `/api/dashboard/summary`.
   * Disclaimer eksplisit mengenai rata-rata 32 provinsi bukan angka agregat resmi nasional BPS.
   * Peta koropleth aktif hanya untuk 2017–2023; menampilkan fallback tabel untuk 2024–2025.
2. **Halaman Poverty Explorer (`PovertyExplorer.tsx`)**:
   * Menampilkan perbandingan antarprovinsi dengan switch tabel/peta dan filter 32 provinsi model vs 38 provinsi seluruhnya.
   * Mengintegrasikan grafik perbandingan deret waktu antara 2 provinsi.
3. **Halaman Prediction Studio (`PredictionStudio.tsx`)**:
   * Menggunakan 4 fitur asli dari dataset tanpa substitusi nol.
   * Banner peringatan tegas bahwa Persistence Baseline mengungguli Random Forest pada target 2025.
   * Menampilkan visualisasi data aktual vs titik estimasi model.
4. **Halaman Model Comparison (`ModelComparison.tsx`)**:
   * Menampilkan tabel 4 model lengkap (Persistence, RF Base, RF Tuned, Linear Reg).
   * Tidak ada badge "Best Model" untuk RF.
   * Mengintegrasikan scatter plot aktual vs prediksi ($y=x$) dan grafik residual.
   * Analisis studi kasus underprediction (NTT, Bengkulu) dan kecocokan tinggi (DKI Jakarta).
5. **Halaman Historical Analysis (`HistoricalAnalysis.tsx`)**:
   * Menampilkan deret waktu 9 tahun dan delta perubahan tahunan (YoY).
   * Matriks korelasi Pearson & Spearman dengan catatan bahwa korelasi bukan kausalitas.
6. **Halaman Dataset Explorer (`DatasetExplorer.tsx`)**:
   * Penjelasan arsitektur 3 dataset terpisah.
   * Kamus data 7 variabel lengkap dengan tipe data dan satuan.
   * Paginasi data tabular dan fitur ekspor CSV.
7. **Halaman About & Methodology (`Methodology.tsx`)**:
   * Dokumentasi 7 tahapan penelitian, expanding-window validation, dan batasan riset.

---

## 4. Kesimpulan Kualitas

Semua persyaratan revisi menyeluruh telah berhasil diimplementasikan:
- Tidak ada data dummy yang tertanam langsung di kode frontend.
- Seluruh endpoint backend dan skema pydantic kompatibel.
- Seluruh artefak evaluasi dan fakta ilmiah Project 2 tervalidasi secara konsisten.
