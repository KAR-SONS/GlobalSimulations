import { Link } from 'react-router-dom'

const STAKES = [
  { label: 'Ksh 20', wager: 20, payout: 36 },
  { label: 'Ksh 50', wager: 50, payout: 90 },
  { label: 'Ksh 100', wager: 100, payout: 180 },
  { label: 'Ksh 250', wager: 250, payout: 450 },
]

export function HowItWorks() {
  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6 py-12 fade-up">

      {/* Back */}
      <Link
        to="/play"
        className="inline-flex items-center gap-2 text-sm text-fog-400 hover:text-paper-50 transition-colors mb-10"
      >
        ← Back to duel
      </Link>

      <h1 className="display text-3xl font-bold mb-2">How It Works</h1>
      <p className="text-fog-400 text-md mb-10">
        Rock, Paper, Scissors. Best of three rounds. One winner.
      </p>

      {/* Free games */}
      <section className="rounded-2xl border border-ink-700 bg-ink-800 p-6 mb-4">
        <div className="flex items-start gap-4">
          <span className="text-2xl mt-0.5">🎮</span>
          <div>
            <h2 className="display text-lg font-semibold mb-1">Free Games</h2>
            <p className="text-sm text-fog-400 leading-relaxed">
              Play for free with no stake. If you win the duel,{' '}
              <span className="text-signal-amber font-semibold mono">Ksh 1</span> is added to your
              wallet automatically. Lose and nothing changes. A low-risk way to build up a balance
              before staking.
            </p>
            <div className="mt-4 rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-fog-400">Win a free game</span>
              <span className="mono text-signal-amber font-semibold">+Ksh 1</span>
            </div>
          </div>
        </div>
      </section>

      {/* Staked games */}
      <section className="rounded-2xl border border-ink-700 bg-ink-800 p-6 mb-10">
        <div className="flex items-start gap-4">
          <span className="text-2xl mt-0.5">💰</span>
          <div className="w-full">
            <h2 className="display text-lg font-semibold mb-1">Staked Games</h2>
            <p className="text-sm text-fog-400 leading-relaxed mb-4">
              Choose a stake before the duel starts. Your stake is held immediately. Win and you
              receive{' '}
              <span className="text-signal-amber font-semibold">1.8× your stake</span> back into
              your wallet. Lose and the stake is gone.
            </p>

            {/* Payout table */}
            <div className="rounded-xl border border-ink-700 overflow-hidden">
              <div className="grid grid-cols-3 bg-ink-900 px-4 py-2 text-xs uppercase tracking-widest text-fog-600 mono">
                <span>Stake</span>
                <span className="text-center">Multiplier</span>
                <span className="text-right">Win payout</span>
              </div>
              {STAKES.map((s) => (
                <div
                  key={s.label}
                  className="grid grid-cols-3 px-4 py-3 border-t border-ink-700 text-sm"
                >
                  <span className="mono">{s.label}</span>
                  <span className="text-center text-fog-400">×1.8</span>
                  <span className="mono text-signal-amber text-right">Ksh {s.payout}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Game rules */}
      <section className="mb-10">
        <h2 className="display text-lg font-semibold mb-4">The Rules</h2>
        <div className="space-y-3">
          {[
            ['Best of three', 'First player to win 2 rounds wins the duel.'],
            ['Ties replay', 'If both players pick the same move, that round is replayed — it doesn\'t count toward either score.'],
            ['Bot plays fair', 'The bot picks its move randomly and completely independently — it never sees your choice before committing.'],
            ['Results are final', 'Everything is decided on our server. There\'s no way to change a move after submitting it.'],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-xl border border-ink-700 bg-ink-900 px-4 py-3">
              <p className="text-md font-medium mb-0.5">{title}</p>
              <p className="text-sm text-fog-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Wallet rules */}
      <section className="mb-12">
        <h2 className="display text-lg font-semibold mb-4">Your Wallet</h2>
        <div className="space-y-3 text-md text-fog-400">
          <p>Deposit anytime via M-Pesa on the Wallet page. Winnings land in your wallet immediately after each game.</p>
          <p>
            Minimum withdrawal is{' '}
            <span className="text-paper-50 mono">Ksh 100</span>. Withdrawals are paid out manually
            — allow a short wait after requesting.
          </p>
        </div>
      </section>

      <Link
        to="/play"
        className="block w-full rounded-xl bg-signal-amber text-ink-950 font-semibold py-3 text-md text-center hover:brightness-110 transition"
      >
        Start playing
      </Link>
    </div>
  )
}