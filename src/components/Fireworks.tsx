import { useEffect, useMemo, useState, type CSSProperties } from 'react'

type FireworksProps = {
  token: number
}

type Particle = {
  id: number
  left: number
  top: number
  dx: number
  dy: number
  color: string
}

const COLORS = ['#1a7a9c', '#5bb8d9', '#f4d35e', '#ee6c4d', '#ffffff', '#0e5a75']

export function Fireworks({ token }: FireworksProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  const burst = useMemo(() => token, [token])

  useEffect(() => {
    if (burst === 0) return

    const next: Particle[] = Array.from({ length: 36 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 36
      const distance = 60 + Math.random() * 100
      return {
        id: burst * 100 + index,
        left: 42 + Math.random() * 16,
        top: 28 + Math.random() * 12,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance - 40,
        color: COLORS[index % COLORS.length],
      }
    })
    setParticles(next)
    const timer = window.setTimeout(() => setParticles([]), 950)
    return () => window.clearTimeout(timer)
  }, [burst])

  if (particles.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {particles.map((particle) => {
        const style = {
          left: `${particle.left}%`,
          top: `${particle.top}%`,
          background: particle.color,
          '--dx': `${particle.dx}px`,
          '--dy': `${particle.dy}px`,
        } as CSSProperties

        return (
          <span
            key={particle.id}
            className="firework-particle absolute h-2.5 w-2.5 rounded-full"
            style={style}
          />
        )
      })}
    </div>
  )
}
