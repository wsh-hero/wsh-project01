import { LOGICAL_H, LOGICAL_W, PALETTE } from "../config"
import type { GameState, Player, PlayerAction } from "../types"
import { createSpriteAtlas } from "./sprites"
import { drawEffect } from "./effects"

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function actionFrame(action: PlayerAction, p: Player, t: number) {
  if (action === "walk") return Math.floor(t * 10) % 4
  if (action === "idle") return Math.floor(t * 4) % 2
  if (action === "defend") return Math.floor(t * 6) % 2
  if (action === "dash") return Math.floor(p.actionT * 18) % 2
  if (action === "attack") return clamp(Math.floor((p.actionT / 0.24) * 3), 0, 2)
  return 0
}

function drawBackground(ctx: CanvasRenderingContext2D, t: number) {
  const g = ctx.createLinearGradient(0, 0, 0, LOGICAL_H)
  g.addColorStop(0, PALETTE.bg0)
  g.addColorStop(1, PALETTE.bg1)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H)

  ctx.save()
  ctx.globalAlpha = 0.22
  ctx.fillStyle = "rgba(255,255,255,0.03)"
  for (let i = 0; i < 220; i++) {
    const x = (i * 73 + Math.floor(t * 60)) % LOGICAL_W
    const y = (i * 41 + Math.floor(t * 37)) % LOGICAL_H
    ctx.fillRect(x, y, 1, 1)
  }
  ctx.restore()

  ctx.save()
  ctx.globalAlpha = 0.9
  ctx.fillStyle = "rgba(255,255,255,0.06)"
  for (let x = 0; x < LOGICAL_W; x += 12) {
    const h = 18 + ((x * 17) % 18)
    ctx.fillRect(x, 36 - h, 10, h)
  }
  ctx.restore()

  const scroll = Math.floor(t * 14) % 8
  ctx.save()
  ctx.globalAlpha = 0.55
  for (let y = 44; y < LOGICAL_H; y += 8) {
    const a = y === 44 ? 0.6 : 0.22
    ctx.strokeStyle = y === 44 ? PALETTE.grid : PALETTE.gridDim
    ctx.globalAlpha = a
    ctx.beginPath()
    ctx.moveTo(0, y + scroll)
    ctx.lineTo(LOGICAL_W, y + scroll)
    ctx.stroke()
  }
  for (let x = 0; x < LOGICAL_W; x += 16) {
    ctx.strokeStyle = PALETTE.gridDim
    ctx.globalAlpha = 0.18
    ctx.beginPath()
    ctx.moveTo(x + scroll, 44)
    ctx.lineTo(x + scroll, LOGICAL_H)
    ctx.stroke()
  }
  ctx.restore()
}

function drawShadow(ctx: CanvasRenderingContext2D, p: Player) {
  ctx.save()
  ctx.globalAlpha = 0.35
  ctx.fillStyle = "rgba(0,0,0,0.35)"
  const w = 18
  const h = 6
  ctx.fillRect(Math.round(p.pos.x - w / 2), Math.round(p.pos.y + 12), w, h)
  ctx.restore()
}

export type Renderer = {
  render: (state: GameState, scale: number) => void
  logicalW: number
  logicalH: number
}

export function createRenderer(outCtx: CanvasRenderingContext2D): Renderer {
  const buf = document.createElement("canvas")
  buf.width = LOGICAL_W
  buf.height = LOGICAL_H
  const ctx = buf.getContext("2d")!
  const atlas = createSpriteAtlas()

  ctx.imageSmoothingEnabled = false
  outCtx.imageSmoothingEnabled = false

  return {
    logicalW: LOGICAL_W,
    logicalH: LOGICAL_H,
    render: (state, scale) => {
      drawBackground(ctx, state.t)

      drawShadow(ctx, state.players.p1)
      drawShadow(ctx, state.players.p2)

      const p1 = state.players.p1
      const p2 = state.players.p2

      const f1 = actionFrame(p1.action, p1, state.t)
      const f2 = actionFrame(p2.action, p2, state.t + 0.23)

      atlas.draw(ctx, "p1", p1.action, f1, p1.pos.x, p1.pos.y, p1.facing)
      atlas.draw(ctx, "p2", p2.action, f2, p2.pos.x, p2.pos.y, p2.facing)

      for (const fx of state.effects) drawEffect(ctx, fx)

      outCtx.clearRect(0, 0, LOGICAL_W * scale, LOGICAL_H * scale)
      outCtx.drawImage(buf, 0, 0, LOGICAL_W * scale, LOGICAL_H * scale)
    },
  }
}

