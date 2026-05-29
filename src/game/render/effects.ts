import type { Effect } from "../types"
import { PALETTE } from "../config"

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rnd01(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function drawEffect(ctx: CanvasRenderingContext2D, fx: Effect) {
  const p = fx.t / fx.duration
  const a = 1 - p
  if (fx.type === "spark") {
    ctx.save()
    ctx.globalAlpha = a
    ctx.fillStyle = PALETTE.sparkY
    const h = hash(fx.id)
    for (let i = 0; i < 8; i++) {
      const r = 2 + rnd01(h + i * 13) * 10
      const ang = rnd01(h + i * 97) * Math.PI * 2
      const x = Math.round(fx.pos.x + Math.cos(ang) * r * p)
      const y = Math.round(fx.pos.y + Math.sin(ang) * r * p)
      ctx.fillRect(x, y, 1, 1)
      if (i % 2 === 0) ctx.fillRect(x + 1, y, 1, 1)
    }
    ctx.restore()
    return
  }

  if (fx.type === "shield") {
    ctx.save()
    ctx.globalAlpha = 0.7 * a
    ctx.strokeStyle = PALETTE.neonCyan
    ctx.lineWidth = 1
    const r = 14
    const x0 = Math.round(fx.pos.x)
    const y0 = Math.round(fx.pos.y)
    ctx.beginPath()
    ctx.rect(x0 - r, y0 - r, r * 2, r * 2)
    ctx.stroke()
    ctx.restore()
    return
  }

  if (fx.type === "stun") {
    ctx.save()
    ctx.globalAlpha = 0.9 * a
    ctx.fillStyle = PALETTE.neonPink
    const baseY = Math.round(fx.pos.y - 18 - p * 4)
    for (let i = 0; i < 3; i++) {
      const x = Math.round(fx.pos.x - 6 + i * 6)
      ctx.fillRect(x, baseY + (i % 2), 2, 2)
      ctx.fillRect(x + 1, baseY - 1 + (i % 2), 1, 4)
    }
    ctx.restore()
  }
}
