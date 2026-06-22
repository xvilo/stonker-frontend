import { useCallback, useEffect, useState } from 'react'

const KEY = 'stonker.hideAmounts'

/**
 * Privacy toggle for currency values ("blur amounts"). Persisted to
 * localStorage so it survives reloads. The boolean drives the `.hide-amounts`
 * class on the app shell, which blurs every `.money` value (see {@link Money}).
 */
export function useHideAmounts(): [boolean, () => void] {
  const [hidden, setHidden] = useState<boolean>(() => localStorage.getItem(KEY) === '1')

  useEffect(() => {
    localStorage.setItem(KEY, hidden ? '1' : '0')
  }, [hidden])

  const toggle = useCallback(() => setHidden((v) => !v), [])

  return [hidden, toggle]
}
