/**
 * Demo scenarios, chosen with `?mock=` in the URL (client side), so every UI state can be shown
 * and tested without a backend:
 *   ?mock=empty  — no discount codes
 *   ?mock=error  — the list fails to load
 *   ?mock=reset  — restore the demo data
 */
export type MockScenario = "empty" | "error" | "reset" | null

export function mockScenario(): MockScenario {
  if (typeof window === "undefined") return null
  const value = new URLSearchParams(window.location.search).get("mock")
  return value === "empty" || value === "error" || value === "reset" ? value : null
}

/** Simulated network latency. */
export const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms))

/** localStorage-backed state that survives reloads; falls back to memory (SSR, private mode). */
export function persisted<T>(key: string, seed: () => T) {
  let memory: T | undefined
  const storage = () => {
    try {
      return typeof window === "undefined" ? null : window.localStorage
    } catch {
      return null
    }
  }
  return {
    read(): T {
      const raw = storage()?.getItem(key)
      if (raw) {
        try {
          return JSON.parse(raw) as T
        } catch {
          // corrupt demo data: fall through to the seed
        }
      }
      memory ??= seed()
      return memory
    },
    write(value: T) {
      memory = value
      storage()?.setItem(key, JSON.stringify(value))
    },
    reset() {
      memory = undefined
      storage()?.removeItem(key)
    },
  }
}
