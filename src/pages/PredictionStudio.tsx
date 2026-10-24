import { useState, useMemo, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { Brain, AlertCircle, CheckCircle2, Clock, Info, AlertTriangle, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import BackendBanner from '@/components/ui/BackendBanner'
import { useApi } from '@/lib/useApi'
import { getProvinces, getProvinceHistory, generatePrediction } from '@/services/api'
import { formatPct } from '@/lib/utils'
import type { PredictResponse, ProvinceRow } from '@/types'

const REFERENCE_YEARS = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]

export default function PredictionStudio() {
  const [province, setProvince] = useState('')
  const [refYear, setRefYear] = useState(2025)
  const [model, setModel] = useState<'random_forest' | 'linear_regression'>('random_forest')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<PredictResponse[]>([])

  // Load 32 model provinces only
  const { data: provinces, status: provincesStatus, error: provincesError } = useApi(
    () => getProvinces(true), []
  )

  // Default province
  useEffect(() => {
    if (provinces && provinces.length > 0 && !province) {
      setProvince(provinces[0])
    }
  }, [provinces, province])

  // Load historical data for selected province
  const { data: historyData, status: historyStatus } = useApi(
    () => province ? getProvinceHistory(province) : Promise.resolve([]),
    [province]
  )

  // Feature row for selected province and year
  const refData: ProvinceRow | undefined = useMemo(() => {
    if (!historyData) return undefined
    return historyData.find(r => r.tahun === refYear)
  }, [historyData, refYear])

  // Chart data: history + prediction
  const chartData = useMemo(() => {
    const base: { year: number; observed: number | null; predicted: number | null }[] =
      (historyData ?? []).map(r => ({
        year: r.tahun,
        observed: r.kemiskinan,
        predicted: null,
      }))
    if (result && result.province === province) {
      base.push({ year: result.target_year, observed: null, predicted: result.predicted_poverty_rate })
    }
    return base
  }, [historyData, result, province])

  const prevObserved = useMemo(() => {
    if (!historyData) return undefined
    return historyData.find(r => r.tahun === refYear)
  }, [historyData, refYear])

  const diff = result && prevObserved
    ? result.predicted_poverty_rate - prevObserved.kemiskinan
    : null

  async function handlePredict() {
    if (!province || !refData) return
    setLoading(true)
    setError(null)
    try {
      const res = await generatePrediction({
        province,
        reference_year: refYear,
        model,
      })
      setResult(res)
      setHistory(h => [res, ...h].slice(0, 5))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghasilkan prediksi.')
    } finally {
      setLoading(false)
    }
  }

  const isBackendError = provincesStatus === 'error'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#172033]">Prediction Studio</h1>
        <p className="text-sm text-[#667085]">
          Simulasi estimasi tingkat kemiskinan provinsi tahun depan ($t+1$) berdasarkan empat indikator tahun acuan ($t$)
        </p>
      </div>

      {isBackendError && <BackendBanner status={provincesStatus} error={provincesError} />}

      {/* Critical Scientific Disclaimer Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs leading-relaxed">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-950">Peringatan Penting Interpretasi Model:</span> Berdasarkan hasil evaluasi data uji 2025, <strong>Persistence Baseline (nilai tahun sebelumnya, MAE = 0.645 pp) mengungguli Random Forest (MAE = 1.488 pp) dan Linear Regression (MAE = 2.336 pp)</strong>. Tingkat kemiskinan provinsi memiliki inersia struktural yang kuat. Prediksi model ini adalah <em>alat eksplorasi skenario perubahan indikator</em>, bukan angka proyeksi resmi BPS atau dasar tunggal kebijakan publik.
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Input Parameters Card */}
        <Card className="p-5 space-y-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-600" />
            Parameter Masukan
          </CardTitle>

          {/* Province selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#172033]">
              Provinsi (32 Provinsi Panel)
            </label>
            <Select
              value={province}
              onChange={v => { setProvince(String(v)); setResult(null); }}
              options={(provinces ?? []).map(p => ({ value: p, label: p }))}
              className="w-full text-xs"
            />
            <p className="text-[10px] text-[#667085]">
              *6 provinsi di wilayah Papua dikecualikan karena perubahan batas administratif.
            </p>
          </div>

          {/* Reference Year */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#172033]">
              Tahun Fitur Acuan ($t$)
            </label>
            <Select
              value={refYear}
              onChange={v => { setRefYear(Number(v)); setResult(null); }}
              options={REFERENCE_YEARS.map(y => ({ value: y, label: `${y} (Target: ${y + 1})` }))}
              className="w-full text-xs"
            />
          </div>

          {/* Model selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#172033]">
              Algoritma Model
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModel('random_forest')}
                className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                  model === 'random_forest'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-600'
                    : 'border-[#E5EAF2] bg-white text-[#667085] hover:bg-[#F5F7FB]'
                }`}
              >
                <div className="font-semibold text-[#172033]">Random Forest</div>
                <div className="text-[10px] text-[#667085] mt-0.5">Tuned (n=300, leaf=1)</div>
              </button>
              <button
                type="button"
                onClick={() => setModel('linear_regression')}
                className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                  model === 'linear_regression'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-600'
                    : 'border-[#E5EAF2] bg-white text-[#667085] hover:bg-[#F5F7FB]'
                }`}
              >
                <div className="font-semibold text-[#172033]">Linear Regression</div>
                <div className="text-[10px] text-[#667085] mt-0.5">StandardScaler + OLS</div>
              </button>
            </div>
          </div>

          {/* Automatically Populated Features Preview */}
          <div className="space-y-2 pt-2 border-t border-[#E5EAF2]">
            <p className="text-xs font-semibold text-[#172033]">
              Nilai Indikator Terbaca ({refYear})
            </p>
            {refData ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-[#F5F7FB] border border-[#E5EAF2]">
                  <span className="text-[10px] text-[#667085] block">RLS (tahun)</span>
                  <span className="font-semibold text-[#172033]">{refData.rls.toFixed(2)}</span>
                </div>
                <div className="p-2 rounded bg-[#F5F7FB] border border-[#E5EAF2]">
                  <span className="text-[10px] text-[#667085] block">Garis Kemiskinan</span>
                  <span className="font-semibold text-[#172033]">Rp {Math.round(refData.garis_maret).toLocaleString('id-ID')}</span>
                </div>
                <div className="p-2 rounded bg-[#F5F7FB] border border-[#E5EAF2]">
                  <span className="text-[10px] text-[#667085] block">Penduduk (ribu)</span>
                  <span className="font-semibold text-[#172033]">{refData.penduduk_ribu.toLocaleString('id-ID')}</span>
                </div>
                <div className="p-2 rounded bg-[#F5F7FB] border border-[#E5EAF2]">
                  <span className="text-[10px] text-[#667085] block">Kepadatan (jiwa/km²)</span>
                  <span className="font-semibold text-[#172033]">{refData.kepadatan.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg">
                Data fitur tidak tersedia untuk tahun {refYear}.
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button
            onClick={handlePredict}
            disabled={loading || !refData}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5"
          >
            {loading ? 'Menjalankan Inferensi…' : `Prediksi Kemiskinan Tahun ${refYear + 1}`}
          </Button>
        </Card>

        {/* Right: Output & Prediction Visualization */}
        <div className="lg:col-span-2 space-y-4">
          {/* Result Card */}
          {result ? (
            <Card className="p-5 border-l-4 border-l-indigo-600 bg-gradient-to-r from-white to-indigo-50/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-100 text-indigo-700">
                      {result.model === 'random_forest' ? 'Random Forest Tuned' : 'Linear Regression'}
                    </span>
                    <span className="text-xs text-[#667085]">
                      Estimasi Target Tahun {result.target_year}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#172033]">
                    {result.province} — Prediksi: {formatPct(result.predicted_poverty_rate)}
                  </h2>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Aktual tahun acuan ({result.reference_year}): {prevObserved ? formatPct(prevObserved.kemiskinan) : '—'}
                    {diff !== null && (
                      <span className={`ml-2 font-semibold ${diff >= 0 ? 'text-rose-600' : 'text-teal-600'}`}>
                        ({diff >= 0 ? '+' : ''}{diff.toFixed(2)} pp vs tahun acuan)
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-3xl font-extrabold text-indigo-600">
                    {formatPct(result.predicted_poverty_rate)}
                  </p>
                  <p className="text-[10px] text-[#667085]">Persentase Penduduk Miskin</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E5EAF2] text-[11px] text-[#667085] leading-relaxed">
                <strong>Catatan Inferensi:</strong> {result.disclaimer}
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center border-dashed">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-60" />
              <h3 className="text-sm font-semibold text-[#172033]">Belum ada simulasi prediksi</h3>
              <p className="text-xs text-[#667085] max-w-sm mx-auto mt-1">
                Pilih provinsi, tahun fitur acuan, dan model prediktif di panel sebelah kiri, kemudian klik tombol prediksi.
              </p>
            </Card>
          )}

          {/* Historical Trend and Projection Chart */}
          <Card className="p-5">
            <CardTitle className="text-base mb-1">
              Deret Historis & Titik Estimasi: {province || 'Provinsi'}
            </CardTitle>
            <p className="text-xs text-[#667085] mb-4">
              Garis biru: data observasi BPS (2017–2025). Titik oranye: estimasi model.
            </p>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF2" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#667085' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#667085' }} tickFormatter={v => `${v}%`} domain={['auto', 'auto']} />
                  <Tooltip
                    formatter={(v: unknown, name: unknown) => [
                      typeof v === 'number' ? `${v.toFixed(2)}%` : '—',
                      name === 'observed' ? 'Data BPS Aktual' : 'Estimasi Model',
                    ]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5EAF2', fontSize: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="observed"
                    name="observed"
                    stroke="#6366F1"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#6366F1' }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    name="predicted"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={{ r: 5, fill: '#F59E0B' }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
