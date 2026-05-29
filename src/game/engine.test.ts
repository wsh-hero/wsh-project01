import { describe, expect, it } from "vitest"
import { CONFIG } from "./config"
import { createGame, stepGame } from "./engine"
import type { InputFrame } from "./types"

const neutral: InputFrame = {
  move: { x: 0, y: 0 },
  attackDown: false,
  attackPressed: false,
  defendDown: false,
  dashDown: false,
  dashPressed: false,
}

function stepN(state: ReturnType<typeof createGame>, n: number, input: { p1: InputFrame; p2: InputFrame }) {
  for (let i = 0; i < n; i++) stepGame(state, 1 / 60, input)
}

it("attack should reduce opponent hp", () => {
  const state = createGame()
  state.players.p1.pos = { x: 120, y: 90 }
  state.players.p2.pos = { x: 135, y: 90 }
  state.players.p1.facing = "right"

  stepGame(state, 1 / 60, { p1: { ...neutral, attackPressed: true, attackDown: true }, p2: neutral })
  stepN(state, 20, { p1: { ...neutral, attackDown: true }, p2: neutral })

  expect(state.players.p2.hp).toBeLessThan(100)
})

it("defend should reduce damage", () => {
  const a = createGame()
  const b = createGame()

  for (const s of [a, b]) {
    s.players.p1.pos = { x: 120, y: 90 }
    s.players.p2.pos = { x: 135, y: 90 }
    s.players.p1.facing = "right"
  }

  stepGame(a, 1 / 60, { p1: { ...neutral, attackPressed: true, attackDown: true }, p2: neutral })
  stepN(a, 20, { p1: { ...neutral, attackDown: true }, p2: neutral })

  stepGame(b, 1 / 60, {
    p1: { ...neutral, attackPressed: true, attackDown: true },
    p2: { ...neutral, defendDown: true },
  })
  stepN(b, 20, { p1: { ...neutral, attackDown: true }, p2: { ...neutral, defendDown: true } })

  expect(b.players.p2.hp).toBeGreaterThan(a.players.p2.hp)
})

it("attacker should be stunned for one second when attack is blocked", () => {
  const state = createGame()
  state.players.p1.pos = { x: 120, y: 90 }
  state.players.p2.pos = { x: 135, y: 90 }
  state.players.p1.facing = "right"

  stepGame(state, 1 / 60, {
    p1: { ...neutral, attackPressed: true, attackDown: true },
    p2: { ...neutral, defendDown: true },
  })
  stepN(state, 8, { p1: { ...neutral, attackDown: true }, p2: { ...neutral, defendDown: true } })

  expect(state.players.p1.action).toBe("stunned")

  stepN(state, Math.floor(CONFIG.defend.stunOnBlock * 60) - 5, {
    p1: neutral,
    p2: { ...neutral, defendDown: true },
  })
  expect(state.players.p1.action).toBe("stunned")

  stepN(state, 8, { p1: neutral, p2: neutral })
  expect(state.players.p1.action).toBe("idle")
})

describe("ko", () => {
  it("should set winner and freeze phase", () => {
    const state = createGame()
    state.players.p1.pos = { x: 120, y: 90 }
    state.players.p2.pos = { x: 135, y: 90 }
    state.players.p1.facing = "right"
    state.players.p2.hp = 6

    stepGame(state, 1 / 60, { p1: { ...neutral, attackPressed: true, attackDown: true }, p2: neutral })
    stepN(state, 20, { p1: { ...neutral, attackDown: true }, p2: neutral })

    expect(state.phase).toBe("ko")
    expect(state.winner).toBe("p1")
  })
})
