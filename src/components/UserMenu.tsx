import { useEffect, useRef, useState } from 'react'

interface UserMenuProps {
  name?: string
  email?: string
  initials: string
  hideAmounts: boolean
  onToggleHideAmounts: () => void
  onLogout: () => void
}

/**
 * The top-right user chip, expanded into a dropdown menu: privacy toggle
 * ("Blur amounts") and sign out. Closes on outside click or Escape.
 */
export function UserMenu({
  name,
  email,
  initials,
  hideAmounts,
  onToggleHideAmounts,
  onLogout,
}: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-chip-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="avatar">{initials}</div>
        <div className="user-chip-id">
          <div className="user-chip-name">{name}</div>
          <div className="faint user-chip-email">{email}</div>
        </div>
        <span className="user-chip-caret" aria-hidden>▾</span>
      </button>

      {open && (
        <div className="menu-dropdown" role="menu">
          <div className="menu-header">
            <div className="user-chip-name">{name}</div>
            <div className="faint user-chip-email">{email}</div>
          </div>
          <div className="menu-sep" />
          <button
            type="button"
            className="menu-item"
            role="menuitemcheckbox"
            aria-checked={hideAmounts}
            onClick={onToggleHideAmounts}
          >
            <span>Blur amounts</span>
            <span className={`switch ${hideAmounts ? 'on' : ''}`} aria-hidden>
              <span className="switch-knob" />
            </span>
          </button>
          <div className="menu-sep" />
          <button type="button" className="menu-item danger" role="menuitem" onClick={onLogout}>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
