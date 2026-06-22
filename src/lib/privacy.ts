import { useCallback, useSyncExternalStore } from 'react'

const KEY = 'stonker.hideAmounts'

// Shared module-level store so every consumer — the app shell that owns the
// `.hide-amounts` class and the charts that redact their own axes/tooltips —
// observes the same value and re-renders together. (Plain useState per caller
// would let these drift out of sync, since a localStorage write doesn't notify
// other hooks in the same tab.)
const listeners = new Set<() => void>()
let hidden = readInitial()

function readInitial(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): boolean {
  return hidden
}

function setHidden(next: boolean) {
  if (next === hidden) return
  hidden = next
  try {
    localStorage.setItem(KEY, hidden ? '1' : '0')
  } catch {
    /* storage disabled (private mode) — keep the in-memory value */
  }
  for (const l of listeners) l()
}

/**
 * Privacy toggle for currency values ("blur amounts"). Persisted to
 * localStorage so it survives reloads. The boolean drives the `.hide-amounts`
 * class on the app shell, which blurs every `.money` value (see {@link Money}),
 * and charts read it via {@link useAmountsHidden} to redact their axis and
 * tooltip currency labels.
 */
export function useHideAmounts(): [boolean, () => void] {
  const value = useSyncExternalStore(subscribe, getSnapshot)
  const toggle = useCallback(() => setHidden(!hidden), [])
  return [value, toggle]
}

/** Read-only view of the privacy state, for components that only redact. */
export function useAmountsHidden(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot)
}
