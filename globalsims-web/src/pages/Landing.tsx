import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export function Landing() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
          throw new Error('Username must be 3-20 characters: letters, numbers, underscore only')
        }

        const { data, error: signUpErr } = await supabase.auth.signUp({ email, password })
        if (signUpErr) throw signUpErr
        if (!data.user) throw new Error('Sign up did not return a user')

        const { error: profileErr } = await supabase
          .from('profiles')
          .insert({ id: data.user.id, username })
        if (profileErr) {
          if (profileErr.code === '23505') {
            throw new Error('That username is taken — try another')
          }
          throw profileErr
        }
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
        if (signInErr) throw signInErr
      }

      navigate('/play')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16">
        <div className="w-full max-w-sm fade-up">
          <p className="text-xs uppercase tracking-[0.2em] text-fog-400 mono mb-3 text-center">
            Rock · Paper · Scissors
          </p>
          <h1 className="display text-4xl font-bold text-center mb-2">
            GLOBAL<span className="text-signal-amber">SIMS</span>
          </h1>
          <p className="text-fog-400 text-center text-sm mb-10">
            One duel. One winner. Nothing hidden until both sides commit.
          </p>

          <div className="flex rounded-xl border border-ink-700 p-1 mb-6">
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-lg py-2 text-sm transition-colors ${
                mode === 'signup' ? 'bg-ink-800 text-signal-amber' : 'text-fog-400'
              }`}
            >
              Sign up
            </button>
            <button
              onClick={() => setMode('login')}
              className={`flex-1 rounded-lg py-2 text-sm transition-colors ${
                mode === 'login' ? 'bg-ink-800 text-signal-amber' : 'text-fog-400'
              }`}
            >
              Log in
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <input
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-sm placeholder:text-fog-600 focus-visible:outline-2 focus-visible:outline-duel-blue"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-sm placeholder:text-fog-600 focus-visible:outline-2 focus-visible:outline-duel-blue"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-sm placeholder:text-fog-600 focus-visible:outline-2 focus-visible:outline-duel-blue"
            />

            {error && <p className="text-loss-red text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-signal-amber text-ink-950 font-semibold py-3 text-sm hover:brightness-110 transition disabled:opacity-50"
            >
              {loading ? 'Please wait…' : mode === 'signup' ? 'Enter the arena' : 'Log in'}
            </button>
          </form>
        </div>
      </div>

      <footer className="text-center text-xs text-fog-600 pb-6 mono">
        Every round is decided server-side. No move is ever visible before both are locked in.
      </footer>
    </div>
  )
}
