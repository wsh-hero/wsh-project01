import GameCanvas from "@/components/GameCanvas"
import { CONFIG } from "@/game/config"
import { useGameUiStore } from "@/store/useGameUiStore"

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-3 w-full rounded-sm bg-white/10">
      <div
        className="h-3 rounded-sm"
        style={{
          width: `${Math.round(clamp01(value) * 100)}%`,
          background: color,
          boxShadow: `0 0 18px ${color}55`,
        }}
      />
    </div>
  )
}

function CooldownDots({ cd, color }: { cd: number; color: string }) {
  const pct = clamp01(1 - cd / CONFIG.dash.cd)
  const count = 6
  const filled = Math.round(pct * count)
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-[2px]"
          style={{
            background: i < filled ? color : "rgba(255,255,255,0.12)",
            boxShadow: i < filled ? `0 0 12px ${color}55` : undefined,
          }}
        />
      ))}
    </div>
  )
}

export default function Home() {
  const hpP1 = useGameUiStore((s) => s.hpP1)
  const hpP2 = useGameUiStore((s) => s.hpP2)
  const dashCooldownP1 = useGameUiStore((s) => s.dashCooldownP1)
  const dashCooldownP2 = useGameUiStore((s) => s.dashCooldownP2)
  const winner = useGameUiStore((s) => s.winner)
  const phase = useGameUiStore((s) => s.phase)

  return (
    <div className="min-h-screen bg-[#050812] text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h1 className="text-lg font-semibold tracking-wide">
              NEON MECH DUEL <span className="text-white/40">v0</span>
            </h1>
            <div className="text-xs text-white/60">
              {phase === "fight" ? "FIGHT" : phase === "ko" ? "KO" : "READY"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
              <div className="mb-1 flex items-center justify-between text-xs text-white/70">
                <span>P1</span>
                <span className="text-white/45">WASD / J K L</span>
              </div>
              <Bar value={hpP1 / CONFIG.hpMax} color="#24f7ff" />
              <div className="mt-2 flex items-center justify-between text-[11px] text-white/60">
                <span>Dash</span>
                <CooldownDots cd={dashCooldownP1} color="#24f7ff" />
              </div>
            </div>

            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
              <div className="mb-1 flex items-center justify-between text-xs text-white/70">
                <span>P2</span>
                <span className="text-white/45">↑↓←→ / 1 2 3</span>
              </div>
              <Bar value={hpP2 / CONFIG.hpMax} color="#b04bff" />
              <div className="mt-2 flex items-center justify-between text-[11px] text-white/60">
                <span>Dash</span>
                <CooldownDots cd={dashCooldownP2} color="#b04bff" />
              </div>
            </div>
          </div>
        </header>

        <main className="relative flex h-[520px] items-center justify-center rounded-xl border border-white/10 bg-black/20 p-4">
          <GameCanvas />
          {winner && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-xl border border-white/10 bg-black/60 px-6 py-5 text-center shadow-[0_0_60px_rgba(36,247,255,0.18)]">
                <div className="text-3xl font-bold tracking-widest">
                  {winner === "p1" ? (
                    <span className="text-[#24f7ff]">P1 WIN</span>
                  ) : (
                    <span className="text-[#b04bff]">P2 WIN</span>
                  )}
                </div>
                <div className="mt-2 text-sm text-white/70">按 R 重开</div>
              </div>
            </div>
          )}
        </main>

        <footer className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            <div>
              <span className="text-white/90">P1：</span>WASD 移动，J 攻击，K 防御，L 冲刺
            </div>
            <div>
              <span className="text-white/90">P2：</span>方向键移动，1 攻击，2 防御，3 冲刺
            </div>
            <div className="text-white/55">规则：攻击短距离判定；防御显著减伤；冲刺命中强击退</div>
            <div className="text-white/55">按 R：随时重开</div>
          </div>
        </footer>
      </div>
    </div>
  )
}
