"""NUSA Insight — FastAPI backend."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from schemas import PredictRequest, PredictResponse
from services.data_service import data_service, EXCLUDED_PROVINCES
from services.model_service import model_service

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "*",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    data_service.load_all()
    model_service.load_models()
    yield


app = FastAPI(
    title="NUSA Insight API",
    description="Analisis dan Prediksi Kemiskinan Provinsi Indonesia — Panel 32 Provinsi 2017–2025",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "data_loaded": data_service._df32 is not None}


# ── Research metadata ─────────────────────────────────────────────────────────

@app.get("/api/metadata")
def metadata():
    meta = model_service.metadata
    features = meta.get("features", ["rls", "garis_maret", "penduduk_ribu", "kepadatan"])
    return {
        "panel_provinsi": 32,
        "tahun_data": "2017–2025",
        "jumlah_baris": 288,
        "model_rows": 288,
        "dashboard_rows": 314,
        "pasangan_fitur_target": 256,
        "training_final": 224,
        "test_target_2025": 32,
        "fitur": features,
        "features": features,
        "target": "kemiskinan (persentase, tahun t+1)",
        "excluded_provinces": sorted(EXCLUDED_PROVINCES),
        "catatan": (
            "Panel penelitian mengecualikan enam provinsi Papua karena masalah "
            "keterbandingan data dan pemekaran administratif. Hasil evaluasi berlaku untuk target tahun 2025 saja."
        ),
    }


# ── Dataset ───────────────────────────────────────────────────────────────────

@app.get("/api/dataset/profile")
def dataset_profile():
    return data_service.get_dataset_profile()


@app.get("/api/dataset/records")
def dataset_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    search: str = Query(""),
    year: int = Query(None),
):
    return data_service.get_records_paginated(page=page, page_size=page_size,
                                               search=search, year=year)


@app.get("/api/provinces")
@app.get("/api/dataset/provinces")
def list_provinces(model_only: bool = Query(False)):
    return {"provinces": data_service.get_provinces(model_only=model_only)}


# ── Dashboard / trends ────────────────────────────────────────────────────────

@app.get("/api/dashboard/trend")
def dashboard_trend():
    """Tren tahunan kemiskinan rata-rata 32 provinsi panel penelitian."""
    return data_service.get_annual_trend()


@app.get("/api/dashboard/province-summary")
def province_summary():
    """Ringkasan kemiskinan per provinsi selama 2017–2025."""
    return data_service.get_province_summary()


@app.get("/api/dashboard/summary")
def dashboard_summary(year: int = Query(...)):
    res = data_service.get_year_data(year)
    if not res:
        raise HTTPException(404, f"Tidak ada data untuk tahun {year}.")
    return res


@app.get("/api/dashboard/year/{year}")
def year_data(year: int):
    res = data_service.get_year_data(year)
    if not res:
        raise HTTPException(404, f"Tidak ada data untuk tahun {year}.")
    return res


# ── Province detail ───────────────────────────────────────────────────────────

@app.get("/api/provinces/{province}/history")
def province_history(province: str):
    records = data_service.get_province_history(province)
    if not records:
        raise HTTPException(404, f"Tidak ada data untuk provinsi '{province}'.")
    return {"province": province, "history": records}


@app.get("/api/provinces/{province}/features/{year}")
def province_features(province: str, year: int):
    """Fitur model untuk provinsi dan tahun tertentu (dipakai sebagai input prediksi)."""
    row = data_service.get_feature_row(province, year)
    if row is None:
        raise HTTPException(
            404,
            f"Data fitur tidak tersedia untuk '{province}' tahun {year}. "
            f"Pastikan provinsi termasuk dalam 32 provinsi panel dan tahun tersedia (2017–2025)."
        )
    return row


# ── Evaluation ────────────────────────────────────────────────────────────────

@app.get("/api/evaluation/metrics")
def evaluation_metrics():
    """Metrik evaluasi keempat model pada target tahun 2025 (32 sampel)."""
    metrics = data_service.get_metrics()
    return {
        "test_year": 2025,
        "n_samples": 32,
        "headline_split": "test_2025",
        "note": (
            "Persistence Baseline menggunakan nilai kemiskinan tahun sebelumnya sebagai prediksi. "
            "MAE dan RMSE dalam satuan poin persentase kemiskinan."
        ),
        "test_metrics": metrics,
        "metrics": metrics,
    }


@app.get("/api/evaluation/predictions")
def evaluation_predictions():
    """Prediksi dan residual per provinsi untuk target tahun 2025."""
    return {"predictions": data_service.get_predictions_2025()}


@app.get("/api/evaluation/feature-importance")
def feature_importance():
    return {"feature_importance": data_service.get_feature_importance()}


@app.get("/api/evaluation/permutation-importance")
def permutation_importance():
    return {"permutation_importance": data_service.get_permutation_importance()}


@app.get("/api/evaluation/correlation/pearson")
def correlation_pearson():
    return {"correlation": data_service.get_correlation_pearson(), "type": "pearson"}


@app.get("/api/evaluation/correlation/spearman")
def correlation_spearman():
    return {"correlation": data_service.get_correlation_spearman(), "type": "spearman"}


@app.get("/api/evaluation/rf-params")
def rf_params():
    return {"rf_params": data_service.get_rf_params()}


@app.get("/api/evaluation/split-summary")
def split_summary():
    return {"split_summary": data_service.get_split_summary()}


@app.get("/api/evaluation/top-errors")
def top_errors():
    return {"top_errors": data_service.get_top_errors()}


@app.get("/api/evaluation/persistence-comparison")
def persistence_comparison():
    return {"comparison": data_service.get_persistence_comparison()}


# ── Prediction ────────────────────────────────────────────────────────────────

@app.post("/api/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    """
    Jalankan prediksi menggunakan model deployment.
    Fitur diambil otomatis dari dataset (fitur tahun reference_year → target reference_year+1).
    """
    if req.province in EXCLUDED_PROVINCES:
        raise HTTPException(
            422,
            f"Provinsi '{req.province}' tidak didukung dalam panel model. "
            f"Enam provinsi Papua dikecualikan karena masalah keterbandingan data: {', '.join(sorted(EXCLUDED_PROVINCES))}."
        )

    row = data_service.get_feature_row(req.province, req.reference_year)
    if row is None:
        raise HTTPException(
            422,
            f"Fitur untuk '{req.province}' tahun {req.reference_year} tidak tersedia. "
            f"Pastikan provinsi dan tahun ada dalam panel penelitian (32 provinsi, 2017–2025)."
        )
    try:
        result = model_service.predict(
            province=req.province,
            reference_year=req.reference_year,
            rls=row["rls"],
            garis_maret=row["garis_maret"],
            penduduk_ribu=row["penduduk_ribu"],
            kepadatan=row["kepadatan"],
            model_type=req.model,
        )
    except ValueError as e:
        raise HTTPException(422, str(e))
    return result
