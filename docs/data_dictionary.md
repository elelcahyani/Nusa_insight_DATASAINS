# Kamus Data NUSA Insight

Dokumen ini mendeskripsikan secara rinci seluruh dataset, tabel artefak, variabel, tipe data, dan satuan yang digunakan dalam sistem NUSA Insight.

---

## 1. Pembagian Dataset

| Nama Dataset | Lokasi File | Jumlah Baris | Cakupan Wilayah | Fungsi dalam Aplikasi |
|---|---|---:|---|---|
| **Dataset Dashboard Seluruh Provinsi** | `data/processed/dataset_dashboard_seluruh_provinsi.csv` | 314 | 38 provinsi (2017–2025) | Tampilan dashboard umum, penelusuran data tabular, ringkasan per tahun |
| **Dataset Model 32 Provinsi** | `data/processed/dataset_32_provinsi_lengkap.csv` | 288 | 32 provinsi lengkap (2017–2025) | Panel pemodelan deret waktu konsisten (6 provinsi Papua dikecualikan) |
| **Pasangan Fitur-Target** | `data/processed/pasangan_fitur_target.csv` | 256 | 32 provinsi (8 transisi tahun) | Pembagian pasangan latih/uji (224 train, 32 test) |

---

## 2. Spesifikasi Kolom / Variabel Utama

| Kolom | Nama Variabel | Tipe Data | Satuan | Deskripsi & Atribusi |
|---|---|---|---|---|
| `provinsi` | Nama Provinsi | `String` | - | Nama resmi provinsi di Indonesia sesuai BPS |
| `tahun` | Tahun Pengamatan | `Integer` | `YYYY` | Tahun pencatatan survei (rentang 2017–2025) |
| `kemiskinan` | Persentase Penduduk Miskin | `Float` | `%` (persen) | Rasio penduduk dengan pengeluaran di bawah garis kemiskinan (Survei Sosial Ekonomi Nasional / Susenas Maret) |
| `rls` | Rata-rata Lama Sekolah | `Float` | `Tahun` | Rata-rata jumlah tahun pendidikan formal yang diselesaikan penduduk usia 25 tahun ke atas |
| `garis_maret` | Garis Kemiskinan Maret | `Float` | `IDR/kapita/bulan` | Nilai rupiah minimum yang dibutuhkan untuk memenuhi kebutuhan dasar makanan (2.100 kkal/hari) dan non-makanan |
| `penduduk_ribu` | Jumlah Penduduk | `Float` | `Ribu jiwa` | Estimasi total populasi pertengahan tahun per provinsi dalam ribuan jiwa |
| `kepadatan` | Kepadatan Penduduk | `Float` | `Jiwa/km²` | Rasio total jumlah penduduk terhadap luas daratan resmi provinsi |

---

## 3. Artefak Evaluasi & Output Eksperimen (`data/evaluation/`)

* **`perbandingan_metrik_testing_2025.csv`**:
  * Kolom: `model`, `MAE`, `RMSE`, `R2`.
  * Catatan: Nilai MAE dan RMSE dalam satuan poin persentase (pp).
* **`prediksi_dan_residual_per_provinsi_2025.csv`**:
  * Kolom: `provinsi`, `feature_year`, `target_year`, `target_actual`, `model`, `prediction`, `residual_actual_minus_predicted`, `absolute_error`.
  * Definisi residual: $Residual = Target_{Aktual} - Prediksi_{Model}$.
* **`feature_importance_random_forest.csv`**:
  * Kolom: `fitur`, `random_forest_impurity_importance`.
  * Total bobot impurity importance bernilai 1.0 (100%).
* **`permutation_importance_training_eksploratif.csv`**:
  * Kolom: `fitur`, `mean_permutation_importance_MAE_training`, `std_permutation_importance_MAE_training`.
* **`korelasi_fitur_dengan_kemiskinan.csv`**:
  * Kolom: `fitur`, `korelasi_dengan_kemiskinan`, `arah`, `kekuatan_absolut`.
  * Nilai koefisien korelasi linier Pearson ($r$).
* **`korelasi_spearman_fitur_dengan_kemiskinan.csv`**:
  * Kolom: `fitur`, `korelasi_spearman_dengan_kemiskinan`, `arah`, `kekuatan_absolut`.
  * Nilai koefisien korelasi peringkat Spearman ($\rho$).

---

## 4. Integritas Data & Missing Values
* **Nilai Hilang (Missing Values)**: 0 (seluruh 314 baris data dashboard dan 288 baris panel model terisi lengkap).
* **Duplikasi**: 0 baris duplikat untuk pasangan unik `(provinsi, tahun)`.
