/**
 * Stylized abstract map of Indonesia using SVG nodes and data lines.
 * This is a visual representation, NOT geographic boundary data.
 * It does not imply official geographic accuracy.
 */

import { useEffect, useRef } from 'react'

interface MapNode {
  id: string
  label: string
  x: number
  y: number
  size: number
  value?: number
}

const NODES: MapNode[] = [
  { id: 'aceh', label: 'Aceh', x: 60, y: 90, size: 6 },
  { id: 'sumut', label: 'Sumatera Utara', x: 100, y: 110, size: 7 },
  { id: 'riau', label: 'Riau', x: 145, y: 130, size: 6 },
  { id: 'sumbar', label: 'Sumatera Barat', x: 110, y: 150, size: 5 },
  { id: 'jambi', label: 'Jambi', x: 145, y: 165, size: 5 },
  { id: 'sumsel', label: 'Sumatera Selatan', x: 150, y: 190, size: 6 },
  { id: 'bengkulu', label: 'Bengkulu', x: 120, y: 185, size: 5 },
  { id: 'lampung', label: 'Lampung', x: 155, y: 215, size: 5 },
  { id: 'babel', label: 'Bangka Belitung', x: 180, y: 185, size: 4 },
  { id: 'banten', label: 'Banten', x: 175, y: 230, size: 4 },
  { id: 'jabar', label: 'Jawa Barat', x: 200, y: 230, size: 8 },
  { id: 'jateng', label: 'Jawa Tengah', x: 235, y: 230, size: 8 },
  { id: 'dki', label: 'DKI Jakarta', x: 185, y: 220, size: 5 },
  { id: 'diy', label: 'DI Yogyakarta', x: 228, y: 238, size: 4 },
  { id: 'jatim', label: 'Jawa Timur', x: 265, y: 225, size: 8 },
  { id: 'bali', label: 'Bali', x: 290, y: 225, size: 5 },
  { id: 'ntb', label: 'NTB', x: 310, y: 225, size: 5 },
  { id: 'ntt', label: 'NTT', x: 335, y: 235, size: 6 },
  { id: 'kalbar', label: 'Kalimantan Barat', x: 210, y: 170, size: 6 },
  { id: 'kalteng', label: 'Kalimantan Tengah', x: 245, y: 165, size: 6 },
  { id: 'kalsel', label: 'Kalimantan Selatan', x: 268, y: 180, size: 5 },
  { id: 'kaltim', label: 'Kalimantan Timur', x: 280, y: 155, size: 6 },
  { id: 'kalut', label: 'Kalimantan Utara', x: 278, y: 130, size: 4 },
  { id: 'sulut', label: 'Sulawesi Utara', x: 328, y: 140, size: 5 },
  { id: 'gorontalo', label: 'Gorontalo', x: 320, y: 155, size: 4 },
  { id: 'sulteng', label: 'Sulawesi Tengah', x: 330, y: 170, size: 5 },
  { id: 'sulbar', label: 'Sulawesi Barat', x: 305, y: 175, size: 4 },
  { id: 'sulsel', label: 'Sulawesi Selatan', x: 310, y: 195, size: 6 },
  { id: 'sultra', label: 'Sulawesi Tenggara', x: 330, y: 195, size: 5 },
  { id: 'maluku', label: 'Maluku', x: 370, y: 190, size: 5 },
  { id: 'malut', label: 'Maluku Utara', x: 370, y: 160, size: 4 },
  { id: 'papua', label: 'Papua', x: 440, y: 195, size: 9 },
  { id: 'papuabar', label: 'Papua Barat', x: 400, y: 175, size: 6 },
]

const CONNECTIONS = [
  ['aceh', 'sumut'], ['sumut', 'riau'], ['sumut', 'sumbar'],
  ['riau', 'jambi'], ['sumbar', 'jambi'], ['jambi', 'sumsel'],
  ['sumsel', 'bengkulu'], ['sumsel', 'lampung'], ['sumsel', 'babel'],
  ['lampung', 'banten'], ['banten', 'dki'], ['dki', 'jabar'],
  ['jabar', 'jateng'], ['jateng', 'diy'], ['jateng', 'jatim'],
  ['jatim', 'bali'], ['bali', 'ntb'], ['ntb', 'ntt'],
  ['riau', 'kalbar'], ['kalbar', 'kalteng'], ['kalteng', 'kalsel'],
  ['kalteng', 'kaltim'], ['kaltim', 'kalut'], ['kaltim', 'sulut'],
  ['sulut', 'gorontalo'], ['gorontalo', 'sulteng'], ['sulteng', 'sulbar'],
  ['sulbar', 'sulsel'], ['sulsel', 'sultra'], ['sultra', 'maluku'],
  ['maluku', 'malut'], ['malut', 'papua'], ['maluku', 'papua'],
  ['papuabar', 'papua'], ['malut', 'papuabar'],
]

interface IndonesiaMapProps {
  height?: number
  className?: string
  animate?: boolean
}

export default function IndonesiaMap({ height = 280, className = '' }: IndonesiaMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctxMaybe = canvas.getContext('2d')
    if (!ctxMaybe) return
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ctx = ctxMaybe!

    const dpr = window.devicePixelRatio || 1
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    const scaleX = w / 500
    const scaleY = h / 300

    function getPos(node: MapNode) {
      return { x: node.x * scaleX, y: node.y * scaleY }
    }

    function draw(t: number) {
      ctx.clearRect(0, 0, w, h)

      // Draw connections
      CONNECTIONS.forEach(([a, b]) => {
        const na = NODES.find(n => n.id === a)!
        const nb = NODES.find(n => n.id === b)!
        const pa = getPos(na)
        const pb = getPos(nb)
        ctx.beginPath()
        ctx.moveTo(pa.x, pa.y)
        ctx.lineTo(pb.x, pb.y)
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.12)'
        ctx.lineWidth = 0.8
        ctx.stroke()
      })

      // Animated flow dot on a random connection
      const connIdx = Math.floor(t / 60) % CONNECTIONS.length
      const [a, b] = CONNECTIONS[connIdx]
      const na = NODES.find(n => n.id === a)!
      const nb = NODES.find(n => n.id === b)!
      const pa = getPos(na)
      const pb = getPos(nb)
      const progress = ((t % 60) / 60)
      const fx = pa.x + (pb.x - pa.x) * progress
      const fy = pa.y + (pb.y - pa.y) * progress
      ctx.beginPath()
      ctx.arc(fx, fy, 1.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(34,211,238,0.7)'
      ctx.fill()

      // Draw nodes
      NODES.forEach(node => {
        const { x, y } = getPos(node)
        const pulse = 1 + 0.15 * Math.sin(t * 0.04 + node.x * 0.1)

        // Outer glow
        const grad = ctx.createRadialGradient(x, y, 0, x, y, node.size * 2.5 * pulse)
        grad.addColorStop(0, 'rgba(34,211,238,0.18)')
        grad.addColorStop(1, 'rgba(34,211,238,0)')
        ctx.beginPath()
        ctx.arc(x, y, node.size * 2.5 * pulse, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

        // Core dot
        ctx.beginPath()
        ctx.arc(x, y, node.size * 0.55, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(99, 102, 241, 0.75)'
        ctx.fill()

        // Cyan ring
        ctx.beginPath()
        ctx.arc(x, y, node.size * 0.55, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(34,211,238,0.7)'
        ctx.lineWidth = 0.8
        ctx.stroke()
      })

      timeRef.current = t
      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full ${className}`}
      style={{ height }}
      aria-label="Stylized abstract visualization of the Indonesian archipelago — for aesthetic purposes only, not a geographic boundary map"
      role="img"
    />
  )
}
