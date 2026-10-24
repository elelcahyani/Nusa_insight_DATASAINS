"""Data service — loads and caches all CSV/JSON data files at startup."""
import json
from pathlib import Path
import pandas as pd

BASE = Path(__file__).resolve().parent.parent.parent  # nusa-insight/

DASHBOARD_CSV = BASE / "data" / "processed" / "dataset_dashboard_seluruh_provinsi.csv"
MODEL_CSV = BASE / "data" / "processed" / "dataset_model_32_provinsi.csv"
PAIRS_CSV = BASE / "data" / "processed" / "pasangan_fitur_t_dan_target_t1.csv"
PROFILE_JSON = BASE / "data" / "processed" / "dataset_profile.json"
RINGKASAN_PROVINSI_CSV = BASE / "data" / "processed" / "ringkasan_provinsi_terbaru.csv"
RINGKASAN_TAHUNAN_CSV = BASE / "data" / "processed" / "ringkasan_tahunan_dashboard.csv"

METRICS_JSON = BASE / "evaluation" / "metrics.json"
PREDICTIONS_CSV = BASE / "evaluation" / "predictions_test_2025.csv"
RESIDUALS_CSV = BASE / "evaluation" / "residual_analysis_test_2025.csv"
FEATURE_IMP_CSV = BASE / "evaluation" / "feature_importance.csv"
PERM_IMP_CSV = BASE / "evaluation" / "permutation_importance.csv"
RF_TUNING_CSV = BASE / "evaluation" / "random_forest_validation_tuning.csv"
EVAL_METADATA_JSON = BASE / "evaluation" / "model_metadata.json"


class DataService:
    def __init__(self):
        self._df_dashboard: pd.DataFrame | None = None
        self._df_model: pd.DataFrame | None = None
        self._df_pairs: pd.DataFrame | None = None
        self._profile: dict | None = None
        self._ringkasan_provinsi: pd.DataFrame | None = None
        self._ringkasan_tahunan: pd.DataFrame | None = None
        self._metrics: dict | None = None

    # ── loaders ──────────────────────────────────────────────────────────────
    def load_all(self):
        self._df_dashboard = pd.read_csv(DASHBOARD_CSV)
        self._df_model = pd.read_csv(MODEL_CSV)
        self._df_pairs = pd.read_csv(PAIRS_CSV)
        self._ringkasan_provinsi = pd.read_csv(RINGKASAN_PROVINSI_CSV)
        self._ringkasan_tahunan = pd.read_csv(RINGKASAN_TAHUNAN_CSV)
        with open(PROFILE_JSON, "r", encoding="utf-8") as f:
            self._profile = json.load(f)
        with open(METRICS_JSON, "r", encoding="utf-8") as f:
            self._metrics = json.load(f)

    @property
    def df_dashboard(self) -> pd.DataFrame:
        if self._df_dashboard is None:
            self.load_all()
        return self._df_dashboard

    @property
    def df_model(self) -> pd.DataFrame:
        if self._df_model is None:
            self.load_all()
        return self._df_model

    @property
    def df_pairs(self) -> pd.DataFrame:
        if self._df_pairs is None:
            self.load_all()
        return self._df_pairs

    @property
    def profile(self) -> dict:
        if self._profile is None:
            self.load_all()
        return self._profile

    @property
    def metrics(self) -> dict:
        if self._metrics is None:
            self.load_all()
        return self._metrics

    # ── queries ───────────────────────────────────────────────────────────────
    def get_years(self) -> list[int]:
        return sorted(self.df_dashboard["tahun"].unique().tolist())

    def get_model_provinces(self) -> list[str]:
        return sorted(self.df_model["provinsi"].unique().tolist())

    def get_all_provinces(self) -> list[str]:
        return sorted(self.df_dashboard["provinsi"].unique().tolist())

    def get_annual_summary(self) -> list[dict]:
        df = pd.read_csv(RINGKASAN_TAHUNAN_CSV)
        return df.to_dict(orient="records")

    def get_dashboard_for_year(self, year: int) -> list[dict]:
        df = self.df_dashboard[self.df_dashboard["tahun"] == year]
        return df.to_dict(orient="records")

    def get_province_history(self, province: str) -> list[dict]:
        df = self.df_dashboard[self.df_dashboard["provinsi"] == province].sort_values("tahun")
        return df.to_dict(orient="records")

    def get_feature_row(self, province: str, year: int) -> dict | None:
        """Return model feature row (rls, garis_maret, penduduk_ribu, kepadatan) for given province/year."""
        df = self.df_model[
            (self.df_model["provinsi"] == province) & (self.df_model["tahun"] == year)
        ]
        if df.empty:
            return None
        row = df.iloc[0]
        return {
            "provinsi": row["provinsi"],
            "tahun": int(row["tahun"]),
            "rls": float(row["rls"]),
            "garis_maret": float(row["garis_maret"]),
            "penduduk_ribu": float(row["penduduk_ribu"]),
            "kepadatan": float(row["kepadatan"]),
            "kemiskinan": float(row["kemiskinan"]),
        }

    def get_all_records(self, page: int = 1, page_size: int = 50, search: str = "") -> dict:
        df = self.df_dashboard.copy()
        if search:
            df = df[df["provinsi"].str.contains(search, case=False, na=False)]
        total = len(df)
        start = (page - 1) * page_size
        page_df = df.sort_values(["tahun", "provinsi"]).iloc[start: start + page_size]
        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "records": page_df.to_dict(orient="records"),
        }

    def get_predictions_test(self) -> list[dict]:
        df = pd.read_csv(PREDICTIONS_CSV)
        return df.to_dict(orient="records")

    def get_residuals(self) -> list[dict]:
        df = pd.read_csv(RESIDUALS_CSV)
        return df.to_dict(orient="records")

    def get_feature_importance(self) -> list[dict]:
        df = pd.read_csv(FEATURE_IMP_CSV)
        return df.to_dict(orient="records")

    def get_permutation_importance(self) -> list[dict]:
        df = pd.read_csv(PERM_IMP_CSV)
        return df.to_dict(orient="records")

    def get_rf_tuning(self) -> list[dict]:
        df = pd.read_csv(RF_TUNING_CSV)
        return df.to_dict(orient="records")

    def get_eval_metadata(self) -> dict:
        with open(EVAL_METADATA_JSON, "r", encoding="utf-8") as f:
            return json.load(f)


data_service = DataService()
