"""Pydantic schemas for NUSA Insight API."""
from pydantic import BaseModel, Field, field_validator


class PredictRequest(BaseModel):
    province: str = Field(..., min_length=1)
    reference_year: int = Field(..., ge=2017, le=2030,
                                 description="Tahun fitur (t) untuk memprediksi kemiskinan tahun t+1")
    model: str = Field(
        "random_forest", description="Model yang digunakan (random_forest atau linear_regression)"
    )

    @field_validator("province")
    @classmethod
    def strip_province(cls, v: str) -> str:
        return v.strip()

    @field_validator("model")
    @classmethod
    def normalize_model(cls, v: str) -> str:
        v_clean = v.strip().lower()
        if "random" in v_clean or v_clean == "rf":
            return "random_forest"
        if "linear" in v_clean or v_clean == "lr":
            return "linear_regression"
        raise ValueError("Model harus 'random_forest' atau 'linear_regression'")


class PredictResponse(BaseModel):
    province: str
    reference_year: int
    target_year: int
    model: str
    predicted_poverty_rate: float
    input_features: dict
    timestamp: str
    is_demo_mode: bool
    disclaimer: str
