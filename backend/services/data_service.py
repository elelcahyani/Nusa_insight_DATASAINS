"""Data service — loads and caches research datasets at startup."""
import json
from pathlib import Path
import pandas as pd

BASE = Path(__file__).resolve().parent.parent.parent  # nusa-insight/

# ── Datasets ──────────────────────────────────────────────────────────────────
DATASET_DASHBOARD_CSV = BASE / "data" / "processed" / "dataset_dashboard_seluruh_provinsi.csv"
DATASET_32_CSV        = BASE / "data" / "processed" / "dataset_32_provinsi_lengkap.csv"
PASANGAN_CSV          = BASE / "data" / "processed" / "pasangan_fitur_target.csv"
TREN_CSV              = BASE / "data" / "processed" / "tren_tahunan_kemiskinan.csv"
RINGKASAN_PROV_CSV    = BASE / "data" / "processed" / "ringkasan_kemiskinan_per_provinsi.csv"
PROV_TERTINGGI_CSV    = BASE / "data" / "processed" / "provinsi_tertinggi_terendah_per_tahun.csv"
STATISTIK_CSV         = BASE / "data" / "processed" / "statistik_deskriptif.csv"
PROFILE_JSON          = BASE / "data" / "processed" / "dataset_profile.json"

# ── Evaluation paths ──────────────────────────────────────────────────────────
METRIK_CSV            = BASE / "data" / "evaluation" / "perbandingan_metrik_testing_2025.csv"
PREDIKSI_CSV          = BASE / "data" / "evaluation" / "prediksi_dan_residual_per_provinsi_2025.csv"
FEAT_IMP_CSV          = BASE / "data" / "evaluation" / "feature_importance_random_forest.csv"
PERM_IMP_CSV          = BASE / "data" / "evaluation" / "permutation_importance_training_eksploratif.csv"
KORELASI_CSV          = BASE / "data" / "evaluation" / "korelasi_fitur_dengan_kemiskinan.csv"
KORELASI_SP_CSV       = BASE / "data" / "evaluation" / "korelasi_spearman_fitur_dengan_kemiskinan.csv"
RF_PARAMS_CSV         = BASE / "data" / "evaluation" / "hasil_pemilihan_parameter_random_forest.csv"
SPLIT_CSV             = BASE / "data" / "evaluation" / "ringkasan_pembagian_data.csv"
ERROR_TOP_CSV         = BASE / "data" / "evaluation" / "10_kesalahan_prediksi_terbesar.csv"
PERSIST_COMP_CSV      = BASE / "data" / "evaluation" / "perbandingan_error_model_terbaik_vs_persistence.csv"
CAKUPAN_CSV           = BASE / "data" / "evaluation" / "cakupan_data_per_provinsi.csv"

# ── Research metadata ─────────────────────────────────────────────────────────
METADATA_JSON         = BASE / "docs" / "research" / "metadata_eksperimen.json"
RINGKASAN_TXT         = BASE / "docs" / "research" / "ringkasan_insight_project2.txt"

EXCLUDED_PROVINCES = {
    "Papua", "Papua Barat", "Papua Selatan",
    "Papua Tengah", "Papua Pegunungan", "Papua Barat Daya",
}


class DataService:
    def __init__(self):
        self._df32: pd.DataFrame | None = None
        self._df_dashboard: pd.DataFrame | None = None
        self._df_pasangan: pd.DataFrame | None = None
        self._df_tren: pd.DataFrame | None = None
        self._df_prov_ringkasan: pd.DataFrame | None = None
        self._metadata: dict | None = None

    def load_all(self):
        if DATASET_32_CSV.exists():
            self._df32 = pd.read_csv(DATASET_32_CSV)
        elif (BASE / "data" / "processed" / "dataset_model_32_provinsi.csv").exists():
            self._df32 = pd.read_csv(BASE / "data" / "processed" / "dataset_model_32_provinsi.csv")

        if DATASET_DASHBOARD_CSV.exists():
            self._df_dashboard = pd.read_csv(DATASET_DASHBOARD_CSV)
        else:
            self._df_dashboard = self._df32.copy()

        if PASANGAN_CSV.exists():
            self._df_pasangan = pd.read_csv(PASANGAN_CSV)
        if TREN_CSV.exists():
            self._df_tren = pd.read_csv(TREN_CSV)
        if RINGKASAN_PROV_CSV.exists():
            self._df_prov_ringkasan = pd.read_csv(RINGKASAN_PROV_CSV)

        if METADATA_JSON.exists():
            with open(METADATA_JSON, "r", encoding="utf-8") as f:
                self._metadata = json.load(f)
        else:
            self._metadata = {}

    # ── Properties ────────────────────────────────────────────────────────────
    @property
    def df32(self) -> pd.DataFrame:
        if self._df32 is None:
            self.load_all()
        return self._df32

    @property
    def df_dashboard(self) -> pd.DataFrame:
        if self._df_dashboard is None:
            self.load_all()
        return self._df_dashboard

    @property
    def df_pasangan(self) -> pd.DataFrame:
        if self._df_pasangan is None:
            self.load_all()
        return self._df_pasangan

    @property
    def df_tren(self) -> pd.DataFrame:
        if self._df_tren is None:
            self.load_all()
        return self._df_tren

    @property
    def df_prov_ringkasan(self) -> pd.DataFrame:
        if self._df_prov_ringkasan is None:
            self.load_all()
        return self._df_prov_ringkasan

    @property
    def metadata(self) -> dict:
        if self._metadata is None:
            self.load_all()
        return self._metadata

    # ── Queries ───────────────────────────────────────────────────────────────
    def get_provinces(self, model_only: bool = False) -> list[str]:
        if model_only:
            return sorted(self.df32["provinsi"].unique().tolist())
        return sorted(self.df_dashboard["provinsi"].unique().tolist())

    def get_years(self) -> list[int]:
        return sorted(self.df_dashboard["tahun"].unique().tolist())

    def get_annual_trend(self) -> list[dict]:
        records = self.df_tren.to_dict(orient="records")
        clean = []
        for r in records:
            clean.append({k: (None if pd.isna(v) else v) for k, v in r.items()})
        return clean

    def get_province_summary(self) -> list[dict]:
        records = self.df_prov_ringkasan.to_dict(orient="records")
        clean = []
        for r in records:
            clean.append({k: (None if pd.isna(v) else v) for k, v in r.items()})
        return clean

    def get_province_history(self, province: str) -> list[dict]:
        # Search dashboard first for full history
        df = self.df_dashboard[self.df_dashboard["provinsi"] == province].sort_values("tahun")
        if df.empty:
            df = self.df32[self.df32["provinsi"] == province].sort_values("tahun")
        records = df.to_dict(orient="records")
        clean = []
        for r in records:
            clean.append({k: (None if pd.isna(v) else v) for k, v in r.items()})
        return clean

    def get_year_data(self, year: int) -> dict | None:
        df = self.df_dashboard[self.df_dashboard["tahun"] == year]
        if df.empty:
            return None
        raw_records = df.sort_values("kemiskinan", ascending=False).to_dict(orient="records")
        records = [{k: (None if pd.isna(v) else v) for k, v in r.items()} for r in raw_records]
        poverty_rates = [r["kemiskinan"] for r in records if r.get("kemiskinan") is not None]
        rls_rates = [r["rls"] for r in records if r.get("rls") is not None]
        return {
            "year": year,
            "province_count": len(records),
            "avg_poverty_rate": round(sum(poverty_rates) / len(poverty_rates), 4) if poverty_rates else 0.0,
            "avg_rls": round(sum(rls_rates) / len(rls_rates), 4) if rls_rates else 0.0,
            "min_poverty": round(min(poverty_rates), 4) if poverty_rates else 0.0,
            "max_poverty": round(max(poverty_rates), 4) if poverty_rates else 0.0,
            "records": records,
        }

    def get_feature_row(self, province: str, year: int) -> dict | None:
        """Return features for model input (fitur tahun t → target t+1). Must be from 32 province panel."""
        df = self.df32[
            (self.df32["provinsi"] == province) & (self.df32["tahun"] == year)
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

    def get_records_paginated(self, page: int = 1, page_size: int = 50,
                              search: str = "", year: int | None = None) -> dict:
        df = self.df_dashboard.copy()
        if search:
            df = df[df["provinsi"].str.contains(search, case=False, na=False)]
        if year:
            df = df[df["tahun"] == year]
        total = len(df)
        start = (page - 1) * page_size
        page_df = df.sort_values(["tahun", "provinsi"]).iloc[start: start + page_size]
        raw_records = page_df.to_dict(orient="records")
        clean_records = [{k: (None if pd.isna(v) else v) for k, v in r.items()} for r in raw_records]
        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "records": clean_records,
        }

    # ── Evaluation data ───────────────────────────────────────────────────────
    def get_metrics(self) -> list[dict]:
        if not METRIK_CSV.exists():
            return []
        df = pd.read_csv(METRIK_CSV)
        out = []
        for _, row in df.iterrows():
            out.append({
                "model": row["model"],
                "split": "test_2025",
                "n_samples": 32,
                "MAE": float(row["MAE"]),
                "RMSE": float(row["RMSE"]),
                "R2": float(row["R2"]),
            })
        return out

    def get_predictions_2025(self) -> list[dict]:
        if not PREDIKSI_CSV.exists():
            return []
        df = pd.read_csv(PREDIKSI_CSV)
        out = []
        for _, row in df.iterrows():
            d = row.to_dict()
            # Canonical & alias keys for complete frontend and test compatibility
            actual = float(row["target_actual"])
            pred = float(row["prediction"])
            res = float(row["residual_actual_minus_predicted"])
            abs_err = float(row["absolute_error"])
            d["target_actual"] = actual
            d["prediction"] = pred
            d["residual_actual_minus_predicted"] = res
            d["absolute_error"] = abs_err
            d["kemiskinan_aktual"] = actual
            d["kemiskinan_prediksi"] = pred
            d["residual"] = res
            out.append(d)
        return out

    def get_feature_importance(self) -> list[dict]:
        if not FEAT_IMP_CSV.exists():
            return []
        df = pd.read_csv(FEAT_IMP_CSV)
        out = []
        for _, row in df.iterrows():
            val = float(row["random_forest_impurity_importance"])
            out.append({
                "fitur": row["fitur"],
                "random_forest_impurity_importance": val,
                "feature_importance": val,
            })
        return out

    def get_permutation_importance(self) -> list[dict]:
        if not PERM_IMP_CSV.exists():
            return []
        df = pd.read_csv(PERM_IMP_CSV)
        out = []
        for _, row in df.iterrows():
            mean_val = float(row["mean_permutation_importance_MAE_training"])
            std_val = float(row["std_permutation_importance_MAE_training"])
            out.append({
                "fitur": row["fitur"],
                "mean_permutation_importance_MAE_training": mean_val,
                "std_permutation_importance_MAE_training": std_val,
                "permutation_importance_mean": mean_val,
                "permutation_importance_std": std_val,
            })
        return out

    def get_correlation_pearson(self) -> list[dict]:
        if not KORELASI_CSV.exists():
            return []
        df = pd.read_csv(KORELASI_CSV)
        out = []
        for _, row in df.iterrows():
            d = row.to_dict()
            val = float(row.get("korelasi_dengan_kemiskinan", 0))
            d["korelasi_dengan_kemiskinan"] = val
            d["korelasi_pearson_dengan_kemiskinan"] = val
            out.append(d)
        return out

    def get_correlation_spearman(self) -> list[dict]:
        if not KORELASI_SP_CSV.exists():
            return []
        df = pd.read_csv(KORELASI_SP_CSV)
        out = []
        for _, row in df.iterrows():
            d = row.to_dict()
            val = float(row.get("korelasi_spearman_dengan_kemiskinan", row.get("korelasi_dengan_kemiskinan", 0)))
            d["korelasi_spearman_dengan_kemiskinan"] = val
            d["korelasi_dengan_kemiskinan"] = val
            out.append(d)
        return out

    def get_rf_params(self) -> list[dict]:
        if not RF_PARAMS_CSV.exists():
            return []
        df = pd.read_csv(RF_PARAMS_CSV)
        return df.to_dict(orient="records")

    def get_split_summary(self) -> list[dict]:
        if not SPLIT_CSV.exists():
            return []
        df = pd.read_csv(SPLIT_CSV)
        return df.to_dict(orient="records")

    def get_top_errors(self) -> list[dict]:
        if not ERROR_TOP_CSV.exists():
            return []
        df = pd.read_csv(ERROR_TOP_CSV)
        return df.to_dict(orient="records")

    def get_persistence_comparison(self) -> list[dict]:
        if not PERSIST_COMP_CSV.exists():
            return []
        df = pd.read_csv(PERSIST_COMP_CSV)
        return df.to_dict(orient="records")

    def get_dataset_profile(self) -> dict:
        if PROFILE_JSON.exists():
            with open(PROFILE_JSON, "r", encoding="utf-8") as f:
                prof = json.load(f)
        else:
            prof = {}

        prof.setdefault("rows", len(self.df_dashboard))
        prof.setdefault("columns", self.df_dashboard.columns.tolist())
        prof.setdefault("years", sorted(self.df_dashboard["tahun"].unique().tolist()))
        prof.setdefault("province_count", self.df_dashboard["provinsi"].nunique())
        prof["provinces"] = self.get_provinces(model_only=False)
        prof["model_provinces_list"] = self.get_provinces(model_only=True)
        prof.setdefault("missing_values", self.df_dashboard.isnull().sum().to_dict())
        prof.setdefault("duplicate_province_year_rows", int(self.df_dashboard.duplicated(subset=["provinsi", "tahun"]).sum()))
        prof["duplicate_rows"] = prof.get("duplicate_province_year_rows", 0)
        prof["excluded_provinces"] = sorted(EXCLUDED_PROVINCES)
        prof["note"] = (
            "Panel penelitian: 32 provinsi, 2017–2025. Enam provinsi Papua dikecualikan "
            "dari pemodelan karena masalah keterbandingan data dan pemekaran administratif."
        )
        return prof


data_service = DataService()
