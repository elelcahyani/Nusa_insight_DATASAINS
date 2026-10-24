import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingDown, Users, MapPin, Calendar, ArrowRight, AlertCircle, RefreshCw, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import BackendBanner from '@/components/ui/BackendBanner'
import ProvinceMap from '@/components/maps/ProvinceMap'
import { useApi } from '@/lib/useApi'
import { getDashboardSummary, getDashboardTrend } from '@/services/api'
import { formatPct } from '@/lib/utils'
import type { AnnualTrend, ProvinceRow } from '@/types'

const ALL_YEARS = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]

export default function Overview() {
  const navigate = useNavigate()
  const [selectedYear, setSelectedYear] = useState(2025)

  const {
    data: summaryData,
    status: summaryStatus,
    error: summaryError,
    refetch: refetchSummary,
  } = useApi(() => getDashboardSummary(selectedYear), [selectedYear])

  const {
    data: trendRaw,
    status: trendStatus,
    error: trendError,
    refetch: refetchTrend,
  } = useApi(() => getDashboardTrend(), [])

  const trendData = useMemo(
    () => (trendRaw ?? []).map((r: AnnualTrend) => ({
      year: r.tahun,
      avg: parseFloat(r.rata_rata_kemiskinan.toFixed(2)),
      rls: parseFloat(r.rata_rata_rls.toFixed(2)),
    })),
    [trendRaw]
  )

  const yearRecords: ProvinceRow[] = summaryData?.records ?? []
  const sorted = useMemo(() => [...yearRecords].sort((a, b) => b.kemiskinan - a.kemiskinan), [yearRecords])
  const top5 = sorted.slice(0, 5)
  const bottom5 = sorted.slice(-5).reverse()

  const scatterData = useMemo(() => yearRecords.map(d => ({
    x: d.rls,
    y: d.kemiskinan,
    label: d.provinsi,
  })), [yearRecords])

  const isLoading = summaryStatus === 'loading' || summaryStatus === 'idle'
  const isError = summaryStatus === 'error' || trendStatus === 'error'
  const errorMsg = summaryError ?? trendError

  return (
    <div className="space-y-6">
      {/* Backend status */}
      {isError && (
        <div className="flex items-center gap-2">
          <BackendBanner status={summaryStatus} error={errorMsg} />
          <button
            onClick={() => { refetchSummary(); refetchTrend() }}
            className="flex items-center gap-1.5 text-xs text-[#667085] hover:text-[#172033] shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Coba lagi
          </button>
        </div>
      )}

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#101828] via-[#173B68] to-[#1a2f5e] p-6 lg:p-8">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/15 border border-teal-500/25 text-teal-300 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Data BPS 2017–2025 · Panel Penelitian 32 Provinsi
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-2">
              National Socioeconomic Analytics
            </h1>
            <p className="text-white/70 text-sm max-w-xl leading-relaxed">
              Analisis deret waktu tingkat kemiskinan provinsi di Indonesia berbasis data BPS.
              Mengevaluasi dinamika indikator sosioekonomi serta kinerja prediktif model Machine Learning.
            </p>
            <p className="text-white/45 text-xs mt-2 italic">
              "Understand Today. Anticipate Tomorrow."
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={() => navigate('/poverty-explorer')}
              className="border-white/20 text-white bg-white/10 hover:bg-white/20"
            >
              Jelajahi Data Regional
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button
              onClick={() => navigate('/model-comparison')}
              className="bg-[#22D3EE] hover:bg-[#06b6d4] text-[#101828] font-semibold"
            >
              Hasil Evaluasi Model
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Scope disclaimer notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs leading-relaxed">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Catatan Metodologi & Batasan Cakupan:</span> Rata-rata kemiskinan pada panel penelitian dihitung dari <strong>32 provinsi lengkap</strong> (2017–2025) dan <strong>bukan angka agregat resmi nasional BPS</strong> (angka resmi BPS mencakup seluruh populasi Indonesia dengan pembobotan sensus). Enam provinsi di wilayah Papua (Papua, Papua Barat, Papua Selatan, Papua Tengah, Papua Pegunungan, Papua Barat Daya) dikecualikan dari panel model karena pemekaran wilayah administratif dan konsistensi deret waktu.
        </div>
      </div>

      {/* Year filter & Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#172033]">Ringkasan Statistik ({selectedYear})</h2>
          <p className="text-xs text-[#667085]">
            {selectedYear >= 2024 ? 'Data sumber mencakup 38 provinsi (termasuk pemekaran Papua)' : 'Data sumber mencakup 34 provinsi'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#667085]">Tahun:</span>
          <Select
            value={selectedYear}
            onChange={v => setSelectedYear(Number(v))}
            options={ALL_YEARS.map(y => ({ value: y, label: String(y) }))}
            className="w-28"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: `Rata-rata Kemiskinan (${selectedYear})`,
            value: isLoading ? '…' : summaryData ? formatPct(summaryData.avg_poverty_rate) : '—',
            unit: `Rata-rata dari ${yearRecords.length} provinsi sumber`,
            icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-50',
          },
          {
            title: `Rata-rata Lama Sekolah (${selectedYear})`,
            value: isLoading ? '…' : summaryData ? `${summaryData.avg_rls.toFixed(2)} thn` : '—',
            unit: 'Rata-rata provinsi (penduduk 25+)',
            icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50',
          },
          {
            title: `Provinsi Tercatat (${selectedYear})`,
            value: isLoading ? '…' : summaryData ? `${summaryData.province_count}` : '—',
            unit: selectedYear >= 2024 ? '38 provinsi (4 pemekaran baru)' : '34 provinsi standar',
            icon: MapPin, color: 'text-teal-500', bg: 'bg-teal-50',
          },
          {
            title: 'Panel Model Konsisten',
            value: '32 Provinsi',
            unit: '2017–2025 (288 baris panel)',
            icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-50',
          },
        ].map(card => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#667085] font-medium mb-1">{card.title}</p>
                  <p className={`text-2xl font-bold text-[#172033] ${isLoading && card.value === '…' ? 'animate-pulse text-[#E5EAF2]' : ''}`}>
                    {card.value}
                  </p>
                  <p className="text-xs text-[#667085] mt-0.5">{card.unit}</p>
                </div>
                <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Charts row 1: Trend and Key Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>Tren Rata-rata Kemiskinan Panel 32 Provinsi (2017–2025)</CardTitle>
            <p className="text-xs text-[#667085] mt-0.5">
              Rata-rata 32 provinsi penelitian: turun dari 10.38% (2017) menjadi 8.34% (2025) — perubahan -2.04 pp.
            </p>
          </CardHeader>
          <CardContent>
            {trendStatus === 'loading' ? (
              <div className="h-52 flex items-center justify-center text-sm text-[#667085] animate-pulse">Memuat tren…</div>
            ) : trendStatus === 'error' ? (
              <div className="h-52 flex items-center justify-center text-sm text-rose-500">Gagal memuat data tren</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="povertyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF2" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#667085' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#667085' }} tickFormatter={v => `${v}%`} domain={['auto', 'auto']} />
                  <Tooltip
                    formatter={(v: unknown, name: unknown) => [
                      `${(v as number).toFixed(2)}%`,
                      (name as string) === 'avg' ? 'Rata-rata Kemiskinan (32 Prov)' : 'Rata-rata RLS',
                    ]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5EAF2', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone" dataKey="avg" stroke="#6366F1" strokeWidth={2.5}
                    fill="url(#povertyGrad)" dot={{ r: 3.5, fill: '#6366F1' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Insight cards */}
        <div className="space-y-3">
          {summaryData && top5.length > 0 && (
            <>
              <Card className="p-4 border-l-4 border-l-rose-500">
                <p className="text-xs font-semibold text-[#172033] mb-1">Kemiskinan Tertinggi ({selectedYear})</p>
                <p className="text-sm text-[#667085]">
                  <span className="font-semibold text-[#172033]">{top5[0]?.provinsi}</span> — {' '}
                  <span className="font-semibold text-rose-600">{formatPct(top5[0]?.kemiskinan ?? 0)}</span>
                </p>
                <p className="text-[11px] text-[#667085] mt-1">
                  Tertinggi antarprovinsi yang tercatat pada tahun {selectedYear}.
                </p>
              </Card>
              <Card className="p-4 border-l-4 border-l-teal-500">
                <p className="text-xs font-semibold text-[#172033] mb-1">Kemiskinan Terendah ({selectedYear})</p>
                <p className="text-sm text-[#667085]">
                  <span className="font-semibold text-[#172033]">{bottom5[0]?.provinsi}</span> — {' '}
                  <span className="font-semibold text-teal-600">{formatPct(bottom5[0]?.kemiskinan ?? 0)}</span>
                </p>
                <p className="text-[11px] text-[#667085] mt-1">
                  Terendah antarprovinsi yang tercatat pada tahun {selectedYear}.
                </p>
              </Card>
              <Card className="p-4 border-l-4 border-l-amber-500">
                <p className="text-xs font-semibold text-[#172033] mb-1">Rentang Sebaran ({selectedYear})</p>
                <p className="text-sm text-[#667085]">
                  Spread tingkat kemiskinan:{' '}
                  <span className="font-semibold text-[#172033]">
                    {formatPct(summaryData.min_poverty)} – {formatPct(summaryData.max_poverty)}
                  </span>
                </p>
                <p className="text-[11px] text-[#667085] mt-1">
                  Selisih: {(summaryData.max_poverty - summaryData.min_poverty).toFixed(2)} poin persentase.
                </p>
              </Card>
            </>
          )}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-xl bg-[#E5EAF2] animate-pulse" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Charts row 2: Top/bottom distribution & Observational Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top/bottom bar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Distribusi Ekstrem Kemiskinan — {selectedYear}</CardTitle>
            <p className="text-xs text-[#667085]">5 provinsi tertinggi (merah) &amp; 5 provinsi terendah (teal)</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-4 rounded bg-[#E5EAF2] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {[...top5, ...bottom5].map((d, i) => (
                  <div key={d.provinsi} className="flex items-center gap-3">
                    <span className="text-xs text-[#667085] w-36 truncate">{d.provinsi}</span>
                    <div className="flex-1 h-2 rounded-full bg-[#E5EAF2] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${i < 5 ? 'bg-rose-500' : 'bg-teal-500'}`}
                        style={{ width: `${Math.min((d.kemiskinan / 35) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[#172033] w-12 text-right">
                      {formatPct(d.kemiskinan, 1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scatter */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Rata-rata Lama Sekolah vs. Kemiskinan — {selectedYear}</CardTitle>
            <p className="text-xs text-[#667085] mt-0.5">
              Hubungan statistik observasional antarprovinsi (korelasi r = -0.334, bukan kausalitas)
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48 flex items-center justify-center text-sm text-[#667085] animate-pulse">Memuat…</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF2" />
                  <XAxis dataKey="x" name="RLS" tick={{ fontSize: 11, fill: '#667085' }}
                    label={{ value: 'RLS (tahun)', position: 'insideBottomRight', fontSize: 10, dy: 8 }} />
                  <YAxis dataKey="y" name="Kemiskinan" tick={{ fontSize: 11, fill: '#667085' }}
                    tickFormatter={v => `${v}%`} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ payload }) => {
                      if (!payload?.length) return null
                      const d = payload[0]?.payload
                      return (
                        <div className="bg-white border border-[#E5EAF2] rounded-lg px-3 py-2 text-xs shadow-md">
                          <p className="font-semibold text-[#172033]">{d.label}</p>
                          <p className="text-[#667085]">RLS: {d.x?.toFixed(2)} tahun</p>
                          <p className="text-[#667085]">Kemiskinan: {d.y?.toFixed(2)}%</p>
                        </div>
                      )
                    }}
                  />
                  <Scatter data={scatterData} fill="#6366F1" opacity={0.75} />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Choropleth map / fallback notice */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle>Peta Sebaran Geografis — {selectedYear}</CardTitle>
            {selectedYear <= 2023 ? (
              <span className="text-xs text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full font-medium">
                Peta Sebaran Nasional · 34 Wilayah
              </span>
            ) : (
              <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full font-medium">
                Peta Sebaran Nasional · Termasuk Wilayah Papua
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {isLoading ? (
            <div className="h-80 rounded-xl bg-[#E5EAF2] animate-pulse" />
          ) : summaryData ? (
            <ProvinceMap records={summaryData.records} year={selectedYear} height={380} />
          ) : (
            <div className="flex items-center gap-2 p-4">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <p className="text-sm text-[#667085]">Data tidak tersedia untuk menampilkan peta.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
