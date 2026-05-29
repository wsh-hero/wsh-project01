import { useMemo, useState } from "react"
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
  const [screen, setScreen] = useState<"menu" | "game" | "exit">("menu")
  const [session, setSession] = useState(0)
  const hpP1 = useGameUiStore((s) => s.hpP1)
  const hpP2 = useGameUiStore((s) => s.hpP2)
  const dashCooldownP1 = useGameUiStore((s) => s.dashCooldownP1)
  const dashCooldownP2 = useGameUiStore((s) => s.dashCooldownP2)
  const winner = useGameUiStore((s) => s.winner)
  const phase = useGameUiStore((s) => s.phase)
  const resetSnapshot = useGameUiStore((s) => s.resetSnapshot)

  const statusText = useMemo(() => {
    if (screen === "menu") return "MAIN MENU"
    if (screen === "exit") return "GOODBYE"
    return phase === "fight" ? "FIGHT" : phase === "ko" ? "KO" : "READY"
  }, [phase, screen])

  const startGame = () => {
    resetSnapshot()
    setSession((n) => n + 1)
    setScreen("game")
  }

  const exitGame = () => {
    resetSnapshot()
    setScreen("exit")
  }

  return (
    <div className="min-h-screen bg-[#050812] text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h1 className="text-lg font-semibold tracking-wide">
              NEON MECH DUEL <span className="text-white/40">v0</span>
            </h1>
            <div className="text-xs text-white/60">{statusText}</div>
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

        <main className="relative flex h-[520px] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/20 p-4">
          {screen === "game" && <GameCanvas key={session} />}

          {screen === "menu" && (
            <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(36,247,255,0.16),transparent_35%),radial-gradient(circle_at_bottom,rgba(176,75,255,0.22),transparent_40%),linear-gradient(180deg,rgba(5,8,18,0.82),rgba(5,8,18,0.94))]">
              <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/55 px-8 py-8 text-center shadow-[0_0_80px_rgba(176,75,255,0.18)]">
                <div className="text-xs tracking-[0.35em] text-white/45">PIXEL ARENA</div>
                <h2 className="mt-3 text-3xl font-bold tracking-[0.2em] text-[#24f7ff]">开始游戏</h2>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  赛博机甲持刀与盾对决。挥刀被举盾格挡时，攻击者会陷入 1 秒晕眩。
                </p>
                <div className="mt-8 grid gap-3">
                  <button
                    type="button"
                    onClick={startGame}
                    className="rounded-lg border border-[#24f7ff]/40 bg-[#24f7ff]/10 px-4 py-3 text-sm tracking-[0.2em] text-[#24f7ff] transition hover:bg-[#24f7ff]/20"
                  >
                    START GAME
                  </button>
                  <button
                    type="button"
                    onClick={exitGame}
                    className="rounded-lg border border-[#ff4bd8]/35 bg-[#ff4bd8]/8 px-4 py-3 text-sm tracking-[0.2em] text-[#ff92ea] transition hover:bg-[#ff4bd8]/18"
                  >
                    EXIT
                  </button>
                </div>
              </div>
            </div>
          )}

          {screen === "exit" && (
            <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(5,8,18,0.9),rgba(5,8,18,0.98))]">
              <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/55 px-8 py-8 text-center">
                <div className="text-xs tracking-[0.35em] text-white/40">SYSTEM OFFLINE</div>
                <h2 className="mt-3 text-3xl font-bold tracking-[0.2em] text-[#ff4bd8]">已退出</h2>
                <p className="mt-3 text-sm leading-6 text-white/70">感谢游玩。你可以返回主菜单重新开始一局。</p>
                <button
                  type="button"
                  onClick={() => setScreen("menu")}
                  className="mt-8 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm tracking-[0.18em] text-white/80 transition hover:bg-white/10"
                >
                  BACK TO MENU
                </button>
              </div>
            </div>
          )}

          {screen === "game" && winner && (
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
            <div className="text-white/55">规则：机甲持刀挥砍、举盾格挡；攻击被格挡后攻击者晕眩 1 秒</div>
            <div className="text-white/55">按 R：对战内随时重开</div>
          </div>
        </footer>
      </div>
    </div>
  )
}
