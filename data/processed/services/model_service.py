"""Model service — loads .joblib models once at startup, never retrains on request."""
import json
import warnings
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

ARTIFACTS = Path(__file__).resolve().parent.parent / "artifacts" / "A_tanpa_papua"
RF_PATH = ARTIFACTS / "random_forest.joblib"
LR_PATH = ARTIFACTS / "linear_regression.joblib"
META_PATH = ARTIFACTS / "model_metadata.json"

FEATURE_ORDER = ["rls", "garis_maret", "penduduk_ribu", "kepadatan"]

EXCLUDED_PROVINCES = {
    "Papua", "Papua Barat", "Papua Selatan",
    "Papua Tengah", "Papua Pegunungan", "Papua Barat Daya",
}


class ModelService:
    def __init__(self):
        self._rf = None
        self._lr = None
        self._metadata: dict | None = None

    def load_models(self):
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            self._rf = joblib.load(RF_PATH)
            self._lr = joblib.load(LR_PATH)
        with open(META_PATH, "r", encoding="utf-8") as f:
            self._metadata = json.load(f)

    @property
    def rf(self):
        if self._rf is None:
            self.load_models()
        return self._rf

    @property
    def lr(self):
        if self._lr is None:
            self.load_models()
        return self._lr

    @property
    def metadata(self) -> dict:
        if self._metadata is None:
            self.load_models()
        return self._metadata

    def is_supported_province(self, province: str) -> bool:
        return province not in EXCLUDED_PROVINCES

    def predict(
        self,
        province: str,
        reference_year: int,
        rls: float,
        garis_maret: float,
        penduduk_ribu: float,
        kepadatan: float,
        model_type: str = "randomforest",
    ) -> dict:
        if not self.is_supported_province(province):
            raise ValueError(
                f"Provinsi '{province}' tidak didukung oleh model. "
                f"Model dilatih pada 32 provinsi dan tidak mencakup: {', '.join(sorted(EXCLUDED_PROVINCES))}."
            )

        # Pass as DataFrame with feature names to avoid sklearn warnings
        X = pd.DataFrame(
            [[rls, garis_maret, penduduk_ribu, kepadatan]],
            columns=FEATURE_ORDER,
        )
        model = self.rf if model_type == "randomforest" else self.lr
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            prediction = float(model.predict(X)[0])

        return {
            "province": province,
            "reference_year": reference_year,
            "target_year": reference_year + 1,
            "model": model_type,
            "predicted_poverty_rate": round(prediction, 4),
            "input_features": {
                "rls": rls,
                "garis_maret": garis_maret,
                "penduduk_ribu": penduduk_ribu,
                "kepadatan": kepadatan,
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "is_demo_mode": False,
            "disclaimer": (
                "Nilai ini adalah estimasi model berbasis data historis. "
                "Bukan prediksi resmi dan tidak mempertimbangkan faktor eksternal. "
                f"Skor evaluasi model pada data uji 2025 (32 sampel) tidak menjamin "
                f"akurasi serupa pada tahun {reference_year + 1}."
            ),
        }


model_service = ModelService()
