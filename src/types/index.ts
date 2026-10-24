// ── Dataset row (panel 32 provinsi & dashboard 38 provinsi) ───────────────────
export interface ProvinceRow {
  provinsi: string
  tahun: number
  kemiskinan: number
  rls: number
  garis_maret: number
  penduduk_ribu: number
  kepadatan: number
}

// ── Annual trend ──────────────────────────────────────────────────────────────
export interface AnnualTrend {
  tahun: number
  rata_rata_kemiskinan: number
  median_kemiskinan: number
  minimum_kemiskinan: number
  maksimum_kemiskinan: number
  std_kemiskinan: number
  rata_rata_rls: number
  rata_rata_garis_maret: number
  rata_rata_penduduk_ribu: number
  rata_rata_kepadatan: number
  jumlah_provinsi: number
  perubahan_rata_rata_kemiskinan_poin: number | null
}
export type AnnualSummary = AnnualTrend

// ── Province summary ──────────────────────────────────────────────────────────
export interface ProvinceSummary {
  provinsi: string
  rata_rata_kemiskinan: number
  median_kemiskinan: number
  minimum_kemiskinan: number
  maksimum_kemiskinan: number
  std_kemiskinan: number
  kemiskinan_2017: number
  kemiskinan_2025: number
  perubahan_2017_2025_poin: number
}

// ── Year snapshot ─────────────────────────────────────────────────────────────
export interface YearSnapshot {
  year: number
  province_count: number
  avg_poverty_rate: number
  avg_rls: number
  min_poverty: number
  max_poverty: number
  records: ProvinceRow[]
}

// ── Prediction ────────────────────────────────────────────────────────────────
export interface PredictRequest {
  province: string
  reference_year: number
  model: 'random_forest' | 'linear_regression' | 'randomforest' | 'linear'
}

export interface PredictResponse {
  province: string
  reference_year: number
  target_year: number
  model: string
  predicted_poverty_rate: number
  input_features: {
    rls: number
    garis_maret: number
    penduduk_ribu: number
    kepadatan: number
  }
  timestamp: string
  is_demo_mode: boolean
  disclaimer: string
}

// ── Evaluation ────────────────────────────────────────────────────────────────
export interface ModelMetric {
  model: string
  split?: string
  n_samples?: number
  MAE: number
  RMSE: number
  R2: number
}
export type TestMetric = ModelMetric

export interface EvaluationMetrics {
  test_year: number
  n_samples: number
  headline_split?: string
  note: string
  test_metrics: ModelMetric[]
  metrics: ModelMetric[]
}

export interface PredictionRow {
  provinsi: string
  feature_year: number
  target_year: number
  target_actual: number
  kemiskinan_aktual?: number
  model: string
  prediction: number
  kemiskinan_prediksi?: number
  residual_actual_minus_predicted: number
  residual?: number
  absolute_error: number
}

export interface FeatureImportanceRow {
  fitur: string
  random_forest_impurity_importance: number
  feature_importance?: number
}

export interface PermutationImportanceRow {
  fitur: string
  mean_permutation_importance_MAE_training: number
  std_permutation_importance_MAE_training: number
  permutation_importance_mean?: number
  permutation_importance_std?: number
}

export interface CorrelationRow {
  fitur: string
  korelasi_dengan_kemiskinan?: number
  korelasi_spearman_dengan_kemiskinan?: number
  korelasi_pearson_dengan_kemiskinan?: number
  arah?: string
  kekuatan_absolut?: number
}

// ── Dataset profile ───────────────────────────────────────────────────────────
export interface DatasetProfile {
  rows: number
  columns: string[]
  years: number[]
  province_count: number
  provinces: string[]
  model_provinces?: number
  model_rows?: number
  model_provinces_list?: string[]
  missing_values: Record<string, number>
  duplicate_rows: number
  duplicate_province_year_rows?: number
  province_count_by_year?: Record<string, number>
  excluded_provinces: string[]
  note: string
}

// ── API state ─────────────────────────────────────────────────────────────────
export type ApiStatus = 'idle' | 'loading' | 'success' | 'error'

// ── Legacy (for compatibility) ────────────────────────────────────────────────
export interface ProvinceData {
  province: string
  year: number
  povertyRate: number
  avgSchoolingYears: number
  povertyLine: number
  population: number
  populationDensity: number
}
