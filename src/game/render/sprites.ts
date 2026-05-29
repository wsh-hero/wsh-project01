import { PALETTE } from "../config"
import type { Facing, PlayerAction, PlayerId } from "../types"

type Variant = PlayerId

type AtlasKey = `${Variant}:${PlayerAction}:${number}`

type SpriteAtlas = {
  size: number
  draw: (
    ctx: CanvasRenderingContext2D,
    variant: Variant,
    action: PlayerAction,
    frame: number,
    x: number,
    y: number,
    facing: Facing,
  ) => void
}

const SIZE = 24

function c(v: Variant) {
  if (v === "p1") {
    return {
      base: "#0d1a2b",
      line: "rgba(255,255,255,0.12)",
      main: PALETTE.neonCyan,
      hi: "#b9fbff",
      core: "#ff4bd8",
    }
  }
  return {
    base: "#140b2b",
    line: "rgba(255,255,255,0.12)",
    main: PALETTE.neonPurple,
    hi: "#e1b9ff",
    core: "#24f7ff",
  }
}

function makeCanvas() {
  const canvas = document.createElement("canvas")
  canvas.width = SIZE
  canvas.height = SIZE
  return canvas
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}

function outline(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  px(ctx, x, y, w, 1, color)
  px(ctx, x, y + h - 1, w, 1, color)
  px(ctx, x, y, 1, h, color)
  px(ctx, x + w - 1, y, 1, h, color)
}

function drawMech(ctx: CanvasRenderingContext2D, variant: Variant, pose: AtlasKey) {
  const col = c(variant)
  ctx.clearRect(0, 0, SIZE, SIZE)

  px(ctx, 7, 12, 10, 9, col.base)
  outline(ctx, 7, 12, 10, 9, col.line)
  px(ctx, 9, 14, 6, 5, "rgba(0,0,0,0.25)")

  px(ctx, 9, 6, 6, 6, col.base)
  outline(ctx, 9, 6, 6, 6, col.line)
  px(ctx, 11, 8, 2, 2, col.main)
  px(ctx, 12, 9, 1, 1, col.hi)
  px(ctx, 12, 10, 1, 1, col.core)

  const t = pose.split(":")[2] ? Number(pose.split(":")[2]) : 0
  const walkA = (t % 4) === 1 || (t % 4) === 2

  px(ctx, 8, 21, 3, 3, col.base)
  px(ctx, 13, 21, 3, 3, col.base)
  outline(ctx, 8, 21, 3, 3, col.line)
  outline(ctx, 13, 21, 3, 3, col.line)
  if (walkA) {
    px(ctx, 7, 20, 1, 3, col.main)
    px(ctx, 16, 20, 1, 3, col.main)
  } else {
    px(ctx, 8, 20, 1, 3, col.main)
    px(ctx, 15, 20, 1, 3, col.main)
  }

  const action = pose.split(":")[1] as PlayerAction

  // Shield arm stays on the left side; sword arm stays on the right side.
  px(ctx, 4, 11, 5, 7, "rgba(36,247,255,0.12)")
  outline(ctx, 4, 11, 5, 7, action === "defend" ? col.hi : col.main)
  px(ctx, 5, 12, 3, 5, "rgba(255,255,255,0.05)")

  px(ctx, 17, 13, 2, 3, col.base)
  outline(ctx, 17, 13, 2, 3, col.line)

  if (action === "attack") {
    px(ctx, 19, 11, 1, 3, col.main)
    px(ctx, 20, 9, 1, 7, col.hi)
    px(ctx, 21, 8, 1, 8, PALETTE.white)
    px(ctx, 22, 8, 1, 6, col.hi)
    px(ctx, 4, 12, 4, 6, "rgba(36,247,255,0.08)")
  } else if (action === "defend") {
    px(ctx, 3, 10, 7, 9, "rgba(36,247,255,0.2)")
    outline(ctx, 3, 10, 7, 9, col.hi)
    px(ctx, 18, 13, 2, 2, col.base)
  } else if (action === "dash") {
    px(ctx, 4, 14, 3, 1, col.main)
    px(ctx, 2, 15, 4, 1, "rgba(255,75,216,0.6)")
    px(ctx, 20, 12, 1, 6, PALETTE.white)
    px(ctx, 21, 13, 1, 4, col.hi)
  } else if (action === "hit") {
    px(ctx, 8, 5, 8, 1, col.hi)
    px(ctx, 6, 12, 2, 2, col.hi)
  } else if (action === "stunned") {
    px(ctx, 20, 12, 1, 6, PALETTE.white)
    px(ctx, 21, 13, 1, 4, col.hi)
    px(ctx, 3, 11, 5, 7, "rgba(36,247,255,0.1)")
    outline(ctx, 3, 11, 5, 7, col.main)
    px(ctx, 9, 5, 6, 1, col.hi)
  } else if (action === "ko") {
    px(ctx, 7, 12, 10, 9, "rgba(0,0,0,0.55)")
    px(ctx, 9, 6, 6, 6, "rgba(0,0,0,0.55)")
    px(ctx, 10, 8, 4, 1, "rgba(255,255,255,0.2)")
    px(ctx, 10, 10, 4, 1, "rgba(255,255,255,0.2)")
  } else {
    px(ctx, 20, 12, 1, 6, PALETTE.white)
    px(ctx, 21, 13, 1, 4, col.hi)
  }

  px(ctx, 7, 12, 10, 1, col.main)
  px(ctx, 7, 20, 10, 1, col.main)
}

let atlas: SpriteAtlas | null = null

export function createSpriteAtlas(): SpriteAtlas {
  if (atlas) return atlas
  if (typeof document === "undefined") {
    atlas = {
      size: SIZE,
      draw: () => {},
    }
    return atlas
  }

  const cache = new Map<AtlasKey, HTMLCanvasElement>()

  function get(variant: Variant, action: PlayerAction, frame: number) {
    const key: AtlasKey = `${variant}:${action}:${frame}`
    const got = cache.get(key)
    if (got) return got
    const canvas = makeCanvas()
    const ctx = canvas.getContext("2d")!
    drawMech(ctx, variant, key)
    cache.set(key, canvas)
    return canvas
  }

  atlas = {
    size: SIZE,
    draw: (ctx, variant, action, frame, x, y, facing) => {
      const sprite = get(variant, action, frame)
      const sx = Math.round(x - SIZE / 2)
      const sy = Math.round(y - SIZE / 2)
      if (facing === "left") {
        ctx.save()
        ctx.translate(sx + SIZE, sy)
        ctx.scale(-1, 1)
        ctx.drawImage(sprite, 0, 0)
        ctx.restore()
      } else {
        ctx.drawImage(sprite, sx, sy)
      }
    },
  }
  return atlas
}
