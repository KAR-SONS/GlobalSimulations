import { useEffect, useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import { Navbar } from './components/Navbar'
import { Landing } from './pages/Landing'
import { Play } from './pages/Play'
import { Wallet } from './pages/Wallet'

function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined) // undefined = loading
  const [username, setUsername] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const refreshWallet = useCallback(async () => {
    if (!session?.user) return
    const { data } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', session.user.id)
      .single()
    if (data) setBalance(data.balance)
  }, [session])

  useEffect(() => {
    if (!session?.user) {
      setUsername(null)
      setBalance(null)
      return
    }
    supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setUsername(data?.username ?? null))
    refreshWallet()
  }, [session, refreshWallet])

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-ink-700 border-t-signal-amber animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      {session && <Navbar username={username} balance={balance} />}
      <Routes>
        <Route
          path="/"
          element={session ? <Navigate to="/play" replace /> : <Landing />}
        />
        <Route
          path="/play"
          element={session ? <Play onWalletChange={refreshWallet} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/wallet"
          element={
            session ? (
              <Wallet balance={balance} refreshBalance={refreshWallet} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
