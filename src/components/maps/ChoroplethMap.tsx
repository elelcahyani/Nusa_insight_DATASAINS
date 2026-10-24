/**
 * ChoroplethMap — Peta koropleth kemiskinan per provinsi Indonesia.
 *
 * Aktif untuk seluruh tahun (2017–2025).
 * Untuk tahun 2024–2025 (pasca pemekaran Papua), wilayah Papua divisualisasikan
 * dengan batas wilayah Papua & Papua Barat dan tooltip interaktif menampilkan
 * rincian provinsi pemekaran baru (Papua Pegunungan, Papua Tengah, Papua Selatan, Papua Barat Daya).
 *
 * Basemap: OpenStreetMap (gratis, tanpa API key)
 * Atribusi: geoBoundaries.org · gbOpen · Indonesia ADM1 · CC BY 4.0
 */
import { useEffect, useRef } from 'react'
import type { ProvinceRow } from '@/types'

/**
 * Mapping eksplisit: nama GeoJSON (uppercase) → nama dataset.
 * Diperlukan untuk semua 34 provinsi yang namanya berbeda dari title-case sederhana.
 */
const GEO_TO_DATASET: Record<string, string> = {
  'DI. ACEH':                   'Aceh',
  'DAERAH ISTIMEWA YOGYAKARTA': 'DI Yogyakarta',
  'BANGKA BELITUNG':            'Kepulauan Bangka Belitung',
  'NUSATENGGARA BARAT':         'Nusa Tenggara Barat',
  'NUSA TENGGARA TIMUR':        'Nusa Tenggara Timur',
  'DKI JAKARTA':                'DKI Jakarta',
  'KEPULAUAN RIAU':             'Kepulauan Riau',
  'SULAWESI BARAT':             'Sulawesi Barat',
  'SULAWESI TENGAH':            'Sulawesi Tengah',
  'SULAWESI TENGGARA':          'Sulawesi Tenggara',
  'SULAWESI SELATAN':           'Sulawesi Selatan',
  'SULAWESI UTARA':             'Sulawesi Utara',
  'KALIMANTAN BARAT':           'Kalimantan Barat',
  'KALIMANTAN TENGAH':          'Kalimantan Tengah',
  'KALIMANTAN SELATAN':         'Kalimantan Selatan',
  'KALIMANTAN TIMUR':           'Kalimantan Timur',
  'KALIMANTAN UTARA':           'Kalimantan Utara',
  'SUMATERA UTARA':             'Sumatera Utara',
  'SUMATERA BARAT':             'Sumatera Barat',
  'SUMATERA SELATAN':           'Sumatera Selatan',
  'MALUKU UTARA':               'Maluku Utara',
  'PAPUA BARAT':                'Papua Barat',
  'JAWA BARAT':                 'Jawa Barat',
  'JAWA TENGAH':                'Jawa Tengah',
  'JAWA TIMUR':                 'Jawa Timur',
  'JAWA':                       'Jawa',
}

/** Konversi nama GeoJSON (ALL CAPS) → nama dataset */
function resolveGeoName(geoName: string): string {
  const upper = geoName.trim().toUpperCase()
  if (GEO_TO_DATASET[upper]) return GEO_TO_DATASET[upper]
  // Fallback: title-case (works for: Bali, Riau, Maluku, Banten, Gorontalo, Jambi, Lampung, Bengkulu, Papua, dll.)
  return geoName
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// Color scale: teal (rendah) → dark red (tinggi)
function getColor(rate: number | undefined): string {
  if (rate === undefined) return '#cbd5e1'
  if (rate > 20) return '#7f1d1d'
  if (rate > 16) return '#b91c1c'
  if (rate > 12) return '#ef4444'
  if (rate > 9)  return '#f97316'
  if (rate > 6)  return '#fbbf24'
  if (rate > 4)  return '#86efac'
  return '#14b8a6'
}

interface Props {
  records: ProvinceRow[]
  year: number
  height?: number
}

export default function ChoroplethMap({ records, year, height = 400 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)

  // Build lookup: dataset province name → poverty rate
  const dataMap = Object.fromEntries(records.map(r => [r.provinsi, r.kemiskinan]))

  // Find Papua expansion provinces if present
  const papuaPegunungan = records.find(r => r.provinsi === 'Papua Pegunungan')
  const papuaTengah     = records.find(r => r.provinsi === 'Papua Tengah')
  const papuaSelatan    = records.find(r => r.provinsi === 'Papua Selatan')
  const papuaBaratDaya  = records.find(r => r.provinsi === 'Papua Barat Daya')

  useEffect(() => {
    if (!containerRef.current) return

    let isCancelled = false
    let map: ReturnType<typeof import('leaflet')['map']>

    async function init() {
      const L = await import('leaflet')
      if (isCancelled) return

      // Fix default marker icons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      map = L.map(containerRef.current!, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false,
      }).setView([-2.2, 118], 4)

      mapRef.current = map

      // ✅ OpenStreetMap — gratis, tanpa API key, tidak ada watermark
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        opacity: 0.25,  // transparan agar warna choropleth lebih dominan
      }).addTo(map)

      // Fetch GeoJSON batas provinsi
      const res = await fetch('/provinces.geojson')
      const geojson = await res.json()
      if (isCancelled) return

      const tooltip = L.tooltip({ sticky: true, opacity: 0.98 })

      L.geoJSON(geojson, {
        style: (feature) => {
          const geoName = feature?.properties?.Propinsi ?? ''
          const dsName  = resolveGeoName(geoName)
          const rate    = dataMap[dsName]
          return {
            fillColor:   getColor(rate),
            weight:      0.8,
            opacity:     1,
            color:       '#ffffff',
            fillOpacity: 0.85,
          }
        },
        onEachFeature: (feature, layer) => {
          const geoName = feature.properties?.Propinsi ?? ''
          const dsName  = resolveGeoName(geoName)
          const rate    = dataMap[dsName]

          let tooltipHtml = ''
          if (dsName === 'Papua' && (papuaPegunungan || papuaTengah || papuaSelatan)) {
            tooltipHtml = `
              <div style="font-family:sans-serif;font-size:12px;min-width:190px;">
                <div style="font-weight:700;font-size:13px;color:#0f172a;">Provinsi Papua</div>
                <div style="color:#475569;margin-top:2px;">
                  Kemiskinan: <strong style="color:${rate !== undefined ? '#e11d48' : '#64748b'};">
                    ${rate !== undefined ? rate.toFixed(2) + '%' : 'Tidak Ada Data'}
                  </strong>
                </div>
                <div style="margin-top:6px;padding-top:5px;border-top:1px dashed #cbd5e1;font-size:11px;color:#334155;">
                  <div style="font-weight:600;margin-bottom:3px;color:#1e293b;">Pemekaran Wilayah (${year}):</div>
                  ${papuaPegunungan ? `• Papua Pegunungan: <strong>${papuaPegunungan.kemiskinan.toFixed(2)}%</strong><br/>` : ''}
                  ${papuaTengah     ? `• Papua Tengah: <strong>${papuaTengah.kemiskinan.toFixed(2)}%</strong><br/>` : ''}
                  ${papuaSelatan    ? `• Papua Selatan: <strong>${papuaSelatan.kemiskinan.toFixed(2)}%</strong>` : ''}
                </div>
              </div>`
          } else if (dsName === 'Papua Barat' && papuaBaratDaya) {
            tooltipHtml = `
              <div style="font-family:sans-serif;font-size:12px;min-width:190px;">
                <div style="font-weight:700;font-size:13px;color:#0f172a;">Provinsi Papua Barat</div>
                <div style="color:#475569;margin-top:2px;">
                  Kemiskinan: <strong style="color:${rate !== undefined ? '#e11d48' : '#64748b'};">
                    ${rate !== undefined ? rate.toFixed(2) + '%' : 'Tidak Ada Data'}
                  </strong>
                </div>
                <div style="margin-top:6px;padding-top:5px;border-top:1px dashed #cbd5e1;font-size:11px;color:#334155;">
                  <div style="font-weight:600;margin-bottom:3px;color:#1e293b;">Pemekaran Wilayah (${year}):</div>
                  • Papua Barat Daya: <strong>${papuaBaratDaya.kemiskinan.toFixed(2)}%</strong>
                </div>
              </div>`
          } else if (rate !== undefined) {
            tooltipHtml = `
              <div style="font-family:sans-serif;font-size:12px;">
                <strong style="font-size:13px;color:#0f172a;">${dsName}</strong><br/>
                <span style="color:#475569;">Tingkat Kemiskinan:</span>
                <strong style="color:#e11d48;"> ${rate.toFixed(2)}%</strong>
              </div>`
          } else {
            tooltipHtml = `
              <div style="font-family:sans-serif;font-size:12px;">
                <strong style="font-size:13px;color:#0f172a;">${dsName}</strong><br/>
                <span style="color:#64748b;">Tidak ada data untuk tahun ini</span>
              </div>`
          }

          layer.on({
            mouseover: (e) => {
              const l = e.target
              l.setStyle({ weight: 2.2, color: '#4f46e5', fillOpacity: 0.95 })
              l.bringToFront()
              tooltip.setContent(tooltipHtml)
              tooltip.setLatLng(e.latlng)
              tooltip.addTo(map)
            },
            mousemove: (e) => { tooltip.setLatLng(e.latlng) },
            mouseout: (e) => {
              const gn = e.target.feature.properties?.Propinsi ?? ''
              const dn = resolveGeoName(gn)
              const r  = dataMap[dn]
              e.target.setStyle({
                weight:      0.8,
                color:       '#ffffff',
                fillColor:   getColor(r),
                fillOpacity: 0.85,
              })
              tooltip.remove()
            },
          })
        },
      }).addTo(map)
    }

    init().catch(console.error)

    return () => {
      isCancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [year, records])

  return (
    <div className="relative">
      <div ref={containerRef} style={{ height, width: '100%' }} className="rounded-xl overflow-hidden z-0" />
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm border border-[#E5EAF2] rounded-lg px-3 py-2 text-xs shadow-md z-[1000] pointer-events-none">
        <p className="font-semibold text-[#172033] mb-1.5">Kemiskinan (%)</p>
        {[
          { color: '#7f1d1d', label: '> 20%' },
          { color: '#b91c1c', label: '16–20%' },
          { color: '#ef4444', label: '12–16%' },
          { color: '#f97316', label: '9–12%' },
          { color: '#fbbf24', label: '6–9%' },
          { color: '#86efac', label: '4–6%' },
          { color: '#14b8a6', label: '≤ 4%' },
          { color: '#cbd5e1', label: 'Tidak Ada Data' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 mb-0.5">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[#667085]">{label}</span>
          </div>
        ))}
        <p className="text-[#667085] mt-1.5 text-[9px] leading-tight max-w-[130px]">
          © geoBoundaries · gbOpen · IDN ADM1 · CC BY 4.0<br/>
          © OpenStreetMap contributors
        </p>
      </div>
    </div>
  )
}
