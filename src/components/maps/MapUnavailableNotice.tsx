/**
 * Ditampilkan ketika choropleth tidak tersedia untuk tahun yang dipilih
 * (2024–2025 karena GeoJSON hanya memiliki 34 fitur, data memiliki 38 provinsi).
 */
import { AlertTriangle, MapPinOff } from 'lucide-react'
import { formatPct } from '@/lib/utils'
import type { ProvinceRow } from '@/types'

interface Props {
  year: number
  records: ProvinceRow[]
}

export default function MapUnavailableNotice({ year, records }: Props) {
  const sorted = [...records].sort((a, b) => b.kemiskinan - a.kemiskinan)

  return (
    <div className="space-y-3">
      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
        <MapPinOff className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-800 mb-1">
            Peta koropleth tidak tersedia untuk tahun {year}
          </p>
          <p className="text-amber-700 text-xs leading-relaxed">
            Data tahun {year} mencakup <strong>38 provinsi</strong> (termasuk 4 provinsi pemekaran Papua:
            Papua Selatan, Papua Tengah, Papua Pegunungan, Papua Barat Daya).
            GeoJSON yang tersedia hanya memiliki <strong>34 batas wilayah</strong> dan tidak mencakup
            provinsi-provinsi baru tersebut. Menampilkan choropleth dengan geometri lama akan
            menyesatkan — data 4 provinsi baru tidak akan terwakili.
          </p>
          <p className="text-amber-600 text-xs mt-1.5">
            Seluruh {records.length} provinsi yang memiliki data ditampilkan dalam tabel di bawah.
            Peta dapat diaktifkan kembali setelah GeoJSON 38 provinsi dengan batas wilayah valid tersedia.
          </p>
        </div>
      </div>

      {/* Fallback table — all provinces with data */}
      <div className="overflow-x-auto rounded-xl border border-[#E5EAF2]">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F7FB]">
            <tr>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-[#667085]">#</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-[#667085]">Provinsi</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold text-[#667085]">Kemiskinan</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold text-[#667085]">RLS (thn)</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold text-[#667085]">Garis Kemiskinan</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold text-[#667085]">Penduduk (ribu)</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const isPapuaNew = ['Papua Selatan', 'Papua Tengah', 'Papua Pegunungan', 'Papua Barat Daya'].includes(r.provinsi)
              return (
                <tr
                  key={r.provinsi}
                  className={`border-t border-[#F5F7FB] ${isPapuaNew ? 'bg-amber-50/40' : 'hover:bg-[#F5F7FB]'}`}
                >
                  <td className="py-2.5 px-3 text-[#667085] text-xs">{i + 1}</td>
                  <td className="py-2.5 px-3 font-medium text-[#172033] text-xs">
                    {r.provinsi}
                    {isPapuaNew && (
                      <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                        baru
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      r.kemiskinan > 20 ? 'bg-red-900/10 text-red-800'
                      : r.kemiskinan > 15 ? 'bg-rose-50 text-rose-600'
                      : r.kemiskinan > 8  ? 'bg-amber-50 text-amber-600'
                      : 'bg-teal-50 text-teal-600'
                    }`}>
                      {formatPct(r.kemiskinan)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#667085] text-xs">{r.rls.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right text-[#667085] text-xs">
                    Rp {(r.garis_maret / 1000).toFixed(0)}K
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#667085] text-xs">
                    {r.penduduk_ribu.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#667085] flex items-center gap-1">
        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
        Baris berlatar kuning = provinsi hasil pemekaran 2022 yang tidak memiliki batas wilayah
        dalam GeoJSON saat ini.
      </p>
    </div>
  )
}
