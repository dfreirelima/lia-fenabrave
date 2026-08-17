import { create } from "zustand";
import { persist } from "zustand/middleware";

type PulseState = {
  /** Master switch for background polling — driven by the centre nav button. */
  live: boolean;
  toggleLive: () => void;

  unlocked: boolean;
  unlock: () => void;
  lock: () => void;
};

export const usePulse = create<PulseState>()(
  persist(
    (set) => ({
      live: true,
      toggleLive: () => set((s) => ({ live: !s.live })),
      unlocked: false,
      unlock: () => set({ unlocked: true }),
      lock: () => set({ unlocked: false }),
    }),
    {
      name: "pulse-state",
      // `live` is a per-session control; only the unlock survives a reload.
      partialize: (s) => ({ unlocked: s.unlocked }),
    }
  )
);
