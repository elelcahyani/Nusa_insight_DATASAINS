import { useState, useMemo } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, Cell, Line
} from 'recharts'
import { Info, AlertTriangle, CheckCircle, BarChart3, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import BackendBanner from '@/components/ui/BackendBanner'
import { useApi } from '@/lib/useApi'
import {
  getEvaluationMetrics,
  getEvaluationPredictions,
  getFeatureImportance,
  getPermutationImportance,
} from '@/services/api'
import { formatPct } from '@/lib/utils'
import type { ModelMetric, PredictionRow, FeatureImportanceRow, PermutationImportanceRow } from '@/types'

export default function ModelComparison() {
  const { data: metricsData, status: metricsStatus, error: metricsError } = useApi(getEvaluationMetrics, [])
  const { data: predRaw, status: predStatus } = useApi(getEvaluationPredictions, [])
  const { data: featImp, status: featStatus } = useApi(getFeatureImportance, [])
  const { data: permImp, status: permStatus } = useApi(getPermutationImportance, [])

  const [activeModelTab, setActiveModelTab] = useState<'Random Forest Tuned' | 'Linear Regression'>('Random Forest Tuned')

  const testMetrics: ModelMetric[] = metricsData?.test_metrics ?? metricsData?.metrics ?? []

  // Points for Actual vs Predicted
  const activePreds = useMemo(() => {
    return (predRaw ?? []).filter(r => r.model === activeModelTab)
  }, [predRaw, activeModelTab])

  const scatterPoints = useMemo(() => {
    return activePreds.map(r => ({
      provinsi: r.provinsi,
      actual: r.target_actual ?? r.kemiskinan_aktual ?? 0,
      predicted: r.prediction ?? r.kemiskinan_prediksi ?? 0,
      residual: r.residual_actual_minus_predicted ?? r.residual ?? 0,
    }))
  }, [activePreds])

  // Sorted residuals for residual distribution chart
  const sortedResiduals = useMemo(() => {
    return [...scatterPoints].sort((a, b) => b.residual - a.residual)
  }, [scatterPoints])

  const isLoading = metricsStatus === 'loading' || metricsStatus === 'idle'
  const isError = metricsStatus === 'error'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#172033]">Evaluasi & Komparasi Model</h1>
        <p className="text-sm text-[#667085]">
          Evaluasi ilmiah performa prediksi tingkat kemiskinan pada data uji target tahun 2025 (32 provinsi panel)
        </p>
      </div>

      {isError && <BackendBanner status={metricsStatus} error={metricsError} />}

      {/* Mandatory Key Finding Alert */}
      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-950 text-xs leading-relaxed space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          Temuan Kunci Eksperimen Target 2025
        </div>
        <ul className="list-disc list-inside space-y-1 text-amber-900">
          <li>
            <strong>Persistence Baseline (nilai tahun sebelumnya) adalah model terbaik</strong> pada pengujian target 2025 dengan MAE terendah (0.645 pp) dan R² tertinggi (0.953).
          </li>
          <li>
            Model Machine Learning (Random Forest MAE = 1.488 pp, Linear Regression MAE = 2.336 pp) <strong>belum berhasil mengungguli baseline persistensi</strong>.
          </li>
          <li>
            Hasil <strong>Random Forest Baseline dan Random Forest Tuned identik</strong> (keduanya MAE = 1.488 pp). Hyperparameter tuning tidak meningkatkan performa pada data uji 2025.
          </li>
          <li>
            Tingginya R² Persistence Baseline (0.953) mencerminkan kuatnya stabilitas antarwaktu tingkat kemiskinan regional di Indonesia, bukan keunggulan model prediktif buatan.
          </li>
        </ul>
      </div>

      {/* Comparison Metrics Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Tabel Perbandingan Metrik Evaluasi Final (Target 2025, N = 32 Sampel)</CardTitle>
          <p className="text-xs text-[#667085] mt-0.5">
            Model dilatih pada pasangan tahun 2018–2024 (224 sampel) dan diuji secara out-of-time pada target 2025 menggunakan fitur 2024.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F5F7FB] text-xs font-semibold text-[#667085]">
                <tr>
                  <th className="text-left py-3 px-4">Model Evaluasi</th>
                  <th className="text-center py-3 px-3">Tahun Target</th>
                  <th className="text-center py-3 px-3">Sampel Uji</th>
                  <th className="text-right py-3 px-4">MAE (pp) ↓</th>
                  <th className="text-right py-3 px-4">RMSE (pp) ↓</th>
                  <th className="text-right py-3 px-4">R² ↑</th>
                  <th className="text-left py-3 px-4">Status & Catatan Evaluasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF2]">
                {testMetrics.map(m => {
                  const isPersistence = m.model.toLowerCase().includes('persistence')
                  const isRFTuned = m.model.includes('Tuned')
                  const isRFBase = m.model.includes('Baseline') && m.model.includes('Random Forest')
                  const isLR = m.model.includes('Linear')
                  return (
                    <tr
                      key={m.model}
                      className={isPersistence ? 'bg-teal-50/50 font-medium' : 'hover:bg-[#F5F7FB]'}
                    >
                      <td className="py-3 px-4 text-xs font-semibold text-[#172033]">
                        {m.model}
                        {isPersistence && (
                          <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
                            Performa Terbaik
                          </span>
                        )}
                        {isRFTuned && (
                          <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                            Identik Baseline
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-xs text-[#667085]">2025</td>
                      <td className="py-3 px-3 text-center text-xs text-[#667085]">32</td>
                      <td className="py-3 px-4 text-right text-xs font-bold text-[#172033]">
                        {m.MAE.toFixed(3)}
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-medium text-[#172033]">
                        {m.RMSE.toFixed(3)}
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-bold text-[#172033]">
                        {m.R2.toFixed(3)}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#667085]">
                        {isPersistence && 'Patokan sederhana kemiskinan tahun t-1; error terkecil (0.645 pp).'}
                        {isRFTuned && 'Model ML terbaik, namun MAE 1.488 pp masih lebih besar dari persistence.'}
                        {isRFBase && 'Performa sama persis dengan versi tuned (tuning tidak menambah akurasi).'}
                        {isLR && 'Performa terendah; linearitas gagal menangkap variabilitas regional.'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-[11px] text-[#667085] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>
              <strong>Keterangan Metrik:</strong> MAE (Mean Absolute Error) dan RMSE (Root Mean Squared Error) dinyatakan dalam poin persentase (pp). Tanda ↓ menandakan semakin kecil semakin baik, sedangkan ↑ menandakan semakin mendekati 1 semakin baik.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Model Selection Tabs for Detailed Analysis */}
      <div className="flex items-center gap-2 border-b border-[#E5EAF2] pb-2">
        <span className="text-xs font-semibold text-[#667085] mr-2">Model Uji untuk Visualisasi:</span>
        {(['Random Forest Tuned', 'Linear Regression'] as const).map(mod => (
          <button
            key={mod}
            onClick={() => setActiveModelTab(mod)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeModelTab === mod
                ? 'bg-indigo-600 text-white'
                : 'bg-[#F5F7FB] text-[#667085] hover:text-[#172033]'
            }`}
          >
            {mod}
          </button>
        ))}
      </div>

      {/* Actual vs Predicted & Residuals Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scatter: Actual vs Predicted */}
        <Card className="p-5">
          <CardTitle className="text-base mb-1">
            Aktual vs Prediksi: {activeModelTab} (Target 2025)
          </CardTitle>
          <p className="text-xs text-[#667085] mb-4">
            Garis diagonal putus-putus merepresentasikan prediksi sempurna ($y = x$).
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF2" />
                <XAxis
                  dataKey="actual"
                  name="Aktual"
                  type="number"
                  domain={[0, 22]}
                  tick={{ fontSize: 11, fill: '#667085' }}
                  label={{ value: 'Aktual (%)', position: 'insideBottomRight', fontSize: 10, dy: 8 }}
                />
                <YAxis
                  dataKey="predicted"
                  name="Prediksi"
                  type="number"
                  domain={[0, 22]}
                  tick={{ fontSize: 11, fill: '#667085' }}
                  label={{ value: 'Prediksi (%)', angle: -90, position: 'insideLeft', fontSize: 10, dx: 12 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload?.length) return null
                    const d = payload[0]?.payload
                    return (
                      <div className="bg-white border border-[#E5EAF2] rounded-lg p-2.5 text-xs shadow-md">
                        <p className="font-bold text-[#172033]">{d.provinsi}</p>
                        <p className="text-[#667085]">Aktual: <span className="font-medium text-[#172033]">{d.actual?.toFixed(2)}%</span></p>
                        <p className="text-[#667085]">Prediksi: <span className="font-medium text-[#172033]">{d.predicted?.toFixed(2)}%</span></p>
                        <p className="text-[#667085]">Residual: <span className={`font-semibold ${d.residual > 0 ? 'text-rose-600' : 'text-teal-600'}`}>
                          {d.residual > 0 ? '+' : ''}{d.residual?.toFixed(2)} pp
                        </span></p>
                      </div>
                    )
                  }}
                />
                <Scatter data={scatterPoints} fill="#6366F1" opacity={0.8} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Residuals per province */}
        <Card className="p-5">
          <CardTitle className="text-base mb-1">
            Analisis Residual ($Aktual - Prediksi$): {activeModelTab}
          </CardTitle>
          <p className="text-xs text-[#667085] mb-4">
            Nilai positif (+) berarti model meremehkan kemiskinan aktual (underprediction).
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedResiduals.slice(0, 10).concat(sortedResiduals.slice(-5))} margin={{ top: 5, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF2" />
                <XAxis dataKey="provinsi" tick={{ fontSize: 9, fill: '#667085' }} angle={-35} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#667085' }} tickFormatter={v => `${v} pp`} />
                <Tooltip
                  formatter={(v: unknown) => [`${(v as number).toFixed(2)} pp`, 'Residual']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5EAF2', fontSize: '12px' }}
                />
                <Bar dataKey="residual">
                  {sortedResiduals.slice(0, 10).concat(sortedResiduals.slice(-5)).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.residual >= 0 ? '#F43F5E' : '#14B8A6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Focus: Case studies on prediction errors */}
      <Card className="p-5">
        <CardTitle className="text-base mb-2">Kasus Kesalahan Prediksi Menonjol (Target 2025)</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/50">
            <p className="font-bold text-rose-800">Nusa Tenggara Timur (Underprediction Terbesar)</p>
            <p className="text-[#667085] mt-1">
              Aktual: <span className="font-semibold text-[#172033]">18.60%</span> · Prediksi RF: <span className="font-semibold text-[#172033]">9.28%</span>
            </p>
            <p className="text-rose-700 font-semibold mt-0.5">Residual: +9.32 pp</p>
            <p className="text-[#667085] mt-1 text-[11px] leading-relaxed">
              Model gagal memproyeksikan tingginya kemiskinan struktural di NTT hanya dari 4 fitur umum.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50">
            <p className="font-bold text-amber-800">Bengkulu (Underprediction)</p>
            <p className="text-[#667085] mt-1">
              Aktual: <span className="font-semibold text-[#172033]">12.08%</span> · Prediksi RF: <span className="font-semibold text-[#172033]">8.26%</span>
            </p>
            <p className="text-amber-700 font-semibold mt-0.5">Residual: +3.82 pp</p>
            <p className="text-[#667085] mt-1 text-[11px] leading-relaxed">
              Kesalahan kedua terbesar pada kelompok kemiskinan menengah di Pulau Sumatera.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-teal-200 bg-teal-50/50">
            <p className="font-bold text-teal-800">DKI Jakarta (Akurasi Tinggi)</p>
            <p className="text-[#667085] mt-1">
              Aktual: <span className="font-semibold text-[#172033]">4.28%</span> · Prediksi RF: <span className="font-semibold text-[#172033]">4.40%</span>
            </p>
            <p className="text-teal-700 font-semibold mt-0.5">Residual: -0.12 pp</p>
            <p className="text-[#667085] mt-1 text-[11px] leading-relaxed">
              Kepadatan tinggi dan RLS tinggi di wilayah perkotaan terpetakan secara presisi oleh model.
            </p>
          </div>
        </div>
      </Card>

      {/* Feature & Permutation Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Impurity Feature Importance */}
        <Card className="p-5">
          <CardTitle className="text-base mb-1">Random Forest Impurity Importance</CardTitle>
          <p className="text-xs text-[#667085] mb-3">
            Kontribusi relatif fitur dalam pembagian pohon keputusan (total = 1.0)
          </p>
          <div className="space-y-2.5">
            {(featImp ?? []).map((f: FeatureImportanceRow) => {
              const val = f.random_forest_impurity_importance ?? f.feature_importance ?? 0
              return (
                <div key={f.fitur} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#172033] font-mono">{f.fitur}</span>
                    <span className="text-[#667085]">{(val * 100).toFixed(1)}% ({val.toFixed(3)})</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E5EAF2] overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${val * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-[#667085] mt-3 italic">
            *Catatan: Feature importance hanya menunjukkan arsitektur internal pohon, bukan bukti bahwa fitur tersebut menyebabkan kemiskinan secara kausal.
          </p>
        </Card>

        {/* Permutation Importance */}
        <Card className="p-5">
          <CardTitle className="text-base mb-1">Permutation Importance (Mean Δ MAE)</CardTitle>
          <p className="text-xs text-[#667085] mb-3">
            Peningkatan MAE ketika nilai fitur diacak (semakin tinggi, semakin krusial)
          </p>
          <div className="space-y-2.5">
            {(permImp ?? []).map((p: PermutationImportanceRow) => {
              const meanVal = p.mean_permutation_importance_MAE_training ?? p.permutation_importance_mean ?? 0
              const stdVal = p.std_permutation_importance_MAE_training ?? p.permutation_importance_std ?? 0
              return (
                <div key={p.fitur} className="p-2.5 rounded-lg bg-[#F5F7FB] border border-[#E5EAF2] flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-[#172033]">{p.fitur}</span>
                  <div className="text-right">
                    <span className="font-bold text-indigo-700">+{meanVal.toFixed(2)} pp</span>
                    <span className="text-[10px] text-[#667085] ml-1.5">(±{stdVal.toFixed(2)})</span>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-[#667085] mt-3 italic">
            *Kepadatan dan RLS merupakan dua fitur dengan penurunan akurasi terbesar jika informasinya diacak.
          </p>
        </Card>
      </div>
    </div>
  )
}
