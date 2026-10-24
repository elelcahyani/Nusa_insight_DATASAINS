"""Automated API tests using FastAPI TestClient — NUSA Insight v2."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


# ── Health & Metadata ─────────────────────────────────────────────────────────

def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_metadata():
    r = client.get("/api/metadata")
    assert r.status_code == 200
    data = r.json()
    assert data["model_rows"] == 288
    assert data["dashboard_rows"] == 314
    assert len(data["excluded_provinces"]) == 6
    assert "rls" in data["features"]


# ── Dashboard ─────────────────────────────────────────────────────────────────

def test_dashboard_trend():
    r = client.get("/api/dashboard/trend")
    assert r.status_code == 200
    rows = r.json()
    years = [row["tahun"] for row in rows]
    assert 2017 in years and 2025 in years
    assert len(rows) == 9  # 2017–2025


def test_dashboard_summary_2023():
    r = client.get("/api/dashboard/summary?year=2023")
    assert r.status_code == 200
    data = r.json()
    assert data["year"] == 2023
    assert data["province_count"] == 34


def test_dashboard_summary_2025():
    r = client.get("/api/dashboard/summary?year=2025")
    assert r.status_code == 200
    data = r.json()
    assert data["year"] == 2025
    assert data["province_count"] == 38  # Includes 4 new Papua provinces


def test_dashboard_summary_invalid_year():
    r = client.get("/api/dashboard/summary?year=1990")
    assert r.status_code in (404, 422)


# ── Provinces ─────────────────────────────────────────────────────────────────

def test_provinces_all():
    r = client.get("/api/provinces")
    assert r.status_code == 200
    provinces = r.json()["provinces"]
    assert len(provinces) == 38


def test_provinces_model_only():
    r = client.get("/api/provinces?model_only=true")
    assert r.status_code == 200
    provinces = r.json()["provinces"]
    assert len(provinces) == 32
    excluded = {"Papua", "Papua Barat", "Papua Selatan",
                "Papua Tengah", "Papua Pegunungan", "Papua Barat Daya"}
    assert not excluded.intersection(set(provinces))


def test_province_history():
    r = client.get("/api/provinces/Aceh/history")
    assert r.status_code == 200
    history = r.json()["history"]
    years = [row["tahun"] for row in history]
    assert 2017 in years and 2025 in years


def test_province_history_not_found():
    r = client.get("/api/provinces/ProvinsiTidakAda/history")
    assert r.status_code == 404


def test_province_features():
    r = client.get("/api/provinces/Aceh/features/2025")
    assert r.status_code == 200
    data = r.json()
    for col in ("rls", "garis_maret", "penduduk_ribu", "kepadatan", "kemiskinan"):
        assert col in data
        assert data[col] is not None


def test_province_features_excluded_province():
    r = client.get("/api/provinces/Papua/features/2025")
    assert r.status_code == 404


# ── Dataset Explorer ──────────────────────────────────────────────────────────

def test_dataset_profile():
    r = client.get("/api/dataset/profile")
    assert r.status_code == 200
    p = r.json()
    assert p["rows"] == 314
    assert p["duplicate_province_year_rows"] == 0
    assert all(v == 0 for v in p["missing_values"].values())


def test_dataset_records_pagination():
    r = client.get("/api/dataset/records?page=1&page_size=10")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 314
    assert len(data["records"]) == 10


def test_dataset_records_search():
    r = client.get("/api/dataset/records?search=Aceh&page_size=50")
    assert r.status_code == 200
    records = r.json()["records"]
    assert all("Aceh" in rec["provinsi"] for rec in records)


# ── Evaluation ────────────────────────────────────────────────────────────────

def test_evaluation_metrics():
    r = client.get("/api/evaluation/metrics")
    assert r.status_code == 200
    data = r.json()
    models = [m["model"] for m in data["test_metrics"]]
    assert "Linear Regression" in models
    assert "Random Forest Baseline" in models
    assert "Random Forest Tuned" in models
    assert any("Persistence" in m for m in models)


def test_evaluation_metrics_values():
    r = client.get("/api/evaluation/metrics")
    data = r.json()
    metrics_map = {m["model"]: m for m in data["test_metrics"]}

    # 1. Persistence Baseline: MAE=0.645, RMSE=0.765, R2=0.953
    persist = next(v for k, v in metrics_map.items() if "Persistence" in k)
    assert abs(persist["MAE"] - 0.645) < 0.01
    assert abs(persist["RMSE"] - 0.765) < 0.01
    assert abs(persist["R2"] - 0.953) < 0.01

    # 2. Random Forest Baseline and Tuned: MAE=1.488, RMSE=2.280, R2=0.584 (identical)
    rf_base = metrics_map["Random Forest Baseline"]
    rf_tuned = metrics_map["Random Forest Tuned"]
    assert abs(rf_tuned["MAE"] - 1.488) < 0.01
    assert abs(rf_tuned["RMSE"] - 2.280) < 0.01
    assert abs(rf_tuned["R2"] - 0.584) < 0.01
    assert abs(rf_base["MAE"] - rf_tuned["MAE"]) < 1e-4  # Identical results

    # 3. Linear Regression: MAE=2.336, RMSE=3.185, R2=0.189
    lr = metrics_map["Linear Regression"]
    assert abs(lr["MAE"] - 2.336) < 0.01
    assert abs(lr["RMSE"] - 3.185) < 0.01
    assert abs(lr["R2"] - 0.189) < 0.01

    # Crucial scientific check: Persistence Baseline must beat Random Forest on 2025 test!
    assert persist["MAE"] < rf_tuned["MAE"]


def test_evaluation_predictions():
    r = client.get("/api/evaluation/predictions")
    assert r.status_code == 200
    preds = r.json()["predictions"]
    assert len(preds) > 0

    # Check required columns (both canonical and aliases)
    for col in ("provinsi", "target_actual", "prediction", "residual_actual_minus_predicted", "absolute_error"):
        assert col in preds[0]

    # Verify key benchmark results from latest research
    rf_preds = {p["provinsi"]: p for p in preds if p["model"] == "Random Forest Tuned"}
    assert len(rf_preds) == 32

    # NTT is largest underprediction in RF test 2025: target_actual ~ 18.60%, residual ~ +9.32
    assert "Nusa Tenggara Timur" in rf_preds
    ntt = rf_preds["Nusa Tenggara Timur"]
    assert abs(ntt["target_actual"] - 18.60) < 0.1
    assert ntt["residual_actual_minus_predicted"] > 9.0

    # DKI Jakarta is well-fitted: target_actual 4.28%, prediction ~ 4.40%
    dki = rf_preds["DKI Jakarta"]
    assert abs(dki["target_actual"] - 4.28) < 0.1
    assert abs(dki["residual_actual_minus_predicted"]) < 0.5


def test_feature_importance():
    r = client.get("/api/evaluation/feature-importance")
    assert r.status_code == 200
    fi = r.json()["feature_importance"]
    features = [f["fitur"] for f in fi]
    assert set(features) == {"rls", "garis_maret", "penduduk_ribu", "kepadatan"}
    total = sum(f["random_forest_impurity_importance"] for f in fi)
    assert abs(total - 1.0) < 0.01

    # Kepadatan is the most important feature in RF
    top_feature = max(fi, key=lambda x: x["random_forest_impurity_importance"])
    assert top_feature["fitur"] == "kepadatan"


# ── Prediction ────────────────────────────────────────────────────────────────

def test_predict_valid_rf():
    r = client.post("/api/predict", json={
        "province": "Aceh",
        "reference_year": 2025,
        "model": "randomforest"
    })
    assert r.status_code == 200
    data = r.json()
    assert data["province"] == "Aceh"
    assert data["reference_year"] == 2025
    assert data["target_year"] == 2026
    assert data["is_demo_mode"] is False
    assert 0 < data["predicted_poverty_rate"] < 100
    for feat in ("rls", "garis_maret", "penduduk_ribu", "kepadatan"):
        assert data["input_features"][feat] > 0


def test_predict_valid_lr():
    r = client.post("/api/predict", json={
        "province": "Bali",
        "reference_year": 2023,
        "model": "linear"
    })
    assert r.status_code == 200
    data = r.json()
    assert data["target_year"] == 2024
    assert data["model"] == "linear_regression"


def test_predict_excluded_province():
    """Papua is excluded from model — must return 422 with informative error."""
    r = client.post("/api/predict", json={
        "province": "Papua",
        "reference_year": 2025,
        "model": "randomforest"
    })
    assert r.status_code == 422
    assert "tidak didukung" in str(r.json()["detail"]).lower() or "Papua" in str(r.json()["detail"])


def test_predict_missing_year_data():
    r = client.post("/api/predict", json={
        "province": "Aceh",
        "reference_year": 2016,
        "model": "randomforest"
    })
    assert r.status_code == 422


def test_predict_invalid_model_type():
    r = client.post("/api/predict", json={
        "province": "Aceh",
        "reference_year": 2025,
        "model": "xgboost"
    })
    assert r.status_code == 422


def test_predict_no_feature_substitution_with_zero():
    r = client.post("/api/predict", json={
        "province": "Aceh",
        "reference_year": 2025,
        "model": "randomforest"
    })
    assert r.status_code == 200
    features = r.json()["input_features"]
    for v in features.values():
        assert v != 0, f"Feature value is zero — possible NULL substitution: {features}"


def test_predict_deterministic():
    payload = {"province": "Jawa Barat", "reference_year": 2024, "model": "randomforest"}
    r1 = client.post("/api/predict", json=payload).json()["predicted_poverty_rate"]
    r2 = client.post("/api/predict", json=payload).json()["predicted_poverty_rate"]
    assert r1 == r2, "Prediction is not deterministic — model may be retraining"
