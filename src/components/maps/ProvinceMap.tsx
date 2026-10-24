/**
 * ProvinceMap — Komponen visualisasi geografis terpadu seluruh tahun (2017–2025).
 * Menampilkan ChoroplethMap interaktif, dilengkapi catatan dan rincian provinsi
 * pemekaran Papua saat tahun 2024–2025 dipilih.
 */
import ChoroplethMap from './ChoroplethMap'
import { Info, MapPin } from 'lucide-react'
import { formatPct } from '@/lib/utils'
import type { ProvinceRow } from '@/types'

interface Props {
  records: ProvinceRow[]
  year: number
  height?: number
}

export default function ProvinceMap({ records, year, height = 380 }: Props) {
  // Find Papua expansion provinces if data exists
  const isPostExpansion = year >= 2024
  const papuaProvinces = records.filter(r =>
    ['Papua Pegunungan', 'Papua Tengah', 'Papua Selatan', 'Papua Barat Daya'].includes(r.provinsi)
  )

  return (
    <div className="space-y-3">
      {/* Interactive Map */}
      <ChoroplethMap records={records} year={year} height={height} />

      {/* Post-2024 Papua Expansion Information Card */}
      {isPostExpansion && (
        <div className="p-3.5 rounded-xl bg-[#F5F7FB] border border-[#E5EAF2] text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-[#172033] mb-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Catatan Batas Wilayah Papua Tahun {year}:</span>
          </div>
          <p className="text-[#667085] leading-relaxed mb-2.5">
            Poligon peta menampilkan wilayah induk <em>Papua</em> dan <em>Papua Barat</em> (standar batas GeoJSON ADM1).
            Berikut adalah tingkat kemiskinan provinsi baru hasil pemekaran 2022 pada tahun {year}:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {papuaProvinces.map(p => (
              <div key={p.provinsi} className="p-2 rounded-lg bg-white border border-[#E5EAF2]">
                <div className="flex items-center gap-1 text-[11px] font-medium text-[#172033] truncate">
                  <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span className="truncate">{p.provinsi}</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-[10px] text-[#667085]">Kemiskinan:</span>
                  <span className="font-bold text-rose-600 text-xs">{formatPct(p.kemiskinan)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
