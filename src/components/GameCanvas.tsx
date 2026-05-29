import { useEffect, useMemo, useRef, useState } from "react"
import { createGame, getUiSnapshot, stepGame } from "@/game/engine"
import { createKeyState, inputP1, inputP2, restartPressed, snapshotPrev } from "@/game/input"
import type { GameState } from "@/game/types"
import { createRenderer } from "@/game/render/renderer"
import { useGameUiStore } from "@/store/useGameUiStore"

function bestScale(containerW: number, containerH: number, logicalW: number, logicalH: number) {
  const s = Math.floor(Math.min(containerW / logicalW, containerH / logicalH))
  return Math.max(1, Math.min(6, s))
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastRef = useRef<number>(0)
  const stateRef = useRef<GameState | null>(null)
  const rendererRef = useRef<ReturnType<typeof createRenderer> | null>(null)
  const keys = useMemo(() => createKeyState(), [])
  const setSnapshot = useGameUiStore((s) => s.setSnapshot)
  const [scale, setScale] = useState(3)

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return

    const ctx = el.getContext("2d")
    if (!ctx) return

    const state = createGame()
    stateRef.current = state
    rendererRef.current = createRenderer(ctx)
    setSnapshot(getUiSnapshot(state))

    const onKeyDown = (e: KeyboardEvent) => {
      keys.down[e.code] = true
      if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault()
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys.down[e.code] = false
      if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault()
    }

    window.addEventListener("keydown", onKeyDown, { passive: false })
    window.addEventListener("keyup", onKeyUp, { passive: false })

    const ro = new ResizeObserver(() => {
      const parent = el.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const r = rendererRef.current
      if (!r) return
      const nextScale = bestScale(rect.width, rect.height, r.logicalW, r.logicalH)
      setScale(nextScale)
    })
    if (el.parentElement) ro.observe(el.parentElement)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      ro.disconnect()
    }
  }, [keys, setSnapshot])

  useEffect(() => {
    const el = canvasRef.current
    const r = rendererRef.current
    if (!el || !r) return
    el.width = r.logicalW * scale
    el.height = r.logicalH * scale
    el.style.width = `${r.logicalW * scale}px`
    el.style.height = `${r.logicalH * scale}px`
  }, [scale])

  useEffect(() => {
    const loop = (now: number) => {
      const state = stateRef.current
      const r = rendererRef.current
      const el = canvasRef.current
      if (!state || !r || !el) return

      const dt = lastRef.current ? (now - lastRef.current) / 1000 : 0
      lastRef.current = now

      const p1 = inputP1(keys)
      const p2 = inputP2(keys)
      if (restartPressed(keys)) {
        stateRef.current = createGame()
        setSnapshot(getUiSnapshot(stateRef.current))
        snapshotPrev(keys)
        frameRef.current = requestAnimationFrame(loop)
        return
      }

      stepGame(state, dt, { p1, p2 })
      r.render(state, scale)

      if (state.frame % 6 === 0) setSnapshot(getUiSnapshot(state))

      snapshotPrev(keys)
      frameRef.current = requestAnimationFrame(loop)
    }

    frameRef.current = requestAnimationFrame(loop)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [keys, scale, setSnapshot])

  return (
    <div className="flex h-full w-full items-center justify-center">
      <canvas
        ref={canvasRef}
        className="rounded-lg border border-white/10 bg-black shadow-[0_0_0_1px_rgba(36,247,255,0.14),0_0_40px_rgba(176,75,255,0.14)]"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  )
}
