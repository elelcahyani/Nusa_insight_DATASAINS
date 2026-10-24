import { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts'
import { Info, TrendingDown, ArrowDownRight, ArrowUpRight, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import BackendBanner from '@/components/ui/BackendBanner'
import { useApi } from '@/lib/useApi'
import { getDashboardTrend, getDashboardSummary, getCorrelationPearson, getCorrelationSpearman } from '@/services/api'
import { formatPct } from '@/lib/utils'
import type { AnnualTrend, CorrelationRow } from '@/types'

const ALL_YEARS = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]

export default function HistoricalAnalysis() {
  const [compareYear1, setCompareYear1] = useState(2017)
  const [compareYear2, setCompareYear2] = useState(2025)

  const { data: trendRaw, status: trendStatus, error: trendError } = useApi(getDashboardTrend, [])
  const { data: pearsonCorr } = useApi(getCorrelationPearson, [])
  const { data: spearmanCorr } = useApi(getCorrelationSpearman, [])

  const { data: sum1, status: sum1Status } = useApi(
    () => getDashboardSummary(compareYear1), [compareYear1]
  )
  const { data: sum2, status: sum2Status } = useApi(
    () => getDashboardSummary(compareYear2), [compareYear2]
  )

  const trendData = useMemo(() =>
    (trendRaw ?? []).map((r: AnnualTrend) => ({
      year: r.tahun,
      kemiskinan: parseFloat(r.rata_rata_kemiskinan.toFixed(2)),
      rls: parseFloat(r.rata_rata_rls.toFixed(2)),
      garis: Math.round(r.rata_rata_garis_maret / 1000),
      penduduk: parseFloat(r.rata_rata_penduduk_ribu.toFixed(0)),
    })),
    [trendRaw]
  )

  // YoY change (Year-over-Year Delta)
  const yoyData = useMemo(() => {
    return trendData.slice(1).map((r, i) => {
      const prev = trendData[i]
      return {
        year: `${prev.year}→${r.year}`,
        delta: parseFloat((r.kemiskinan - prev.kemiskinan).toFixed(2)),
      }
    })
  }, [trendData])

  // Scatter: RLS vs Poverty for year2
  const scatterData2 = useMemo(() =>
    (sum2?.records ?? []).map(r => ({
      x: r.rls, y: r.kemiskinan, label: r.provinsi,
    })),
    [sum2]
  )

  // Province changes between the two selected years
  const compareData = useMemo(() => {
    const map1 = Object.fromEntries((sum1?.records ?? []).map(r => [r.provinsi, r.kemiskinan]))
    const map2 = Object.fromEntries((sum2?.records ?? []).map(r => [r.provinsi, r.kemiskinan]))
    const provinces = new Set([...Object.keys(map1), ...Object.keys(map2)])
    return Array.from(provinces)
      .filter(p => map1[p] != null && map2[p] != null)
      .map(p => ({
        provinsi: p,
        [compareYear1]: map1[p],
        [compareYear2]: map2[p],
        delta: parseFloat(((map2[p] ?? 0) - (map1[p] ?? 0)).toFixed(2)),
      }))
      .sort((a, b) => (a.delta as number) - (b.delta as number))
  }, [sum1, sum2, compareYear1, compareYear2])

  const isError = trendStatus === 'error'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#172033]">Historical & Correlation Analysis</h1>
        <p className="text-sm text-[#667085]">
          Analisis deret waktu 2017–2025, dinamika perubahan tahunan, dan asosiasi statistik indikator
        </p>
      </div>

      {isError && <BackendBanner status={trendStatus} error={trendError} />}

      {/* Methodological Context Alert */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs leading-relaxed">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Pembedaan Korelasi dan Sebab-Akibat:</span> Hubungan korelasi Pearson dan Spearman di bawah ini menggambarkan kekuatan asosiasi linier dan monotonik antarvariabel dalam panel data. Nilai korelasi negatif yang kuat tidak membuktikan bahwa kenaikan garis kemiskinan atau lama sekolah secara langsung menurunkan persentase kemiskinan. Variasi lintas provinsi (efek spasial) juga dapat bercampur dengan perubahan temporal di dalam tiap provinsi dari tahun ke tahun.
        </div>
      </div>

      {/* Trend Overview and YoY Delta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend Kemiskinan 9 Tahun */}
        <Card className="lg:col-span-2 p-5">
          <CardTitle className="text-base mb-1">Tren Rata-rata Kemiskinan (2017–2025)</CardTitle>
          <p className="text-xs text-[#667085] mb-4">
            Rata-rata 32 provinsi penelitian: dari 10.38% (2017) menjadi 8.34% (2025)
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF2" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#667085' }} />
                <YAxis tick={{ fontSize: 11, fill: '#667085' }} tickFormatter={v => `${v}%`} domain={['auto', 'auto']} />
                <Tooltip
                  formatter={(v: unknown) => [`${(v as number).toFixed(2)}%`, 'Rata-rata Kemiskinan']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5EAF2', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="kemiskinan"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#6366F1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Perubahan Tahunan (YoY Delta) */}
        <Card className="p-5">
          <CardTitle className="text-base mb-1">Perubahan Tahunan (YoY Δ)</CardTitle>
          <p className="text-xs text-[#667085] mb-4">Perubahan poin persentase tahun ke tahun</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yoyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF2" />
                <XAxis dataKey="year" tick={{ fontSize: 9, fill: '#667085' }} />
                <YAxis tick={{ fontSize: 11, fill: '#667085' }} tickFormatter={v => `${v} pp`} />
                <Tooltip
                  formatter={(v: unknown) => [`${(v as number).toFixed(2)} pp`, 'Δ Kemiskinan']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5EAF2', fontSize: '12px' }}
                />
                <Bar dataKey="delta">
                  {yoyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.delta <= 0 ? '#14B8A6' : '#F43F5E'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Correlation Section: Pearson & Spearman */}
      <Card className="p-5">
        <CardTitle className="text-base mb-1">Matriks Korelasi Indikator dengan Tingkat Kemiskinan</CardTitle>
        <p className="text-xs text-[#667085] mb-4">
          Pearson mengukur hubungan linier; Spearman mengukur hubungan monotonik (berdasarkan peringkat).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pearson */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#172033] pb-1 border-b border-[#E5EAF2]">
              <span>Fitur / Indikator</span>
              <span>Korelasi Pearson (r)</span>
            </div>
            {(pearsonCorr ?? [
              { fitur: 'garis_maret', korelasi_dengan_kemiskinan: -0.390, arah: 'negatif', kekuatan_absolut: 0.390 },
              { fitur: 'rls', korelasi_dengan_kemiskinan: -0.334, arah: 'negatif', kekuatan_absolut: 0.334 },
              { fitur: 'kepadatan', korelasi_dengan_kemiskinan: -0.239, arah: 'negatif', kekuatan_absolut: 0.239 },
              { fitur: 'penduduk_ribu', korelasi_dengan_kemiskinan: -0.025, arah: 'negatif', kekuatan_absolut: 0.025 },
            ]).map((c: CorrelationRow) => {
              const val = c.korelasi_dengan_kemiskinan ?? c.korelasi_pearson_dengan_kemiskinan ?? 0
              return (
                <div key={c.fitur} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F5F7FB] text-xs">
                  <span className="font-mono font-medium text-[#172033]">{c.fitur}</span>
                  <span className="font-bold text-indigo-700">
                    {typeof val === 'number' ? val.toFixed(3) : '—'}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Spearman */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#172033] pb-1 border-b border-[#E5EAF2]">
              <span>Fitur / Indikator</span>
              <span>Korelasi Spearman (ρ)</span>
            </div>
            {(spearmanCorr ?? [
              { fitur: 'garis_maret', korelasi_dengan_kemiskinan: -0.421, arah: 'negatif', kekuatan_absolut: 0.421 },
              { fitur: 'rls', korelasi_dengan_kemiskinan: -0.366, arah: 'negatif', kekuatan_absolut: 0.366 },
              { fitur: 'kepadatan', korelasi_dengan_kemiskinan: -0.252, arah: 'negatif', kekuatan_absolut: 0.252 },
              { fitur: 'penduduk_ribu', korelasi_dengan_kemiskinan: -0.043, arah: 'negatif', kekuatan_absolut: 0.043 },
            ]).map((c: CorrelationRow) => {
              const val = c.korelasi_spearman_dengan_kemiskinan ?? c.korelasi_dengan_kemiskinan ?? 0
              return (
                <div key={c.fitur} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F5F7FB] text-xs">
                  <span className="font-mono font-medium text-[#172033]">{c.fitur}</span>
                  <span className="font-bold text-teal-700">
                    {typeof val === 'number' ? val.toFixed(3) : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Two-Year Historical Delta Comparison */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <CardTitle className="text-base">Perubahan Tingkat Kemiskinan Antar Dua Tahun</CardTitle>
            <p className="text-xs text-[#667085]">
              Provinsi dengan penurunan kemiskinan terbesar (paling berhasil) diurutkan di atas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#667085]">Dari:</span>
            <Select
              value={compareYear1}
              onChange={v => setCompareYear1(Number(v))}
              options={ALL_YEARS.map(y => ({ value: y, label: String(y) }))}
              className="w-24 text-xs"
            />
            <span className="text-xs text-[#667085]">Ke:</span>
            <Select
              value={compareYear2}
              onChange={v => setCompareYear2(Number(v))}
              options={ALL_YEARS.map(y => ({ value: y, label: String(y) }))}
              className="w-24 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F7FB] text-xs font-semibold text-[#667085] sticky top-0">
              <tr>
                <th className="text-left py-2 px-3">Provinsi</th>
                <th className="text-right py-2 px-3">Kemiskinan {compareYear1}</th>
                <th className="text-right py-2 px-3">Kemiskinan {compareYear2}</th>
                <th className="text-right py-2 px-3">Perubahan (Δ pp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF2]">
              {compareData.map(r => (
                <tr key={r.provinsi} className="hover:bg-[#F5F7FB]">
                  <td className="py-2 px-3 text-xs font-medium text-[#172033]">{r.provinsi}</td>
                  <td className="py-2 px-3 text-right text-xs text-[#667085]">{formatPct(r[compareYear1] as number)}</td>
                  <td className="py-2 px-3 text-right text-xs text-[#667085]">{formatPct(r[compareYear2] as number)}</td>
                  <td className="py-2 px-3 text-right text-xs font-bold">
                    <span className={`inline-flex items-center gap-1 ${
                      (r.delta as number) <= 0 ? 'text-teal-600' : 'text-rose-600'
                    }`}>
                      {(r.delta as number) <= 0 ? (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                      {(r.delta as number) > 0 ? '+' : ''}{(r.delta as number).toFixed(2)} pp
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
