export const LOGICAL_W = 320
export const LOGICAL_H = 180

export const CONFIG = {
  hpMax: 100,
  moveSpeed: 72,
  defendSpeedMul: 0.55,
  attack: {
    damage: 8,
    cd: 0.35,
    windup: 0.08,
    active: 0.08,
    recovery: 0.16,
    knockback: 56,
    hitStun: 0.16,
    range: 16,
  },
  defend: {
    damageMul: 0.4,
    knockbackMul: 0.25,
  },
  dash: {
    damage: 12,
    cd: 2.5,
    duration: 0.18,
    speed: 220,
    armorDamageMul: 0.8,
    hitRadius: 14,
    knockback: 92,
  },
  arenaPadding: 12,
} as const

export const PALETTE = {
  bg0: "#050812",
  bg1: "#0b0f22",
  grid: "#24f7ff",
  gridDim: "rgba(36, 247, 255, 0.25)",
  neonPink: "#ff4bd8",
  neonPurple: "#b04bff",
  neonCyan: "#24f7ff",
  sparkY: "#ffd54a",
  white: "#ffffff",
  hpP1: "#24f7ff",
  hpP2: "#b04bff",
  hpBack: "rgba(255,255,255,0.12)",
} as const
