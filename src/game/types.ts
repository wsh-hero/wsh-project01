export type PlayerId = "p1" | "p2"

export type Vec2 = {
  x: number
  y: number
}

export type Rect = {
  x: number
  y: number
  w: number
  h: number
}

export type Facing = "up" | "down" | "left" | "right"

export type Phase = "ready" | "fight" | "ko"

export type PlayerAction = "idle" | "walk" | "attack" | "defend" | "dash" | "hit" | "ko"

export type EffectType = "spark" | "shield"

export type Effect = {
  id: string
  type: EffectType
  pos: Vec2
  t: number
  duration: number
}

export type Player = {
  id: PlayerId
  pos: Vec2
  vel: Vec2
  facing: Facing
  hp: number
  action: PlayerAction
  actionT: number
  attackCd: number
  dashCd: number
  attackHasHit: boolean
}

export type InputFrame = {
  move: Vec2
  attackDown: boolean
  attackPressed: boolean
  defendDown: boolean
  dashDown: boolean
  dashPressed: boolean
}

export type GameState = {
  t: number
  phase: Phase
  winner: PlayerId | null
  arena: { w: number; h: number }
  players: Record<PlayerId, Player>
  effects: Effect[]
  frame: number
}

export type UiSnapshot = {
  hpP1: number
  hpP2: number
  winner: PlayerId | null
  dashCooldownP1: number
  dashCooldownP2: number
  phase: Phase
}
