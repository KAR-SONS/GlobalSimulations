import { Link, useLocation } from 'react-router-dom'
import { formatKsh } from '../lib/types'
import { supabase } from '../lib/supabaseClient'

export function Navbar({
  username,
  balance,
}: {
  username: string | null
  balance: number | null
}) {
  const location = useLocation()

  const linkClass = (path: string) =>
    `text-md transition-colors ${
      location.pathname === path ? 'text-signal-amber' : 'text-fog-400 hover:text-paper-50'
    }`

  return (
    <nav className="border-b border-ink-700 bg-ink-950/95 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto max-w-4xl flex items-center justify-between px-4 sm:px-6 py-4">
        <Link to="/play" className="display font-bold text-xl tracking-tight">
          GLOBAL<span className="text-signal-amber">SIMS</span>
        </Link>

        <div className="flex items-center gap-6">
          {username && (
            <>
              <Link to="/play" className={linkClass('/play')}>
                Duel
              </Link>
              <Link to="/wallet" className={linkClass('/wallet')}>
                Wallet
              </Link>
              {balance !== null && (
                <span className="mono text-sm text-paper-50 hidden sm:inline">
                  {formatKsh(balance)}
                </span>
              )}
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-sm text-fog-400 hover:text-loss-red transition-colors"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
