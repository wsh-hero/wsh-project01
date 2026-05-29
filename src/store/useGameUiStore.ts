import { create } from "zustand"
import type { UiSnapshot } from "@/game/types"

type GameUiState = UiSnapshot & {
  setSnapshot: (snap: UiSnapshot) => void
  resetSnapshot: () => void
}

const initialSnapshot: UiSnapshot = {
  hpP1: 100,
  hpP2: 100,
  winner: null,
  dashCooldownP1: 0,
  dashCooldownP2: 0,
  phase: "ready",
}

export const useGameUiStore = create<GameUiState>((set) => ({
  ...initialSnapshot,
  setSnapshot: (snap) => set(snap),
  resetSnapshot: () => set(initialSnapshot),
}))
