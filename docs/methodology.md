# Metodologi Penelitian NUSA Insight

## 1. Latar Belakang & Tujuan
NUSA Insight dibangun untuk mengkaji disparitas kemiskinan provinsi di Indonesia dengan memanfaatkan dataset panel resmi Badan Pusat Statistik (BPS) periode 2017–2025. Eksperimen ini mengevaluasi apakah model Machine Learning (Random Forest dan Linear Regression) mampu memberikan akurasi prediktif yang lebih baik daripada acuan sederhana berupa Persistence Baseline (nilai kemiskinan tahun sebelumnya).

## 2. Definisi Masalah & Formulasi Lag
* **Variabel Target ($y_{t+1}$)**: Persentase penduduk miskin pada tahun $t+1$ (survei Maret).
* **Variabel Prediktor / Fitur ($X_t$)**: Indikator sosioekonomi pada tahun $t$:
  1. `rls`: Rata-rata Lama Sekolah penduduk usia 25 tahun ke atas (tahun).
  2. `garis_maret`: Garis Kemiskinan survei Maret (IDR/kapita/bulan).
  3. `penduduk_ribu`: Total jumlah penduduk provinsi dalam ribuan jiwa.
  4. `kepadatan`: Kepadatan penduduk (jiwa per kilometer persegi).

Formulasi lag ini menjamin bahwa seluruh fitur yang digunakan untuk memprediksi kemiskinan tahun depan telah tersedia secara nyata pada tahun sebelumnya, sehingga tidak terjadi kebocoran informasi masa depan (*lookahead bias*).

## 3. Cakupan Panel 32 Provinsi
Meskipun data BPS mencakup 38 provinsi pasca-pemekaran 2022, penelitian membatasi panel utama pada **32 provinsi lengkap** yang memiliki observasi tanpa jeda selama 2017–2025:
* **Enam provinsi wilayah Papua dikecualikan**: Papua, Papua Barat, Papua Selatan, Papua Tengah, Papua Pegunungan, dan Papua Barat Daya.
* **Alasan Eksklusi**: Pemekaran provinsi Papua pada pertengahan 2022 mengubah batas geografis dan agregasi statistik secara drastis, sehingga data deret waktu sebelum 2024 tidak dapat dibandingkan secara konsisten dengan data setelahnya.
* **Ukuran Dataset**: 32 provinsi × 9 tahun = 288 baris data, menghasilkan 256 pasangan fitur ($t$) dan target ($t+1$).

## 4. Skema Validasi Temporal Expanding-Window
Untuk mensimulasikan penerapan di dunia nyata di mana data masa lalu digunakan untuk memproyeksikan masa depan, pembagian data menggunakan pendekatan **temporal expanding window** (bukan *k-fold random split*):
1. **Validasi 1 (Target 2022)**: Melatih pada transisi 2018–2021 (128 pasangan).
2. **Validasi 2 (Target 2023)**: Melatih pada transisi 2018–2022 (160 pasangan).
3. **Validasi 3 (Target 2024)**: Melatih pada transisi 2018–2023 (192 pasangan).
4. **Pelatihan Final (Target 2018–2024)**: 224 pasangan fitur-target.
5. **Pengujian Final (Target 2025)**: 32 pasangan fitur tahun 2024 terhadap target tahun 2025.

## 5. Model yang Dievaluasi
1. **Persistence Baseline**: Prediksi tahun $t+1$ diasumsikan sama dengan nilai kemiskinan aktual tahun $t$ ($y_{t+1} \approx y_t$).
2. **Linear Regression Pipeline**: `StandardScaler()` diikuti `LinearRegression()`.
3. **Random Forest Baseline**: Parameter bawaan scikit-learn (`n_estimators=100`, `random_state=42`).
4. **Random Forest Tuned**: Parameter optimal hasil validasi (`n_estimators=300`, `min_samples_leaf=1`, `max_features=1.0`).

## 6. Metrik Evaluasi
* **MAE (Mean Absolute Error)**: $\frac{1}{n}\sum |y_i - \hat{y}_i|$ (dalam poin persentase).
* **RMSE (Root Mean Squared Error)**: $\sqrt{\frac{1}{n}\sum (y_i - \hat{y}_i)^2}$ (menghukum deviasi ekstrem).
* **R² (Koefisien Determinasi)**: $1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}$.

## 7. Batasan & Implikasi Kebijakan
* **Persistence Baseline Terbaik**: Persistence Baseline menghasilkan MAE terendah (0.645 pp) dan R² tertinggi (0.953) pada target 2025.
* **Keterbatasan 4 Fitur**: Model Machine Learning belum mampu menangkap shock ekonomi spesifik dan heterogenitas kemiskinan struktural (seperti di Nusa Tenggara Timur).
* **Rekomendasi**: Model ML harus diperlakukan sebagai instrumen eksploratif untuk menguji sensitivitas terhadap indikator makro, bukan sebagai peramal otomatis tanpa konfirmasi pakar sosial.
