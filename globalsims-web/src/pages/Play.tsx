import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatKsh } from '../lib/types'
import type { Package, Move, StartGameResponse, SubmitMoveResponse } from '../lib/types'
import { PackageCard } from '../components/PackageCard'
import { MoveChamber } from '../components/MoveChamber'
import { Link } from 'react-router-dom'

type Stage = 'select' | 'searching' | 'dueling' | 'complete'
type RoundPhase = 'choosing' | 'sealed' | 'revealed'

export function Play({ onWalletChange }: { onWalletChange: () => void }) {
  const [packages, setPackages] = useState<Package[]>([])
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [stage, setStage] = useState<Stage>('select')
  const [error, setError] = useState<string | null>(null)

  const [gameId, setGameId] = useState<string | null>(null)
  const [wager, setWager] = useState(0)
  const [multiplier, setMultiplier] = useState(0)
  const [roundsWonPlayer, setRoundsWonPlayer] = useState(0)
  const [roundsWonBot, setRoundsWonBot] = useState(0)

  const [roundPhase, setRoundPhase] = useState<RoundPhase>('choosing')
  const [playerMove, setPlayerMove] = useState<Move | null>(null)
  const [botMove, setBotMove] = useState<Move | null>(null)
  const [roundWinner, setRoundWinner] = useState<'player' | 'bot' | 'tie' | null>(null)

  const [gameWinner, setGameWinner] = useState<'player' | 'bot' | null>(null)

  useEffect(() => {
    supabase
      .from('packages')
      .select('*')
      .eq('active', true)
      .order('sort_order')
      .then(({ data, error: pkgErr }) => {
        if (pkgErr) {
          setError('Could not load stake packages')
          return
        }
        setPackages(data ?? [])
        if (data && data.length > 0) setSelectedPackage(data[0])
      })
  }, [])

  async function findOpponent() {
    if (!selectedPackage) return
    setError(null)
    setStage('searching')

    // The "searching" beat is real UX, not fake — matchmaking against a
    // human opponent could plug into this same window later. For now
    // it settles on the bot after a short delay.
    await new Promise((res) => setTimeout(res, 2200))

    const { data, error: fnErr } = await supabase.functions.invoke<StartGameResponse>(
      'start_game',
      { body: { package_id: selectedPackage.id } },
    )

    if (fnErr || !data || data.error) {
      setError(data?.error ?? 'Could not start a game — check your balance and try again')
      setStage('select')
      return
    }

    setGameId(data.game_id)
    setWager(data.wager_amount)
    setMultiplier(selectedPackage.payout_multiplier)
    setRoundsWonPlayer(0)
    setRoundsWonBot(0)
    setRoundPhase('choosing')
    setPlayerMove(null)
    setBotMove(null)
    setRoundWinner(null)
    setGameWinner(null)
    setStage('dueling')

    if (data.wager_amount > 0) onWalletChange()
  }

  async function chooseMove(move: Move) {
    if (!gameId || roundPhase !== 'choosing') return
    setPlayerMove(move)
    setRoundPhase('sealed')

    // Brief seal beat before the reveal call — gives the "locking in"
    // moment room to register before both moves flip open together.
    await new Promise((res) => setTimeout(res, 700))

    const { data, error: fnErr } = await supabase.functions.invoke<SubmitMoveResponse>(
      'submit_move',
      { body: { game_id: gameId, move } },
    )

    if (fnErr || !data || data.error) {
      setError(data?.error ?? 'Something went wrong submitting your move')
      setRoundPhase('choosing')
      setPlayerMove(null)
      return
    }

    setBotMove(data.bot_move)
    setRoundWinner(data.round_winner)
    setRoundsWonPlayer(data.rounds_won_player)
    setRoundsWonBot(data.rounds_won_bot)
    setRoundPhase('revealed')

    await new Promise((res) => setTimeout(res, 1700))

    if (data.game_status === 'complete') {
      setGameWinner(data.game_winner)
      setStage('complete')
      if (wager > 0) onWalletChange()
    } else {
      setRoundPhase('choosing')
      setPlayerMove(null)
      setBotMove(null)
      setRoundWinner(null)
    }
  }

  function playAgain() {
    setStage('select')
    setGameId(null)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      {error && (
        <div className="mb-6 rounded-xl border border-loss-red/50 bg-loss-red/10 px-4 py-3 text-sm text-loss-red">
          {error}
        </div>
      )}

      {stage === 'select' && (
        <div className="fade-up">
          <h1 className="display text-2xl font-bold mb-1">Pick your stake</h1>
          <p className="text-fog-400 text-sm mb-6">
            Best of three. Ties replay the round. Winner takes it.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                selected={selectedPackage?.id === pkg.id}
                onSelect={() => setSelectedPackage(pkg)}
              />
            ))}
          </div>

          <button
            onClick={findOpponent}
            disabled={!selectedPackage}
            className="w-full rounded-xl bg-signal-amber text-ink-950 font-semibold py-3.5 text-sm hover:brightness-110 transition disabled:opacity-50"
          >
            Find opponent
          </button>
          <Link to="/how-it-works" className="text-md font-semibold text-signal-amber underline hover:text-fog-300 transition mt-10 block text-center ">
            How It Works
          </Link>
        </div>
      )}

      {stage === 'searching' && (
        <div className="flex flex-col items-center justify-center py-24 fade-up">
          <div className="h-10 w-10 rounded-full border-2 border-ink-700 border-t-signal-amber animate-spin mb-6" />
          <p className="mono text-sm text-fog-400 uppercase tracking-widest">
            Searching for opponent…
          </p>
        </div>
      )}

      {stage === 'dueling' && (
        <div className="fade-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-fog-400 mono">
                {wager > 0 ? `Staked ${formatKsh(wager)}` : 'Free duel'}
              </p>
              <p className="display text-lg font-semibold">
                Round {roundsWonPlayer + roundsWonBot + 1 <= 3 ? roundsWonPlayer + roundsWonBot + 1 : 3}
              </p>
            </div>
            <div className="mono text-2xl font-semibold">
              <span className={roundsWonPlayer > roundsWonBot ? 'text-signal-amber' : ''}>
                {roundsWonPlayer}
              </span>
              <span className="text-fog-600"> – </span>
              <span className={roundsWonBot > roundsWonPlayer ? 'text-loss-red' : ''}>
                {roundsWonBot}
              </span>
            </div>
          </div>

          <MoveChamber
            phase={roundPhase}
            playerMove={playerMove}
            botMove={botMove}
            roundWinner={roundWinner}
            onChoose={chooseMove}
          />

          {roundPhase === 'revealed' && roundWinner && (
            <p className="text-center mt-6 text-sm mono uppercase tracking-widest">
              {roundWinner === 'tie' ? (
                <span className="text-duel-blue">Tie — replaying round</span>
              ) : roundWinner === 'player' ? (
                <span className="text-signal-amber">Round won</span>
              ) : (
                <span className="text-loss-red">Round lost</span>
              )}
            </p>
          )}
        </div>
      )}

      {stage === 'complete' && (
        <div className="text-center py-16 fade-up">
          <p className="text-md uppercase tracking-widest text-fog-400 mono mb-3">
            {roundsWonPlayer} – {roundsWonBot}
          </p>
          <h2 className="display text-3xl font-bold mb-2">
            {gameWinner === 'player' ? (
              <span className="text-signal-amber">You won the duel</span>
            ) : (
              <span className="text-loss-red">The bot won this one</span>
            )}
          </h2>
          {wager > 0 && (
            <p className="mono text-sm text-fog-400 mb-8">
              {gameWinner === 'player'
                ? `${formatKsh(Math.round(wager * multiplier))} added to your wallet`
                : `${formatKsh(wager)} stake lost`}
            </p>
          )}
          <button
            onClick={playAgain}
            className="rounded-xl bg-signal-amber text-ink-950 font-semibold py-3 px-8 text-md hover:brightness-110 transition"
          >
            Duel again
          </button>
        </div>
      )}
    </div>
  )
}
