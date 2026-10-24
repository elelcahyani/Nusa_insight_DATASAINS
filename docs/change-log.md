# Changelog NUSA Insight

Seluruh perubahan dan revisi sistem NUSA Insight dicatat dalam dokumen ini.

---

## [2.0.0] - 2026-10-24

### 1. Sinkronisasi Data Eksperimen & Artefak
* **Penyelarasan Dataset**: Memisahkan secara tegas dataset dashboard (314 baris, mencakup 38 provinsi di BPS) dengan dataset panel model (288 baris, 32 provinsi konsisten 2017–2025).
* **Eksklusi Wilayah**: Menegaskan pengecualian 6 provinsi di wilayah Papua (Papua, Papua Barat, Papua Selatan, Papua Tengah, Papua Pegunungan, Papua Barat Daya) dari eksperimen pemodelan.
* **Update Metrik Evaluasi**: Menyelaraskan metrik evaluasi final target 2025 dengan data penelitian terbaru:
  * Persistence Baseline: MAE = 0.645 pp, RMSE = 0.765 pp, R² = 0.953
  * Random Forest Tuned: MAE = 1.488 pp, RMSE = 2.280 pp, R² = 0.584
  * Random Forest Baseline: MAE = 1.488 pp, RMSE = 2.280 pp, R² = 0.584
  * Linear Regression: MAE = 2.336 pp, RMSE = 3.185 pp, R² = 0.189

### 2. Backend & API Services
* **`backend/main.py`**:
  * Menambahkan dan menyelaraskan 20+ endpoint REST API.
  * Menambahkan endpoint `/api/provinces` dengan filter parameter `model_only`.
  * Menambahkan endpoint `/api/dashboard/summary?year=YYYY` dan alias `/api/dashboard/year/{year}`.
  * Menambahkan alias response untuk `metrics` dan `test_metrics`, serta `target_actual` dan `kemiskinan_aktual`.
* **`backend/services/data_service.py`**:
  * Menangani sanitasi nilai `NaN` menjadi `None` agar menghasilkan serialisasi JSON yang valid.
  * Mengintegrasikan `dataset_profile.json` secara dinamis.
* **`backend/schemas.py`**:
  * Memperbarui validator model untuk menerima input `random_forest`, `linear_regression`, serta alias `randomforest` dan `linear`.
* **Testing Otomatis**:
  * Memperbarui `test_api.py` (26 test).
  * Membuat `test_data_integrity.py` (3 test).
  * Membuat `test_model_evaluation.py` (2 test).
  * Seluruh 31 tes lulus 100%.

### 3. Frontend & Antarmuka Pengguna
* **`src/types/index.ts`**:
  * Menyatukan tipe TypeScript untuk seluruh komponen dan halaman.
* **`src/services/api.ts`**:
  * Melengkapi seluruh metode fetch API terpusat (`getDashboardSummary`, `getProvinces(modelOnly)`, dll).
* **7 Halaman Utama**:
  * `Overview.tsx`: Pembaruan tren 32 provinsi, KPI dinamis, dan disclaimer angka rata-rata bukan angka resmi BPS.
  * `PovertyExplorer.tsx`: Penambahan toggle filter model-only 32 provinsi vs seluruh 38 provinsi, visualisasi perbandingan deret waktu dua provinsi.
  * `PredictionStudio.tsx`: Formulasi lag $t \to t+1$, peringatan wajib bahwa Persistence Baseline mengungguli Random Forest, dan validasi 32 provinsi.
  * `ModelComparison.tsx`: Komparasi komprehensif 4 model, visualisasi aktual vs prediksi ($y=x$), diagram residual, dan studi kasus underprediction NTT (+9.32 pp).
  * `HistoricalAnalysis.tsx`: Analisis deret waktu 9 tahun, delta tahunan (YoY), matriks korelasi Pearson & Spearman, serta penjelasan korelasi bukan kausalitas.
  * `DatasetExplorer.tsx`: Transparansi arsitektur 3 dataset, kamus data 7 variabel lengkap, tabel terpaginasi, dan ekspor CSV.
  * `Methodology.tsx`: Dokumentasi akademis 7 tahap alur penelitian, expanding-window validation, dan batasan riset.
* **Komponen Peta & Geospasial**:
  * Penjelasan cakupan 34 batas wilayah GeoJSON aktif (2017–2023) dan fallback tabel untuk 38 provinsi (2024–2025).
* **Build Check**:
  * `npx tsc --noEmit`: 0 error.
  * `npm run build`: Production bundle berhasil dibangun.
