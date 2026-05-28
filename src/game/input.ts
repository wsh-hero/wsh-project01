import type { InputFrame, Vec2 } from "./types"

export type KeyState = {
  down: Record<string, boolean>
  prev: Record<string, boolean>
}

export function createKeyState(): KeyState {
  return { down: {}, prev: {} }
}

function v(x: number, y: number): Vec2 {
  return { x, y }
}

function normalizeMove(move: Vec2): Vec2 {
  const len = Math.hypot(move.x, move.y)
  if (len <= 0) return move
  return v(move.x / len, move.y / len)
}

function pressed(key: string, s: KeyState) {
  return !!s.down[key] && !s.prev[key]
}

function held(key: string, s: KeyState) {
  return !!s.down[key]
}

export function snapshotPrev(s: KeyState) {
  s.prev = { ...s.down }
}

export function inputP1(s: KeyState): InputFrame {
  const move = v(
    (held("KeyD", s) ? 1 : 0) - (held("KeyA", s) ? 1 : 0),
    (held("KeyS", s) ? 1 : 0) - (held("KeyW", s) ? 1 : 0),
  )
  return {
    move: normalizeMove(move),
    attackDown: held("KeyJ", s),
    attackPressed: pressed("KeyJ", s),
    defendDown: held("KeyK", s),
    dashDown: held("KeyL", s),
    dashPressed: pressed("KeyL", s),
  }
}

export function inputP2(s: KeyState): InputFrame {
  const move = v(
    (held("ArrowRight", s) ? 1 : 0) - (held("ArrowLeft", s) ? 1 : 0),
    (held("ArrowDown", s) ? 1 : 0) - (held("ArrowUp", s) ? 1 : 0),
  )
  return {
    move: normalizeMove(move),
    attackDown: held("Digit1", s),
    attackPressed: pressed("Digit1", s),
    defendDown: held("Digit2", s),
    dashDown: held("Digit3", s),
    dashPressed: pressed("Digit3", s),
  }
}

export function restartPressed(s: KeyState) {
  return pressed("KeyR", s)
}
