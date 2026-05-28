import { CONFIG, LOGICAL_H, LOGICAL_W } from "./config"
import type { Effect, Facing, GameState, InputFrame, Player, PlayerId, Rect, UiSnapshot, Vec2 } from "./types"

function v(x: number, y: number): Vec2 {
  return { x, y }
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function rectsIntersect(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function facingFromMove(move: Vec2, prev: Facing): Facing {
  if (Math.abs(move.x) < 1e-3 && Math.abs(move.y) < 1e-3) return prev
  if (Math.abs(move.x) >= Math.abs(move.y)) return move.x >= 0 ? "right" : "left"
  return move.y >= 0 ? "down" : "up"
}

function facingDir(f: Facing): Vec2 {
  if (f === "left") return v(-1, 0)
  if (f === "right") return v(1, 0)
  if (f === "up") return v(0, -1)
  return v(0, 1)
}

function hurtbox(p: Player): Rect {
  return { x: p.pos.x - 10, y: p.pos.y - 10, w: 20, h: 20 }
}

function attackHitbox(p: Player): Rect {
  const dir = facingDir(p.facing)
  const range = CONFIG.attack.range
  const w = Math.abs(dir.x) > 0 ? range : 14
  const h = Math.abs(dir.y) > 0 ? range : 14
  const ox = dir.x * (14 + w * 0.5)
  const oy = dir.y * (14 + h * 0.5)
  return { x: p.pos.x + ox - w * 0.5, y: p.pos.y + oy - h * 0.5, w, h }
}

function canAct(p: Player) {
  return p.action !== "hit" && p.action !== "ko"
}

function setAction(p: Player, action: Player["action"]) {
  if (p.action !== action) {
    p.action = action
    p.actionT = 0
    if (action === "attack") p.attackHasHit = false
  }
}

function spawnEffect(state: GameState, type: Effect["type"], pos: Vec2, duration: number) {
  const fx: Effect = {
    id: `${state.frame}-${type}-${Math.floor(pos.x)}-${Math.floor(pos.y)}-${Math.random().toString(16).slice(2)}`,
    type,
    pos: { ...pos },
    t: 0,
    duration,
  }
  state.effects.push(fx)
}

function applyDamage(
  state: GameState,
  attacker: Player,
  defender: Player,
  baseDamage: number,
  knockback: number,
  isDashHit: boolean,
) {
  const defending = defender.action === "defend" && defender.actionT >= 0.03
  const dmgMul =
    defender.action === "dash" ? CONFIG.dash.armorDamageMul : defending ? CONFIG.defend.damageMul : 1
  const kbMul = defending ? CONFIG.defend.knockbackMul : 1

  defender.hp = clamp(defender.hp - baseDamage * dmgMul, 0, CONFIG.hpMax)

  const dir = facingDir(attacker.facing)
  defender.pos.x += dir.x * knockback * kbMul
  defender.pos.y += dir.y * knockback * kbMul

  if (defender.hp <= 0) {
    setAction(defender, "ko")
    state.phase = "ko"
    state.winner = attacker.id
    return
  }

  if (defender.action !== "dash") {
    setAction(defender, "hit")
    defender.actionT = 0
    defender.vel = v(dir.x * 40, dir.y * 40)
  } else if (isDashHit) {
    defender.vel = v(defender.vel.x * 0.25, defender.vel.y * 0.25)
  }
}

export function createGame(): GameState {
  const p1: Player = {
    id: "p1",
    pos: v(LOGICAL_W * 0.28, LOGICAL_H * 0.55),
    vel: v(0, 0),
    facing: "right",
    hp: CONFIG.hpMax,
    action: "idle",
    actionT: 0,
    attackCd: 0,
    dashCd: 0,
    attackHasHit: false,
  }
  const p2: Player = {
    id: "p2",
    pos: v(LOGICAL_W * 0.72, LOGICAL_H * 0.55),
    vel: v(0, 0),
    facing: "left",
    hp: CONFIG.hpMax,
    action: "idle",
    actionT: 0,
    attackCd: 0,
    dashCd: 0,
    attackHasHit: false,
  }

  return {
    t: 0,
    phase: "ready",
    winner: null,
    arena: { w: LOGICAL_W, h: LOGICAL_H },
    players: { p1, p2 },
    effects: [],
    frame: 0,
  }
}

function stepPlayer(p: Player, dt: number) {
  p.actionT += dt
  p.attackCd = Math.max(0, p.attackCd - dt)
  p.dashCd = Math.max(0, p.dashCd - dt)
}

function integrate(p: Player, dt: number) {
  p.pos.x += p.vel.x * dt
  p.pos.y += p.vel.y * dt
}

function clampToArena(state: GameState, p: Player) {
  const pad = CONFIG.arenaPadding
  p.pos.x = clamp(p.pos.x, pad, state.arena.w - pad)
  p.pos.y = clamp(p.pos.y, 24 + pad, state.arena.h - pad)
}

function updateEffects(state: GameState, dt: number) {
  for (const fx of state.effects) fx.t += dt
  state.effects = state.effects.filter((fx) => fx.t < fx.duration)
}

export function stepGame(state: GameState, dtRaw: number, input: Record<PlayerId, InputFrame>) {
  const dt = clamp(dtRaw, 0, 0.05)
  state.t += dt
  state.frame += 1

  updateEffects(state, dt)

  const p1 = state.players.p1
  const p2 = state.players.p2

  stepPlayer(p1, dt)
  stepPlayer(p2, dt)

  if (state.phase === "ready") state.phase = "fight"

  if (state.phase === "ko") {
    p1.vel = v(0, 0)
    p2.vel = v(0, 0)
    return
  }

  const i1 = input.p1
  const i2 = input.p2

  p1.facing = facingFromMove(i1.move, p1.facing)
  p2.facing = facingFromMove(i2.move, p2.facing)

  if (canAct(p1) && i1.dashPressed && p1.dashCd <= 0) {
    setAction(p1, "dash")
    p1.dashCd = CONFIG.dash.cd
  }
  if (canAct(p2) && i2.dashPressed && p2.dashCd <= 0) {
    setAction(p2, "dash")
    p2.dashCd = CONFIG.dash.cd
  }

  if (canAct(p1) && i1.attackPressed && p1.attackCd <= 0 && p1.action !== "dash") {
    setAction(p1, "attack")
    p1.attackCd = CONFIG.attack.cd
  }
  if (canAct(p2) && i2.attackPressed && p2.attackCd <= 0 && p2.action !== "dash") {
    setAction(p2, "attack")
    p2.attackCd = CONFIG.attack.cd
  }

  if (canAct(p1) && i1.defendDown && p1.action !== "dash" && p1.action !== "attack") {
    setAction(p1, "defend")
  } else if (p1.action === "defend" && !i1.defendDown) {
    setAction(p1, "idle")
  }

  if (canAct(p2) && i2.defendDown && p2.action !== "dash" && p2.action !== "attack") {
    setAction(p2, "defend")
  } else if (p2.action === "defend" && !i2.defendDown) {
    setAction(p2, "idle")
  }

  if (p1.action === "hit" && p1.actionT >= CONFIG.attack.hitStun) setAction(p1, "idle")
  if (p2.action === "hit" && p2.actionT >= CONFIG.attack.hitStun) setAction(p2, "idle")

  if (p1.action === "dash" && p1.actionT >= CONFIG.dash.duration) setAction(p1, "idle")
  if (p2.action === "dash" && p2.actionT >= CONFIG.dash.duration) setAction(p2, "idle")

  if (p1.action === "attack" && p1.actionT >= CONFIG.attack.windup + CONFIG.attack.active + CONFIG.attack.recovery)
    setAction(p1, "idle")
  if (p2.action === "attack" && p2.actionT >= CONFIG.attack.windup + CONFIG.attack.active + CONFIG.attack.recovery)
    setAction(p2, "idle")

  p1.vel = v(0, 0)
  p2.vel = v(0, 0)

  const moveMul1 = p1.action === "defend" ? CONFIG.defendSpeedMul : 1
  const moveMul2 = p2.action === "defend" ? CONFIG.defendSpeedMul : 1

  if (p1.action === "dash") {
    const d = facingDir(p1.facing)
    p1.vel = v(d.x * CONFIG.dash.speed, d.y * CONFIG.dash.speed)
  } else if (p1.action !== "attack" && p1.action !== "hit" && p1.action !== "ko") {
    p1.vel = v(i1.move.x * CONFIG.moveSpeed * moveMul1, i1.move.y * CONFIG.moveSpeed * moveMul1)
    setAction(p1, Math.abs(i1.move.x) + Math.abs(i1.move.y) > 0.1 ? "walk" : p1.action === "defend" ? "defend" : "idle")
  }

  if (p2.action === "dash") {
    const d = facingDir(p2.facing)
    p2.vel = v(d.x * CONFIG.dash.speed, d.y * CONFIG.dash.speed)
  } else if (p2.action !== "attack" && p2.action !== "hit" && p2.action !== "ko") {
    p2.vel = v(i2.move.x * CONFIG.moveSpeed * moveMul2, i2.move.y * CONFIG.moveSpeed * moveMul2)
    setAction(p2, Math.abs(i2.move.x) + Math.abs(i2.move.y) > 0.1 ? "walk" : p2.action === "defend" ? "defend" : "idle")
  }

  integrate(p1, dt)
  integrate(p2, dt)
  clampToArena(state, p1)
  clampToArena(state, p2)

  const dx = p2.pos.x - p1.pos.x
  const dy = p2.pos.y - p1.pos.y
  const dist = Math.hypot(dx, dy)
  if (dist > 0 && dist < 18) {
    const push = (18 - dist) * 0.5
    const nx = dx / dist
    const ny = dy / dist
    p1.pos.x -= nx * push
    p1.pos.y -= ny * push
    p2.pos.x += nx * push
    p2.pos.y += ny * push
    clampToArena(state, p1)
    clampToArena(state, p2)
  }

  const dashHitP1 = p1.action === "dash" && p1.actionT <= CONFIG.dash.duration
  const dashHitP2 = p2.action === "dash" && p2.actionT <= CONFIG.dash.duration

  if (dashHitP1) {
    const d = Math.hypot(p2.pos.x - p1.pos.x, p2.pos.y - p1.pos.y)
    if (d <= CONFIG.dash.hitRadius) {
      spawnEffect(state, "spark", v((p1.pos.x + p2.pos.x) * 0.5, (p1.pos.y + p2.pos.y) * 0.5), 0.12)
      applyDamage(state, p1, p2, CONFIG.dash.damage, CONFIG.dash.knockback, true)
      setAction(p1, "idle")
    }
  }
  if (dashHitP2) {
    const d = Math.hypot(p1.pos.x - p2.pos.x, p1.pos.y - p2.pos.y)
    if (d <= CONFIG.dash.hitRadius) {
      spawnEffect(state, "spark", v((p1.pos.x + p2.pos.x) * 0.5, (p1.pos.y + p2.pos.y) * 0.5), 0.12)
      applyDamage(state, p2, p1, CONFIG.dash.damage, CONFIG.dash.knockback, true)
      setAction(p2, "idle")
    }
  }

  const p1Active =
    p1.action === "attack" && p1.actionT >= CONFIG.attack.windup && p1.actionT < CONFIG.attack.windup + CONFIG.attack.active
  const p2Active =
    p2.action === "attack" && p2.actionT >= CONFIG.attack.windup && p2.actionT < CONFIG.attack.windup + CONFIG.attack.active

  if (p1Active && !p1.attackHasHit) {
    const hb = attackHitbox(p1)
    if (rectsIntersect(hb, hurtbox(p2))) {
      p1.attackHasHit = true
      spawnEffect(state, "spark", v(hb.x + hb.w * 0.5, hb.y + hb.h * 0.5), 0.1)
      if (p2.action === "defend") spawnEffect(state, "shield", { ...p2.pos }, 0.12)
      applyDamage(state, p1, p2, CONFIG.attack.damage, CONFIG.attack.knockback, false)
    }
  }

  if (p2Active && !p2.attackHasHit) {
    const hb = attackHitbox(p2)
    if (rectsIntersect(hb, hurtbox(p1))) {
      p2.attackHasHit = true
      spawnEffect(state, "spark", v(hb.x + hb.w * 0.5, hb.y + hb.h * 0.5), 0.1)
      if (p1.action === "defend") spawnEffect(state, "shield", { ...p1.pos }, 0.12)
      applyDamage(state, p2, p1, CONFIG.attack.damage, CONFIG.attack.knockback, false)
    }
  }
}

export function getUiSnapshot(state: GameState): UiSnapshot {
  return {
    hpP1: state.players.p1.hp,
    hpP2: state.players.p2.hp,
    winner: state.winner,
    dashCooldownP1: state.players.p1.dashCd,
    dashCooldownP2: state.players.p2.dashCd,
    phase: state.phase,
  }
}

