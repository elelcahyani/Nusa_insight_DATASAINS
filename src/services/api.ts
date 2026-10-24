/**
 * API Service — NUSA Insight v2
 * Connects to FastAPI backend at localhost:8000 (configurable via VITE_API_URL).
 */
import type {
  ProvinceRow, AnnualTrend, ProvinceSummary, YearSnapshot,
  PredictRequest, PredictResponse, EvaluationMetrics, PredictionRow,
  FeatureImportanceRow, PermutationImportanceRow, CorrelationRow, DatasetProfile,
} from '@/types'

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { detail?: string }).detail ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── Health ─────────────────────────────────────────────────────────────────────
export async function checkHealth() {
  return apiFetch<{ status: string; data_loaded: boolean }>('/api/health')
}

// ── Metadata ───────────────────────────────────────────────────────────────────
export async function getMetadata() {
  return apiFetch<Record<string, unknown>>('/api/metadata')
}

// ── Dataset ────────────────────────────────────────────────────────────────────
export async function getDatasetProfile(): Promise<DatasetProfile> {
  return apiFetch('/api/dataset/profile')
}

export async function getDatasetRecords(page = 1, pageSize = 50, search = '', year?: number) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize), search })
  if (year) params.set('year', String(year))
  return apiFetch<{ total: number; page: number; page_size: number; records: ProvinceRow[] }>(
    `/api/dataset/records?${params}`
  )
}

export async function getProvinces(modelOnly = false): Promise<string[]> {
  const data = await apiFetch<{ provinces: string[] }>(`/api/provinces?model_only=${modelOnly}`)
  return data.provinces
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
export async function getDashboardTrend(): Promise<AnnualTrend[]> {
  return apiFetch('/api/dashboard/trend')
}

export async function getProvinceSummary(): Promise<ProvinceSummary[]> {
  return apiFetch('/api/dashboard/province-summary')
}

export async function getYearData(year: number): Promise<YearSnapshot> {
  return apiFetch(`/api/dashboard/year/${year}`)
}

export async function getDashboardSummary(year: number): Promise<YearSnapshot> {
  return apiFetch(`/api/dashboard/summary?year=${year}`)
}

// ── Province detail ────────────────────────────────────────────────────────────
export async function getProvinceHistory(province: string): Promise<ProvinceRow[]> {
  const data = await apiFetch<{ province: string; history: ProvinceRow[] }>(
    `/api/provinces/${encodeURIComponent(province)}/history`
  )
  return data.history
}

export async function getProvinceFeatures(province: string, year: number): Promise<ProvinceRow> {
  return apiFetch(`/api/provinces/${encodeURIComponent(province)}/features/${year}`)
}

// ── Evaluation ─────────────────────────────────────────────────────────────────
export async function getEvaluationMetrics(): Promise<EvaluationMetrics> {
  return apiFetch('/api/evaluation/metrics')
}

export async function getEvaluationPredictions(): Promise<PredictionRow[]> {
  const data = await apiFetch<{ predictions: PredictionRow[] }>('/api/evaluation/predictions')
  return data.predictions
}

export async function getFeatureImportance(): Promise<FeatureImportanceRow[]> {
  const data = await apiFetch<{ feature_importance: FeatureImportanceRow[] }>(
    '/api/evaluation/feature-importance'
  )
  return data.feature_importance
}

export async function getPermutationImportance(): Promise<PermutationImportanceRow[]> {
  const data = await apiFetch<{ permutation_importance: PermutationImportanceRow[] }>(
    '/api/evaluation/permutation-importance'
  )
  return data.permutation_importance
}

export async function getCorrelationPearson(): Promise<CorrelationRow[]> {
  const data = await apiFetch<{ correlation: CorrelationRow[] }>(
    '/api/evaluation/correlation/pearson'
  )
  return data.correlation
}

export async function getCorrelationSpearman(): Promise<CorrelationRow[]> {
  const data = await apiFetch<{ correlation: CorrelationRow[] }>(
    '/api/evaluation/correlation/spearman'
  )
  return data.correlation
}

export async function getTopErrors() {
  const data = await apiFetch<{ top_errors: unknown[] }>('/api/evaluation/top-errors')
  return data.top_errors
}

export async function getPersistenceComparison() {
  const data = await apiFetch<{ comparison: unknown[] }>('/api/evaluation/persistence-comparison')
  return data.comparison
}

// ── Prediction ─────────────────────────────────────────────────────────────────
export async function generatePrediction(req: PredictRequest): Promise<PredictResponse> {
  return apiFetch('/api/predict', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}
