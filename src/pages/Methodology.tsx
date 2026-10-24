import { BookOpen, Database, GitBranch, BarChart2, Brain, AlertCircle, ExternalLink, ShieldCheck, Clock, Layers } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

const PIPELINE_STEPS = [
  {
    step: 1,
    title: 'Pengumpulan Data BPS (2017–2025)',
    icon: Database,
    desc: 'Pengumpulan data resmi publikasi Badan Pusat Statistik Indonesia mencakup persentase penduduk miskin (survei Maret), rata-rata lama sekolah (RLS), garis kemiskinan Maret, jumlah penduduk, dan kepadatan penduduk.',
  },
  {
    step: 2,
    title: 'Pembersihan & Penyelarasan Nama',
    icon: GitBranch,
    desc: 'Harmonisasi penamaan 38 provinsi di Indonesia, identifikasi ketiadaan nilai hilang (0 missing values), dan pemisahan dataset dashboard umum dengan panel model.',
  },
  {
    step: 3,
    title: 'Pembatasan Panel 32 Provinsi',
    icon: ShieldCheck,
    desc: 'Eksklusi 6 provinsi di wilayah Papua (Papua, Papua Barat, Papua Selatan, Papua Tengah, Papua Pegunungan, Papua Barat Daya) dari eksperimen pemodelan karena pemekaran administratif 2022 yang menyebabkan ketidakkonsistenan historis.',
  },
  {
    step: 4,
    title: 'Formulasi Lag Fitur ($t$) & Target ($t+1$)',
    icon: Clock,
    desc: 'Target pemodelan adalah persentase kemiskinan pada tahun t+1, dengan memanfaatkan 4 indikator prediktor pada tahun t: RLS, Garis Kemiskinan Maret, Jumlah Penduduk Ribuan, dan Kepadatan Penduduk.',
  },
  {
    step: 5,
    title: 'Validasi Temporal Expanding-Window',
    icon: Layers,
    desc: 'Pencegahan kebocoran data masa depan (no future data leakage). Validasi berurutan: Target 2022 (128 pasangan), Target 2023 (160 pasangan), Target 2024 (192 pasangan), Pelatihan Final (target 2018–2024 = 224 pasangan).',
  },
  {
    step: 6,
    title: 'Pengujian Final Out-of-Time (Target 2025)',
    icon: Brain,
    desc: 'Pengujian ketat pada tahun target 2025 sebanyak 32 sampel provinsi yang belum pernah dilihat model selama proses penyesuaian parameter.',
  },
  {
    step: 7,
    title: 'Evaluasi Komparatif & Persistence Baseline',
    icon: BarChart2,
    desc: 'Evaluasi kuantitatif menggunakan MAE, RMSE, dan R². Membandingkan hasil Linear Regression, Random Forest Baseline, dan Random Forest Tuned terhadap Persistence Baseline ($y_{t+1} \\approx y_t$).',
  },
]

const SOURCES = [
  { name: 'Badan Pusat Statistik (BPS)', url: 'https://www.bps.go.id', desc: 'Sumber data primer kemiskinan, pendidikan, dan demografi' },
  { name: 'BPS — Kemiskinan dan Ketimpangan', url: 'https://www.bps.go.id/subject/23/kemiskinan-dan-ketimpangan.html', desc: 'Publikasi resmi data survei Susenas per semester' },
  { name: 'geoBoundaries (gbOpen)', url: 'https://www.geoboundaries.org', desc: 'Batas administratif provinsi Indonesia ADM1 (CC BY 4.0)' },
]

export default function Methodology() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#172033]">Tentang & Metodologi Penelitian</h1>
          <p className="text-sm text-[#667085]">Dokumentasi ilmiah alur eksperimen machine learning NUSA Insight</p>
        </div>
      </div>

      {/* Research Statement Card */}
      <Card className="p-5 border-l-4 border-l-indigo-600">
        <CardTitle className="text-base mb-1">Pernyataan Integritas Ilmiah</CardTitle>
        <p className="text-xs text-[#667085] leading-relaxed">
          NUSA Insight menyajikan temuan penelitian secara objektif dan apa adanya. Aplikasi ini tidak memanipulasi angka agar model Machine Learning terlihat lebih unggul dari kenyataannya. Pada pengujian target 2025, <strong>Persistence Baseline terbukti lebih akurat dibanding Random Forest dan Linear Regression</strong>. Temuan ini penting secara akademik karena mendemonstrasikan kuatnya persistensi struktural angka kemiskinan regional di Indonesia, di mana variasi tahunan lebih banyak dipengaruhi inersia daripada perubahan marjinal 4 fitur prediktor.
        </p>
      </Card>

      {/* Pipeline 7 Tahapan */}
      <Card className="p-5">
        <CardTitle className="text-base mb-1">Alur Penelitian & Skema Validasi</CardTitle>
        <p className="text-xs text-[#667085] mb-5">
          Tujuh tahapan metodologi terstruktur dari pengumpulan data hingga evaluasi komparatif
        </p>
        <div className="space-y-4">
          {PIPELINE_STEPS.map(item => {
            const Icon = item.icon
            return (
              <div key={item.step} className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#F5F7FB] border border-[#E5EAF2]">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#172033]">
                    Tahap {item.step}: {item.title}
                  </h3>
                  <p className="text-xs text-[#667085] mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Dataset & Validation Detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dataset Breakdown */}
        <Card className="p-5">
          <CardTitle className="text-base mb-1">Cakupan & Pengecualian Wilayah</CardTitle>
          <p className="text-xs text-[#667085] mb-3">Batasan panel 32 provinsi penelitian</p>
          <ul className="text-xs text-[#667085] space-y-2 leading-relaxed">
            <li>
              • <strong>Panel Model:</strong> 32 provinsi konsisten × 9 tahun (2017–2025) = 288 baris data.
            </li>
            <li>
              • <strong>Eksklusi Papua:</strong> Enam provinsi di Pulau Papua (Papua, Papua Barat, Papua Selatan, Papua Tengah, Papua Pegunungan, Papua Barat Daya) dikecualikan dari panel model karena pemekaran pada 2022 merusak keterbandingan data historis sebelum 2024.
            </li>
            <li>
              • <strong>Bukan Angka Nasional Resmi:</strong> Rata-rata sederhana dari 32 provinsi bukanlah angka kemiskinan nasional resmi BPS yang memperhitungkan bobot populasi seluruh Indonesia.
            </li>
          </ul>
        </Card>

        {/* Validation Split */}
        <Card className="p-5">
          <CardTitle className="text-base mb-1">Skema Expanding-Window</CardTitle>
          <p className="text-xs text-[#667085] mb-3">Distribusi pasangan data latih dan uji</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded bg-[#F5F7FB] border border-[#E5EAF2]">
              <span className="font-medium text-[#172033]">Validasi Target 2022</span>
              <span className="font-mono text-[#667085]">128 pasangan latih</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-[#F5F7FB] border border-[#E5EAF2]">
              <span className="font-medium text-[#172033]">Validasi Target 2023</span>
              <span className="font-mono text-[#667085]">160 pasangan latih</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-[#F5F7FB] border border-[#E5EAF2]">
              <span className="font-medium text-[#172033]">Validasi Target 2024</span>
              <span className="font-mono text-[#667085]">192 pasangan latih</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-indigo-50 border border-indigo-200">
              <span className="font-bold text-indigo-950">Pelatihan Final (Target 2018–2024)</span>
              <span className="font-mono font-bold text-indigo-700">224 pasangan</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-amber-50 border border-amber-200">
              <span className="font-bold text-amber-950">Pengujian Final (Target 2025)</span>
              <span className="font-mono font-bold text-amber-700">32 pasangan (fitur 2024)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Model Findings & Limitations */}
      <Card className="p-5">
        <CardTitle className="text-base mb-1">Keterbatasan Penelitian & Pengembangan Lanjutan</CardTitle>
        <p className="text-xs text-[#667085] mb-3">Aspek yang perlu diperhatikan pengguna dan pembuat kebijakan</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#667085] leading-relaxed">
          <div className="p-3.5 rounded-xl bg-[#F5F7FB] border border-[#E5EAF2] space-y-1.5">
            <p className="font-bold text-[#172033]">1. Keterbatasan Cakupan Waktu & Sampel Uji</p>
            <p>
              Pengujian final saat ini hanya mencakup satu tahun target (2025) dengan 32 sampel provinsi. Kinerja model pada masa depan memerlukan evaluasi berkelanjutan (rolling-origin) seiring dirilisnya data BPS tahun-tahun berikutnya.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F5F7FB] border border-[#E5EAF2] space-y-1.5">
            <p className="font-bold text-[#172033]">2. Keterbatasan Variabel Prediktor</p>
            <p>
              Model hanya menggunakan 4 fitur umum (RLS, garis kemiskinan, jumlah penduduk, dan kepadatan). Fenomena kemiskinan di daerah kepulauan atau terpencil (seperti NTT) sangat dipengaruhi variabel makro lain seperti inflasi pangan, akses infrastruktur, dan bencana alam.
            </p>
          </div>
        </div>
      </Card>

      {/* External Sources Attribution */}
      <Card className="p-5">
        <CardTitle className="text-base mb-1">Sumber Data & Atribusi Resmi</CardTitle>
        <p className="text-xs text-[#667085] mb-3">Tautan rujukan sumber dataset dan data geospasial</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SOURCES.map(s => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-lg border border-[#E5EAF2] hover:bg-[#F5F7FB] transition-colors block text-xs"
            >
              <div className="flex items-center justify-between font-semibold text-[#172033]">
                <span>{s.name}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#667085]" />
              </div>
              <p className="text-[11px] text-[#667085] mt-1">{s.desc}</p>
            </a>
          ))}
        </div>
      </Card>
    </div>
  )
}
