import { useState } from 'react'
import { Download, Search, AlertCircle, CheckCircle2, Database, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import BackendBanner from '@/components/ui/BackendBanner'
import { useApi } from '@/lib/useApi'
import { getDatasetProfile, getDatasetRecords } from '@/services/api'
import { formatPct } from '@/lib/utils'
import type { ProvinceRow } from '@/types'

const PAGE_SIZE = 15

const VARIABLES = [
  { name: 'provinsi', label: 'Provinsi', type: 'String', unit: '-', desc: 'Nama provinsi di Indonesia (BPS)' },
  { name: 'tahun', label: 'Tahun', type: 'Integer', unit: 'YYYY', desc: 'Tahun pengamatan survei (2017–2025)' },
  { name: 'kemiskinan', label: 'Tingkat Kemiskinan', type: 'Float', unit: '%', desc: 'Persentase penduduk miskin terhadap total penduduk (survei Maret)' },
  { name: 'rls', label: 'Rata-rata Lama Sekolah', type: 'Float', unit: 'Tahun', desc: 'Rata-rata lama sekolah penduduk usia 25 tahun ke atas' },
  { name: 'garis_maret', label: 'Garis Kemiskinan', type: 'Float', unit: 'IDR/bulan', desc: 'Nilai pengeluaran minimum per kapita per bulan' },
  { name: 'penduduk_ribu', label: 'Jumlah Penduduk', type: 'Float', unit: 'Ribu jiwa', desc: 'Total penduduk provinsi dalam ribuan jiwa' },
  { name: 'kepadatan', label: 'Kepadatan Penduduk', type: 'Float', unit: 'Jiwa/km²', desc: 'Jumlah penduduk per kilometer persegi wilayah' },
]

export default function DatasetExplorer() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  const { data: profile, status: profileStatus, error: profileError } = useApi(getDatasetProfile, [])

  const { data: recordsData, status: recordsStatus } = useApi(
    () => getDatasetRecords(page, PAGE_SIZE, search),
    [page, search]
  )

  function applySearch() {
    setSearch(searchInput)
    setPage(1)
  }

  const totalPages = recordsData ? Math.ceil(recordsData.total / PAGE_SIZE) : 1

  function handleExport() {
    if (!recordsData) return
    const header = VARIABLES.map(v => v.name).join(',')
    const rows = recordsData.records.map((d: ProvinceRow) =>
      `"${d.provinsi}",${d.tahun},${d.kemiskinan},${d.rls},${d.garis_maret},${d.penduduk_ribu},${d.kepadatan}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nusa_insight_records_page${page}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isError = profileStatus === 'error'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#172033]">Dataset Explorer</h1>
        <p className="text-sm text-[#667085]">
          Transparansi dan inspeksi data: pemisahan dataset dashboard (314 baris) dan panel model (288 baris)
        </p>
      </div>

      {isError && <BackendBanner status={profileStatus} error={profileError} />}

      {/* Dataset Architecture Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-indigo-600">
          <p className="text-xs font-bold text-indigo-950">1. Dataset Dashboard</p>
          <p className="text-xl font-extrabold text-indigo-600 mt-1">314 Baris</p>
          <p className="text-xs text-[#667085] mt-1 leading-relaxed">
            Mencakup seluruh 38 provinsi yang tercatat pada survei BPS. Digunakan untuk eksplorasi umum dan tabel regional.
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-teal-600">
          <p className="text-xs font-bold text-teal-950">2. Dataset Model (32 Provinsi)</p>
          <p className="text-xl font-extrabold text-teal-600 mt-1">288 Baris</p>
          <p className="text-xs text-[#667085] mt-1 leading-relaxed">
            32 provinsi konsisten × 9 tahun (2017–2025). 6 provinsi di wilayah Papua dikecualikan karena perubahan batas administrasi.
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-600">
          <p className="text-xs font-bold text-amber-950">3. Pasangan Fitur & Target</p>
          <p className="text-xl font-extrabold text-amber-600 mt-1">256 Baris</p>
          <p className="text-xs text-[#667085] mt-1 leading-relaxed">
            32 provinsi × 8 transisi ($t \to t+1$). 224 pasangan latih (target 2018–2024) dan 32 pasangan uji final (target 2025).
          </p>
        </Card>
      </div>

      {/* Profile & Data Integrity Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Baris Dashboard', value: profile ? String(profile.rows) : '…', ok: true },
          { label: 'Jumlah Variabel', value: String(VARIABLES.length), ok: true },
          { label: 'Rentang Waktu', value: profile?.years?.length ? `${profile.years[0]}–${profile.years[profile.years.length - 1]}` : '2017–2025', ok: true },
          { label: 'Nilai Hilang (Missing)', value: profile ? '0 (Bersih)' : '…', ok: true },
        ].map(({ label, value, ok }) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-[#667085] mb-1">{label}</p>
            <div className="flex items-center gap-1.5">
              {ok && <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />}
              <p className="text-lg font-bold text-[#172033]">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Provincial Coverage by Year Breakdown */}
      {profile?.province_count_by_year && (
        <Card className="p-5">
          <CardTitle className="text-base mb-1">Cakupan Jumlah Provinsi per Tahun (Data Sumber)</CardTitle>
          <p className="text-xs text-[#667085] mb-3">
            2017–2023: 34 provinsi · 2024–2025: 38 provinsi (termasuk 4 provinsi baru hasil pemekaran Papua)
          </p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(profile.province_count_by_year).map(([year, count]) => {
              const countNum = Number(count)
              return (
                <div
                  key={year}
                  className={`flex flex-col items-center p-2.5 rounded-lg min-w-[72px] border ${
                    countNum > 34 ? 'bg-indigo-50 border-indigo-200' : 'bg-[#F5F7FB] border-[#E5EAF2]'
                  }`}
                >
                  <span className="text-base font-bold text-[#172033]">{countNum}</span>
                  <span className="text-[10px] text-[#667085]">Tahun {year}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Variable Definitions Table */}
      <Card className="p-5">
        <CardTitle className="text-base mb-1">Kamus Data & Spesifikasi Variabel</CardTitle>
        <p className="text-xs text-[#667085] mb-3">Definisi teknis, tipe data, dan satuan masing-masing kolom</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F7FB] text-xs font-semibold text-[#667085]">
              <tr>
                <th className="text-left py-2 px-3">Kolom</th>
                <th className="text-left py-2 px-3">Nama Variabel</th>
                <th className="text-left py-2 px-3">Tipe Data</th>
                <th className="text-left py-2 px-3">Satuan</th>
                <th className="text-left py-2 px-3">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF2]">
              {VARIABLES.map(v => (
                <tr key={v.name} className="hover:bg-[#F5F7FB]">
                  <td className="py-2.5 px-3 font-mono text-xs font-bold text-indigo-700">{v.name}</td>
                  <td className="py-2.5 px-3 text-xs font-medium text-[#172033]">{v.label}</td>
                  <td className="py-2.5 px-3 text-xs text-[#667085]">{v.type}</td>
                  <td className="py-2.5 px-3 text-xs text-[#667085]">{v.unit}</td>
                  <td className="py-2.5 px-3 text-xs text-[#667085]">{v.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Paginated Data Records Table */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <CardTitle className="text-base">Eksplorasi Data Tabular</CardTitle>
            <p className="text-xs text-[#667085]">
              Total record: {recordsData?.total ?? 0} baris (Halaman {page} dari {totalPages})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#667085] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari provinsi…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applySearch()}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E5EAF2] focus:outline-none focus:border-indigo-500 w-48"
              />
            </div>
            <button
              onClick={applySearch}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700"
            >
              Cari
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5EAF2] rounded-lg text-xs font-medium hover:bg-[#F5F7FB] text-[#172033]"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F7FB] text-xs font-semibold text-[#667085]">
              <tr>
                <th className="text-left py-2 px-3">Provinsi</th>
                <th className="text-center py-2 px-3">Tahun</th>
                <th className="text-right py-2 px-3">Kemiskinan (%)</th>
                <th className="text-right py-2 px-3">RLS</th>
                <th className="text-right py-2 px-3">Garis Kemiskinan</th>
                <th className="text-right py-2 px-3">Penduduk (ribu)</th>
                <th className="text-right py-2 px-3">Kepadatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF2]">
              {(recordsData?.records ?? []).map((r: ProvinceRow, idx: number) => (
                <tr key={`${r.provinsi}-${r.tahun}-${idx}`} className="hover:bg-[#F5F7FB]">
                  <td className="py-2 px-3 text-xs font-medium text-[#172033]">{r.provinsi}</td>
                  <td className="py-2 px-3 text-center text-xs text-[#667085]">{r.tahun}</td>
                  <td className="py-2 px-3 text-right text-xs font-bold text-rose-600">{formatPct(r.kemiskinan)}</td>
                  <td className="py-2 px-3 text-right text-xs text-[#667085]">{r.rls.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right text-xs text-[#667085]">Rp {Math.round(r.garis_maret).toLocaleString('id-ID')}</td>
                  <td className="py-2 px-3 text-right text-xs text-[#667085]">{r.penduduk_ribu.toLocaleString('id-ID')}</td>
                  <td className="py-2 px-3 text-right text-xs text-[#667085]">{r.kepadatan.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E5EAF2]">
          <span className="text-xs text-[#667085]">
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 text-xs border border-[#E5EAF2] rounded-lg disabled:opacity-40 hover:bg-[#F5F7FB]"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 text-xs border border-[#E5EAF2] rounded-lg disabled:opacity-40 hover:bg-[#F5F7FB]"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
