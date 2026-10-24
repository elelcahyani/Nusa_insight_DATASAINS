"""Tests for dataset integrity and research data consistency."""
from pathlib import Path
import pandas as pd
import json

BASE = Path(__file__).resolve().parent.parent.parent


def test_dataset_32_provinces():
    path = BASE / "data" / "processed" / "dataset_32_provinsi_lengkap.csv"
    if not path.exists():
        path = BASE / "data" / "processed" / "dataset_model_32_provinsi.csv"
    df = pd.read_csv(path)
    assert len(df) == 288  # 32 provinces * 9 years
    assert df["provinsi"].nunique() == 32
    assert sorted(df["tahun"].unique().tolist()) == list(range(2017, 2026))

    # Missing values must be 0
    assert df.isnull().sum().sum() == 0

    # Papua provinces must not exist in this panel
    excluded = {"Papua", "Papua Barat", "Papua Selatan", "Papua Tengah", "Papua Pegunungan", "Papua Barat Daya"}
    assert not excluded.intersection(set(df["provinsi"].unique()))


def test_feature_target_pairs():
    path = BASE / "data" / "processed" / "pasangan_fitur_target.csv"
    if not path.exists():
        path = BASE / "data" / "processed" / "pasangan_fitur_t_dan_target_t1.csv"
    df = pd.read_csv(path)
    assert len(df) == 256  # 32 provinces * 8 transition years


def test_dashboard_dataset_coverage():
    path = BASE / "data" / "processed" / "dataset_dashboard_seluruh_provinsi.csv"
    df = pd.read_csv(path)
    assert len(df) == 314
    for y in range(2017, 2024):
        assert len(df[df["tahun"] == y]) == 34
    for y in (2024, 2025):
        assert len(df[df["tahun"] == y]) == 38
