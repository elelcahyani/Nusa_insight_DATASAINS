# NUSA Insight — National Socioeconomic Analytics

> *"Understand Today. Anticipate Tomorrow."*

Aplikasi web analitik data kemiskinan dan prediksi machine learning tingkat provinsi di Indonesia berbasis data Badan Pusat Statistik (BPS) periode 2017–2025.

---

## 1. Ikhtisar & Arsitektur Sistem

NUSA Insight memadukan pemodelan ekonometrika deret waktu dan machine learning untuk mengeksplorasi disparitas regional angka kemiskinan provinsi di Indonesia.

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Leaflet / React-Leaflet, Lucide Icons.
* **Backend**: Python 3.10+, FastAPI, Pydantic v2, Uvicorn, Pandas, Scikit-Learn, Joblib.
* **Machine Learning Pipeline**:
  * Fitur ($t$): Rata-rata Lama Sekolah (`rls`), Garis Kemiskinan Maret (`garis_maret`), Jumlah Penduduk Ribuan (`penduduk_ribu`), Kepadatan Penduduk (`kepadatan`).
  * Target ($t+1$): Persentase penduduk miskin tahun berikutnya.
  * Model yang dievaluasi: **Persistence Baseline**, **Random Forest Baseline**, **Random Forest Tuned**, dan **Linear Regression**.

```
nusa-insight/
├── backend/
│   ├── main.py                  # FastAPI app & 20+ REST endpoints
│   ├── schemas.py               # Pydantic schemas (PredictRequest, PredictResponse)
│   ├── requirements.txt         # Dependensi backend
│   ├── services/
│   │   ├── data_service.py      # Pengelolaan dataset dashboard & panel 32 provinsi
│   │   └── model_service.py     # Inferensi model .joblib & validasi provinsi
│   ├── artifacts/A_tanpa_papua/ # Model .joblib & metadata eksperimen
│   └── tests/
│       ├── test_api.py          # 26 automated integration tests
│       ├── test_data_integrity.py
│       └── test_model_evaluation.py
├── data/
│   ├── processed/               # Dataset CSV & profile JSON
│   └── evaluation/              # Metrik, prediksi, residual, feature importance
├── src/                         # Frontend React + TypeScript
│   ├── pages/                   # 7 Halaman utama
│   ├── components/              # Layout, maps, & UI components
│   ├── services/api.ts          # REST client terpusat
│   └── types/index.ts           # Definisi tipe data TypeScript
└── docs/                        # Dokumentasi metodologi, kamus data, & laporan pengujian
```

---

## 2. Hasil Evaluasi Target 2025 (N = 32 Provinsi)

Eksperimen menggunakan skema **temporal expanding-window** (pelatihan pada transisi 2018–2024 sebanyak 224 sampel, dan pengujian final target 2025 sebanyak 32 sampel):

| Model | MAE (pp) | RMSE (pp) | R² | Keterangan Ilmiah |
|---|---:|---:|---:|---|
| **Persistence Baseline** | **0.645** | **0.765** | **0.953** | **Performa terbaik**; mencerminkan inersia struktural kemiskinan |
| **Random Forest Tuned** | 1.488 | 2.280 | 0.584 | Model ML terbaik, namun belum mengungguli persistence |
| **Random Forest Baseline**| 1.488 | 2.280 | 0.584 | Hasil identik dengan versi tuned (tuning tidak menambah akurasi) |
| **Linear Regression** | 2.336 | 3.185 | 0.189 | Asumsi linearitas gagal menangkap variabilitas ekstrem regional |

> [!IMPORTANT]
> **Temuan Kunci**: Model Machine Learning belum berhasil melampaui Persistence Baseline pada target uji 2025. Prediksi model berfungsi sebagai **alat bantu eksplorasi skenario perubahan indikator**, bukan ramalan deterministik atau dasar tunggal kebijakan publik.

---

## 3. Prasyarat & Instalasi

### Prasyarat
* **Python 3.10+** (disarankan Python 3.11 atau 3.12)
* **Node.js 18+** dan npm

### Setup Backend (Terminal 1)
```bash
cd nusa-insight/backend

# Buat dan aktifkan virtual environment (opsional/disarankan)
python -m venv .venv
.venv\Scripts\activate      # Windows PowerShell / CMD

# Install dependensi
pip install -r requirements.txt

# Jalankan server FastAPI
uvicorn main:app --reload --port 8000
```
* Backend API: `http://localhost:8000`
* Swagger OpenAPI Docs: `http://localhost:8000/docs`

### Setup Frontend (Terminal 2)
```bash
cd nusa-insight

# Install dependensi
npm install

# Jalankan Vite development server
npm run dev
```
* Frontend Web App: `http://localhost:5173`

---

## 4. Daftar Endpoint API Utama

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/health` | Status kesiapan backend & pemuatan data |
| `GET` | `/api/metadata` | Metadata panel penelitian, variabel, dan eksklusi Papua |
| `GET` | `/api/provinces` | Daftar provinsi (`?model_only=true` untuk 32 panel model) |
| `GET` | `/api/dashboard/trend` | Deret tren tahunan rata-rata 32 provinsi (2017–2025) |
| `GET` | `/api/dashboard/summary?year=YYYY` | Ringkasan dan sebaran kemiskinan pada tahun tertentu |
| `GET` | `/api/provinces/{prov}/history` | Deret waktu historis satu provinsi |
| `GET` | `/api/provinces/{prov}/features/{year}` | Baris fitur model untuk provinsi & tahun acuan |
| `GET` | `/api/dataset/profile` | Profil statistik dataset, missing values, & hitungan provinsi |
| `GET` | `/api/dataset/records` | Penelusuran data tabular terpaginasi & pencarian provinsi |
| `GET` | `/api/evaluation/metrics` | Metrik evaluasi 4 model pada pengujian target 2025 |
| `GET` | `/api/evaluation/predictions` | Prediksi dan residual per provinsi untuk target 2025 |
| `GET` | `/api/evaluation/feature-importance` | Nilai feature importance Random Forest |
| `GET` | `/api/evaluation/permutation-importance` | Mean & std penurunan MAE permutasi |
| `GET` | `/api/evaluation/correlation/pearson` | Matriks asosiasi linier Pearson |
| `GET` | `/api/evaluation/correlation/spearman` | Matriks korelasi peringkat Spearman |
| `POST` | `/api/predict` | Inferensi prediksi model deployment (`random_forest` / `linear_regression`) |

---

## 5. Halaman Aplikasi Frontend

1. **Overview Dashboard** (`/overview`): Rangkuman KPI, deret tren nasional panel penelitian 32 provinsi, perbandingan ekstrem, dan peta regional.
2. **Poverty Explorer** (`/poverty-explorer`): Eksplorasi indikator sosial-ekonomi per provinsi, filter cakupan data, dan perbandingan deret waktu dua provinsi.
3. **Prediction Studio** (`/prediction`): Antarmuka inferensi model machine learning dengan 4 input indikator tahun $t$ untuk mengestimasi tahun $t+1$.
4. **Model Comparison** (`/model-comparison`): Halaman utama komparasi ilmiah 4 model, visualisasi aktual vs prediksi ($y=x$), analisis residual, serta studi kasus underprediction (NTT +9.32 pp, Bengkulu +3.82 pp, DKI Jakarta -0.12 pp).
5. **Historical Analysis** (`/historical-analysis`): Analisis deret waktu 9 tahun, delta tahunan (YoY), korelasi Pearson vs Spearman, dan penjelasan korelasi bukan kausalitas.
6. **Dataset Explorer** (`/dataset`): Inspeksi data transparan, kamus data lengkap 7 variabel, profil missing values (0), dan ekspor CSV.
7. **About & Methodology** (`/methodology`): Dokumentasi lengkap 7 tahap alur penelitian, pembagian data temporal, dan batasan riset.

---

## 6. Menjalankan Pengujian & Verifikasi

### Pengujian Backend (pytest)
```bash
cd nusa-insight
python -m pytest backend/tests -v
```
* Seluruh 31 unit & integration test menguji integritas data, konsistensi metrik evaluasi, stabilitas model inferensi, dan validasi response schema.

### Verifikasi Frontend (TypeScript & Build)
```bash
cd nusa-insight
# Typecheck
npx tsc --noEmit

# Production Build
npm run build
```

---

## 7. Lisensi & Atribusi
* **Data**: Badan Pusat Statistik (BPS) Indonesia (2017–2025).
* **Batas Wilayah Geospasial**: geoBoundaries.org · gbOpen · Indonesia ADM1 · CC BY 4.0.
