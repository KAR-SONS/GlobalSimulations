import type { Move } from '../lib/types'

const MOVES: { move: Move; glyph: string; label: string }[] = [
  { move: 'rock', glyph: '🪨', label: 'Rock' },
  { move: 'paper', glyph: '📄', label: 'Paper' },
  { move: 'scissors', glyph: '✂️', label: 'Scissors' },
]

type Phase = 'choosing' | 'sealed' | 'revealed'

export function MoveChamber({
  phase,
  playerMove,
  botMove,
  roundWinner,
  onChoose,
}: {
  phase: Phase
  playerMove: Move | null
  botMove: Move | null
  roundWinner: 'player' | 'bot' | 'tie' | null
  onChoose: (move: Move) => void
}) {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <VaultSlot
        title="You"
        side="player"
        phase={phase}
        move={playerMove}
        winner={roundWinner}
        onChoose={phase === 'choosing' ? onChoose : undefined}
      />
      <VaultSlot title="Bot" side="bot" phase={phase} move={botMove} winner={roundWinner} />
    </div>
  )
}

function VaultSlot({
  title,
  side,
  phase,
  move,
  winner,
  onChoose,
}: {
  title: string
  side: 'player' | 'bot'
  phase: Phase
  move: Move | null
  winner: 'player' | 'bot' | 'tie' | null
  onChoose?: (move: Move) => void
}) {
  const isWinner = phase === 'revealed' && winner === side
  const isLoser = phase === 'revealed' && winner !== 'tie' && winner !== side && winner !== null

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-6 transition-colors ${
        isWinner
          ? 'border-signal-amber bg-ink-800'
          : isLoser
            ? 'border-ink-700 bg-ink-900 opacity-70'
            : 'border-ink-700 bg-ink-800'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs uppercase tracking-widest text-fog-400 mono">{title}</span>
        {phase === 'sealed' && side === 'player' && move && (
          <span className="text-xs uppercase tracking-widest text-signal-amber mono">Sealed</span>
        )}
        {phase === 'sealed' && side === 'bot' && (
          <span className="text-xs uppercase tracking-widest text-duel-blue mono">Locked</span>
        )}
      </div>

      {onChoose ? (
        <div className="grid grid-cols-3 gap-2">
          {MOVES.map((m) => (
            <button
              key={m.move}
              onClick={() => onChoose(m.move)}
              className="flex flex-col items-center gap-1 rounded-xl border border-ink-700 bg-ink-900 py-4 text-paper-50 hover:border-signal-amber hover:text-signal-amber transition-colors focus-visible:outline-2 focus-visible:outline-duel-blue"
            >
              <span className="text-2xl" aria-hidden>{m.glyph}</span>
              <span className="text-xs">{m.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div
          className={`flex h-24 items-center justify-center rounded-xl border border-dashed border-ink-700 text-3xl ${
            phase === 'sealed' ? 'seal-pulse' : ''
          } ${phase === 'revealed' ? 'vault-open' : ''}`}
        >
          {phase === 'revealed' && move
            ? MOVES.find((m) => m.move === move)?.glyph
            : phase === 'sealed'
              ? '🔒'
              : '·'}
        </div>
      )}

      {phase === 'revealed' && move && (
        <p className="mt-3 text-center text-sm text-fog-400 capitalize">{move}</p>
      )}
    </div>
  )
}
