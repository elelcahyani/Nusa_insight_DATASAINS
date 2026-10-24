"""Tests for model evaluation metrics, residual facts, and inferencing consistency."""
from pathlib import Path
import pandas as pd
import pytest

BASE = Path(__file__).resolve().parent.parent.parent


def test_metrics_consistency():
    path = BASE / "data" / "evaluation" / "perbandingan_metrik_testing_2025.csv"
    df = pd.read_csv(path)
    records = {row["model"]: row for _, row in df.iterrows()}

    # Persistence Baseline
    p_key = next(k for k in records if "Persistence" in k)
    p = records[p_key]
    assert abs(p["MAE"] - 0.645) < 0.01
    assert abs(p["RMSE"] - 0.765) < 0.01
    assert abs(p["R2"] - 0.953) < 0.01

    # Random Forest Tuned and Baseline are identical
    rf_base = records["Random Forest Baseline"]
    rf_tuned = records["Random Forest Tuned"]
    assert abs(rf_tuned["MAE"] - 1.488) < 0.01
    assert abs(rf_tuned["RMSE"] - 2.280) < 0.01
    assert abs(rf_tuned["R2"] - 0.584) < 0.01
    assert abs(rf_base["MAE"] - rf_tuned["MAE"]) < 1e-4

    # Linear Regression
    lr = records["Linear Regression"]
    assert abs(lr["MAE"] - 2.336) < 0.01
    assert abs(lr["RMSE"] - 3.185) < 0.01
    assert abs(lr["R2"] - 0.189) < 0.01

    # Key truth: Persistence beats RF
    assert p["MAE"] < rf_tuned["MAE"]


def test_residuals_key_provinces():
    path = BASE / "data" / "evaluation" / "prediksi_dan_residual_per_provinsi_2025.csv"
    df = pd.read_csv(path)
    rf_df = df[df["model"] == "Random Forest Tuned"]
    rf_map = {row["provinsi"]: row for _, row in rf_df.iterrows()}

    # NTT underprediction
    ntt = rf_map["Nusa Tenggara Timur"]
    assert abs(ntt["target_actual"] - 18.60) < 0.1
    assert abs(ntt["prediction"] - 9.277) < 0.1
    assert abs(ntt["residual_actual_minus_predicted"] - 9.323) < 0.1

    # Bengkulu underprediction
    bkl = rf_map["Bengkulu"]
    assert abs(bkl["target_actual"] - 12.08) < 0.1
    assert abs(bkl["prediction"] - 8.258) < 0.1
    assert abs(bkl["residual_actual_minus_predicted"] - 3.822) < 0.1

    # DKI Jakarta accurate fit
    dki = rf_map["DKI Jakarta"]
    assert abs(dki["target_actual"] - 4.28) < 0.1
    assert abs(dki["residual_actual_minus_predicted"]) < 0.3
