import confetti from 'canvas-confetti'
import { useEffect } from 'react'

type FireworksProps = {
  token: number
}

const COLORS = ['#1a7a9c', '#5bb8d9', '#f4d35e', '#ee6c4d', '#ffffff', '#0e5a75']

export function Fireworks({ token }: FireworksProps) {
  useEffect(() => {
    if (token === 0) return

    const defaults = {
      colors: COLORS,
      disableForReducedMotion: true,
    }

    void confetti({
      ...defaults,
      particleCount: 80,
      spread: 70,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.55 },
    })

    const left = window.setTimeout(() => {
      void confetti({
        ...defaults,
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0.15, y: 0.7 },
      })
    }, 150)

    const right = window.setTimeout(() => {
      void confetti({
        ...defaults,
        particleCount: 40,
        angle: 120,
        spread: 55,
        origin: { x: 0.85, y: 0.7 },
      })
    }, 250)

    return () => {
      window.clearTimeout(left)
      window.clearTimeout(right)
      confetti.reset()
    }
  }, [token])

  return null
}
