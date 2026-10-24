import { useState, useMemo, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { Search, Info, Map, TableProperties, AlertCircle, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import BackendBanner from '@/components/ui/BackendBanner'
import ProvinceMap from '@/components/maps/ProvinceMap'
import { useApi } from '@/lib/useApi'
import { getDashboardSummary, getProvinceHistory, getProvinces } from '@/services/api'
import { formatPct } from '@/lib/utils'
import type { ProvinceRow } from '@/types'

const ALL_YEARS = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]

export default function PovertyExplorer() {
  const [selectedYear, setSelectedYear] = useState(2025)
  const [selectedProvince, setSelectedProvince] = useState('')
  const [compareProvince, setCompareProvince] = useState('')
  const [search, setSearch] = useState('')
  const [modelOnly, setModelOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table')

  // Load provinces list based on scope filter
  const { data: allProvinces, status: provStatus, error: provError } = useApi(
    () => getProvinces(modelOnly), [modelOnly]
  )

  // Default selection
  useEffect(() => {
    if (allProvinces && allProvinces.length > 0) {
      if (!selectedProvince || !allProvinces.includes(selectedProvince)) {
        setSelectedProvince(allProvinces[0])
      }
      if (!compareProvince || !allProvinces.includes(compareProvince)) {
        setCompareProvince(allProvinces[Math.min(5, allProvinces.length - 1)])
      }
    }
  }, [allProvinces, selectedProvince, compareProvince])

  const { data: summaryData, status: summaryStatus, error: summaryError } = useApi(
    () => getDashboardSummary(selectedYear), [selectedYear]
  )

  // Province trends for comparison
  const { data: histP1 } = useApi(
    () => selectedProvince ? getProvinceHistory(selectedProvince) : Promise.resolve([]),
    [selectedProvince]
  )
  const { data: histP2 } = useApi(
    () => compareProvince ? getProvinceHistory(compareProvince) : Promise.resolve([]),
    [compareProvince]
  )

  const yearRecords: ProvinceRow[] = useMemo(() => {
    const recs = summaryData?.records ?? []
    if (modelOnly && allProvinces) {
      return recs.filter(r => allProvinces.includes(r.provinsi))
    }
    return recs
  }, [summaryData, modelOnly, allProvinces])

  const sorted = useMemo(() =>
    [...yearRecords]
      .filter(d => d.provinsi.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.kemiskinan - a.kemiskinan),
    [yearRecords, search]
  )

  const provinceDetail = useMemo(() =>
    yearRecords.find(d => d.provinsi === selectedProvince),
    [yearRecords, selectedProvince]
  )

  const rankOfSelected = useMemo(() => {
    const allSorted = [...yearRecords].sort((a, b) => b.kemiskinan - a.kemiskinan)
    const idx = allSorted.findIndex(d => d.provinsi === selectedProvince)
    return idx >= 0 ? idx + 1 : null
  }, [yearRecords, selectedProvince])

  // Comparison trend chart data
  const comparisonTrend = useMemo(() => {
    return ALL_YEARS.map(y => {
      const p1 = (histP1 ?? []).find(r => r.tahun === y)
      const p2 = (histP2 ?? []).find(r => r.tahun === y)
      return {
        year: y,
        [selectedProvince || 'P1']: p1?.kemiskinan ?? null,
        [compareProvince || 'P2']: p2?.kemiskinan ?? null,
      }
    })
  }, [histP1, histP2, selectedProvince, compareProvince])

  const isError = provStatus === 'error' || summaryStatus === 'error'
  const isLoading = summaryStatus === 'loading' || summaryStatus === 'idle'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#172033]">Poverty Explorer</h1>
        <p className="text-sm text-[#667085]">
          Eksplorasi dan perbandingan profil indikator kemiskinan antarprovinsi di Indonesia (BPS 2017–2025)
        </p>
      </div>

      {isError && <BackendBanner status={summaryStatus} error={summaryError ?? provError} />}

      {/* Scope and Disclaimer Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs leading-relaxed">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Interpretasi Deskriptif:</span> Peringkat dan perbandingan indikator kemiskinan di bawah ini bersifat deskriptif dan mencerminkan observasi tahun terkait. Perbedaan nilai antarprovinsi tidak membuktikan hubungan sebab-akibat langsung, melainkan dipengaruhi faktor struktural geografis, demografis, dan ekonomi regional.
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E5EAF2]">
        <div className="flex flex-wrap items-center gap-3">
          {/* Year selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#667085]">Tahun:</span>
            <Select
              value={selectedYear}
              onChange={v => setSelectedYear(Number(v))}
              options={ALL_YEARS.map(y => ({ value: y, label: String(y) }))}
              className="w-24"
            />
          </div>

          {/* Model panel filter toggle */}
          <button
            onClick={() => setModelOnly(!modelOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              modelOnly
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-[#667085] border-[#E5EAF2] hover:bg-[#F5F7FB]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {modelOnly ? 'Panel Model (32 Prov)' : 'Semua Provinsi Sumber'}
          </button>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-[#F5F7FB] p-1 rounded-lg border border-[#E5EAF2]">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
              viewMode === 'table' ? 'bg-white text-[#172033] shadow-sm' : 'text-[#667085] hover:text-[#172033]'
            }`}
          >
            <TableProperties className="w-3.5 h-3.5" />
            Tabel
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
              viewMode === 'map' ? 'bg-white text-[#172033] shadow-sm' : 'text-[#667085] hover:text-[#172033]'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            Peta
          </button>
        </div>
      </div>

      {/* Main View: Table or Map */}
      {viewMode === 'table' ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle>Tabel Indikator Regional ({selectedYear})</CardTitle>
                <p className="text-xs text-[#667085] mt-0.5">
                  Menampilkan {sorted.length} provinsi{modelOnly ? ' (panel konsisten 32 provinsi)' : ''} diurutkan dari kemiskinan tertinggi
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari provinsi…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#E5EAF2] focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2 py-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-8 rounded bg-[#E5EAF2] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F5F7FB] text-xs font-semibold text-[#667085]">
                    <tr>
                      <th className="text-left py-2.5 px-3">Rank</th>
                      <th className="text-left py-2.5 px-3">Provinsi</th>
                      <th className="text-right py-2.5 px-3">Kemiskinan (%)</th>
                      <th className="text-right py-2.5 px-3">RLS (tahun)</th>
                      <th className="text-right py-2.5 px-3">Garis Kemiskinan</th>
                      <th className="text-right py-2.5 px-3">Penduduk (ribu)</th>
                      <th className="text-right py-2.5 px-3">Kepadatan (jiwa/km²)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5EAF2]">
                    {sorted.map((r, idx) => (
                      <tr
                        key={r.provinsi}
                        onClick={() => setSelectedProvince(r.provinsi)}
                        className={`cursor-pointer transition-colors ${
                          selectedProvince === r.provinsi ? 'bg-indigo-50/70 font-medium' : 'hover:bg-[#F5F7FB]'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-xs text-[#667085]">{idx + 1}</td>
                        <td className="py-2.5 px-3 text-xs text-[#172033] font-medium">{r.provinsi}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            r.kemiskinan > 15 ? 'bg-rose-50 text-rose-600'
                            : r.kemiskinan > 10 ? 'bg-amber-50 text-amber-600'
                            : 'bg-teal-50 text-teal-600'
                          }`}>
                            {formatPct(r.kemiskinan)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-xs text-[#667085]">{r.rls.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right text-xs text-[#667085]">
                          Rp {(r.garis_maret).toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right text-xs text-[#667085]">
                          {r.penduduk_ribu.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
                        </td>
                        <td className="py-2.5 px-3 text-right text-xs text-[#667085]">
                          {r.kepadatan.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle>Peta Sebaran — {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ProvinceMap records={yearRecords} year={selectedYear} height={380} />
          </CardContent>
        </Card>
      )}

      {/* Province Comparison & Historical Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Selected Province Details */}
        <Card className="p-5">
          <CardTitle className="mb-1 text-base">Profil Provinsi: {selectedProvince || '—'}</CardTitle>
          <p className="text-xs text-[#667085] mb-4">Pengamatan tahun {selectedYear}</p>
          {provinceDetail ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#F5F7FB]">
                <p className="text-xs text-[#667085]">Tingkat Kemiskinan</p>
                <p className="text-2xl font-bold text-rose-600">{formatPct(provinceDetail.kemiskinan)}</p>
                <p className="text-xs text-[#667085] mt-0.5">
                  Peringkat #{rankOfSelected} dari {yearRecords.length} provinsi ({selectedYear})
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border border-[#E5EAF2]">
                  <p className="text-[#667085]">Lama Sekolah (RLS)</p>
                  <p className="font-bold text-[#172033] mt-0.5">{provinceDetail.rls.toFixed(2)} tahun</p>
                </div>
                <div className="p-2.5 rounded-lg border border-[#E5EAF2]">
                  <p className="text-[#667085]">Garis Kemiskinan</p>
                  <p className="font-bold text-[#172033] mt-0.5">Rp {Math.round(provinceDetail.garis_maret / 1000)}k/bln</p>
                </div>
                <div className="p-2.5 rounded-lg border border-[#E5EAF2]">
                  <p className="text-[#667085]">Jumlah Penduduk</p>
                  <p className="font-bold text-[#172033] mt-0.5">{provinceDetail.penduduk_ribu.toFixed(0)} ribu</p>
                </div>
                <div className="p-2.5 rounded-lg border border-[#E5EAF2]">
                  <p className="text-[#667085]">Kepadatan</p>
                  <p className="font-bold text-[#172033] mt-0.5">{provinceDetail.kepadatan.toFixed(0)} jiwa/km²</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#667085]">Pilih salah satu provinsi untuk melihat detail lengkap.</div>
          )}
        </Card>

        {/* Head-to-Head Trend Comparison */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <CardTitle className="text-base">Perbandingan Tren Historis (2017–2025)</CardTitle>
              <p className="text-xs text-[#667085]">Bandingkan deret waktu antara dua provinsi</p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedProvince}
                onChange={v => setSelectedProvince(String(v))}
                options={(allProvinces ?? []).map(p => ({ value: p, label: p }))}
                className="w-36 text-xs"
              />
              <span className="text-xs font-semibold text-[#667085]">vs</span>
              <Select
                value={compareProvince}
                onChange={v => setCompareProvince(String(v))}
                options={(allProvinces ?? []).map(p => ({ value: p, label: p }))}
                className="w-36 text-xs"
              />
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF2" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#667085' }} />
                <YAxis tick={{ fontSize: 11, fill: '#667085' }} tickFormatter={v => `${v}%`} domain={['auto', 'auto']} />
                <Tooltip
                  formatter={(v: unknown) => [typeof v === 'number' ? `${v.toFixed(2)}%` : '—', 'Kemiskinan']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5EAF2', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey={selectedProvince || 'P1'}
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey={compareProvince || 'P2'}
                  stroke="#22D3EE"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
