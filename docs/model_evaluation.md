# Laporan Evaluasi Model NUSA Insight

Dokumen ini memaparkan hasil evaluasi model machine learning pada dataset uji target tahun 2025 (32 provinsi panel).

---

## 1. Ringkasan Metrik Pengujian (Target 2025)

Pengujian dilakukan menggunakan 32 sampel provinsi pada tahun target 2025 berdasarkan fitur tahun 2024:

| Model | MAE (pp) | RMSE (pp) | R² | Keterangan Evaluasi |
|---|---:|---:|---:|---|
| **Persistence Baseline** | **0.645** | **0.765** | **0.953** | Patokan $y_{t+1} \approx y_t$; mengungguli seluruh model ML |
| **Random Forest Tuned** | 1.488 | 2.280 | 0.584 | n_estimators=300, min_samples_leaf=1; performa identik baseline |
| **Random Forest Baseline**| 1.488 | 2.280 | 0.584 | n_estimators=100; performa identik dengan versi tuned |
| **Linear Regression** | 2.336 | 3.185 | 0.189 | StandardScaler + OLS; performa terendah |

### Analisis Kritis:
1. **Keunggulan Persistence Baseline**: MAE Persistence Baseline adalah **0.645 poin persentase**, kurang dari separuh MAE Random Forest (1.488 pp). Hal ini membuktikan bahwa angka kemiskinan provinsi di Indonesia bersifat *path-dependent* dengan tingkat persistensi yang sangat tinggi antar-tahun.
2. **Ketiadaan Peningkatan dari Hyperparameter Tuning**: Model Random Forest Tuned dan Baseline menghasilkan skor MAE, RMSE, dan R² yang identik pada data uji 2025. Penyesuaian hyperparameter pohon keputusan tidak memberikan generalisasi yang lebih baik pada data out-of-time.
3. **Interpretasi Nilai R²**: Nilai R² sebesar 0.953 pada Persistence Baseline tidak boleh disalahartikan sebagai tanda bahwa model Machine Learning kompleks telah berhasil. Sebaliknya, hal ini menegaskan bahwa model ML murni dengan 4 fitur dasar belum mampu mengalahkan tebakan sederhana berbasis data tahun kemarin.

---

## 2. Analisis Residual & Kasus Menonjol

Residual dihitung dengan rumus: $Residual = Target_{Aktual} - Prediksi_{Model}$.

### Pola Kesalahan Random Forest pada Target 2025:
* **Nusa Tenggara Timur (Underprediction Terbesar)**:
  * Aktual: **18.60%**
  * Prediksi Random Forest: **9.28%**
  * Residual: **+9.32 poin persentase**
  * Interpretasi: Model meratakan prediksi NTT ke arah rata-rata nasional (~9%) karena fitur umum (RLS dan kepadatan) tidak mampu menangkap disparitas kemiskinan kepulauan dan keterbatasan akses air/lahan kering di NTT.
* **Bengkulu**:
  * Aktual: **12.08%**
  * Prediksi Random Forest: **8.26%**
  * Residual: **+3.82 poin persentase**
  * Interpretasi: Underprediction signifikan pada wilayah barat Sumatera.
* **Sulawesi Tenggara (Overprediction Terbesar)**:
  * Aktual: **10.54%**
  * Prediksi Random Forest: **14.18%**
  * Residual: **-3.64 poin persentase**
  * Interpretasi: Model memprediksi kemiskinan lebih tinggi daripada realisasi aktual di lapangan.
* **DKI Jakarta (Akurasi Presisi)**:
  * Aktual: **4.28%**
  * Prediksi Random Forest: **4.40%**
  * Residual: **-0.12 poin persentase**
  * Interpretasi: Nilai ekstrim kepadatan tinggi (>15.000 jiwa/km²) dan RLS tinggi (>11 tahun) berhasil dipetakan secara sangat akurat oleh pohon keputusan.

---

## 3. Feature Importance & Permutation Importance

### Impurity Feature Importance (Gini Importance):
1. **`kepadatan`**: **0.433** (43.3%) — Pemisah utama struktur perkotaan vs perdesaan.
2. **`rls`**: **0.265** (26.5%) — Modal manusia / tingkat pendidikan formal.
3. **`penduduk_ribu`**: **0.183** (18.3%) — Skala populasi absolut provinsi.
4. **`garis_maret`**: **0.119** (11.9%) — Standar biaya hidup minimum regional.

### Permutation Importance (Peningkatan MAE saat Fitur Diacak):
1. **`kepadatan`**: Mean $\Delta$ MAE = **+2.69 pp** ($\pm 0.12$)
2. **`rls`**: Mean $\Delta$ MAE = **+1.93 pp** ($\pm 0.10$)
3. **`penduduk_ribu`**: Mean $\Delta$ MAE = **+1.12 pp** ($\pm 0.04$)
4. **`garis_maret`**: Mean $\Delta$ MAE = **+0.81 pp** ($\pm 0.04$)

> [!NOTE]
> Feature importance hanya mengukur ketergantungan model matematika terhadap fitur dalam mempartisi data, **bukan bukti bahwa kepadatan penduduk secara langsung menjadi penyebab utama kemiskinan**.
