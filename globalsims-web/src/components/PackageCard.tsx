import { formatKsh } from '../lib/types'
import type { Package } from '../lib/types'

export function PackageCard({
  pkg,
  selected,
  onSelect,
}: {
  pkg: Package
  selected: boolean
  onSelect: () => void
}) {
  const isFree = pkg.wager_amount === 0
  return (
    <button
      onClick={onSelect}
      className={`text-left rounded-2xl border p-4 transition-colors ${
        selected
          ? 'border-signal-amber bg-ink-800'
          : 'border-ink-700 bg-ink-900 hover:border-fog-600'
      }`}
    >
      <p className="text-xs uppercase tracking-widest text-fog-400 mono mb-1">
        {isFree ? 'No stake' : 'Stake'}
      </p>
      <p className="display text-lg font-semibold">{pkg.label}</p>
      {!isFree && (
        <p className="mono text-sm text-signal-amber mt-1">
          Win {formatKsh(Math.round(pkg.wager_amount * pkg.payout_multiplier))}
        </p>
      )}
    </button>
  )
}
