import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatKsh } from '../lib/types'

type DepositRequest = {
  id: string
  reference: string
  amount: number
  status: 'pending' | 'success' | 'failed'
  created_at: string
}

type WithdrawalRequest = {
  id: string
  amount: number
  status: 'pending' | 'paid' | 'rejected'
  created_at: string
}

const DEPOSIT_PRESETS = [2000, 5000, 10000, 25000] // cents

export function Wallet({
  balance,
  refreshBalance,
}: {
  balance: number | null
  refreshBalance: () => void
}) {
  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit')

  const [depositAmount, setDepositAmount] = useState(DEPOSIT_PRESETS[0])
  const [depositStatus, setDepositStatus] = useState<string | null>(null)
  const [depositLoading, setDepositLoading] = useState(false)

  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawPhone, setWithdrawPhone] = useState('')
  const [withdrawStatus, setWithdrawStatus] = useState<string | null>(null)
  const [withdrawLoading, setWithdrawLoading] = useState(false)

  const [deposits, setDeposits] = useState<DepositRequest[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])

  async function loadHistory() {
    const { data: dep } = await supabase
      .from('deposit_requests')
      .select('id, reference, amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    setDeposits(dep ?? [])

    const { data: wd } = await supabase
      .from('withdrawal_requests')
      .select('id, amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    setWithdrawals(wd ?? [])
  }

  useEffect(() => {
    loadHistory()
  }, [])

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault()
    setDepositStatus(null)
    setDepositLoading(true)

    const { data, error } = await supabase.functions.invoke('initiate_deposit', {
      body: {
        amount: depositAmount,
        callback_url: `${window.location.origin}/wallet`,
      },
    })

    if (error || data?.error) {
      setDepositLoading(false)
      setDepositStatus(data?.error ?? 'Could not start the deposit — try again')
      return
    }

    // Full-page redirect to Paystack's hosted checkout. The wallet is
    // only ever credited by the webhook once payment actually
    // completes — this redirect just gets the user to that page.
    window.location.href = data.authorization_url
  }

  // If we've just been redirected back from Paystack's checkout page,
  // poll a few times so the balance updates without a manual refresh
  // while the webhook catches up.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('trxref') || params.get('reference')) {
      pollForDepositResult()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Simple client-side poll so the balance updates without a manual
  // refresh once the user completes the STK prompt. The webhook is
  // what actually credits the wallet — this just re-checks the UI.
  function pollForDepositResult() {
    let attempts = 0
    const interval = setInterval(async () => {
      attempts += 1
      await loadHistory()
      refreshBalance()
      if (attempts >= 10) clearInterval(interval) // ~40s of polling
    }, 4000)
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    setWithdrawStatus(null)
    setWithdrawLoading(true)

    const amountCents = Math.round(parseFloat(withdrawAmount) * 100)
    if (!amountCents || amountCents <= 0) {
      setWithdrawStatus('Enter a valid amount')
      setWithdrawLoading(false)
      return
    }

    const { data, error } = await supabase.functions.invoke('request_withdrawal', {
      body: { amount: amountCents, phone: withdrawPhone },
    })

    setWithdrawLoading(false)

    if (error || data?.error) {
      setWithdrawStatus(data?.error ?? 'Could not submit the withdrawal — try again')
      return
    }

    setWithdrawStatus(data.message ?? 'Withdrawal request received')
    setWithdrawAmount('')
    refreshBalance()
    loadHistory()
  }

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6 py-10 fade-up">
      <p className="text-xs uppercase tracking-widest text-fog-400 mono mb-1">Balance</p>
      <h1 className="display text-4xl font-bold mb-8 mono">
        {balance !== null ? formatKsh(balance) : '—'}
      </h1>

      <div className="flex rounded-xl border border-ink-700 p-1 mb-6">
        <button
          onClick={() => setTab('deposit')}
          className={`flex-1 rounded-lg py-2 text-sm transition-colors ${
            tab === 'deposit' ? 'bg-ink-800 text-signal-amber' : 'text-fog-400'
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setTab('withdraw')}
          className={`flex-1 rounded-lg py-2 text-sm transition-colors ${
            tab === 'withdraw' ? 'bg-ink-800 text-signal-amber' : 'text-fog-400'
          }`}
        >
          Withdraw
        </button>
      </div>

      {tab === 'deposit' && (
        <form onSubmit={handleDeposit} className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {DEPOSIT_PRESETS.map((amt) => (
              <button
                type="button"
                key={amt}
                onClick={() => setDepositAmount(amt)}
                className={`rounded-xl border py-3 text-sm mono transition-colors ${
                  depositAmount === amt
                    ? 'border-signal-amber bg-ink-800 text-signal-amber'
                    : 'border-ink-700 bg-ink-900 text-fog-400'
                }`}
              >
                {formatKsh(amt)}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={depositLoading}
            className="w-full rounded-xl bg-signal-amber text-ink-950 font-semibold py-3 text-sm hover:brightness-110 transition disabled:opacity-50"
          >
            {depositLoading ? 'Sending prompt…' : `Deposit ${formatKsh(depositAmount)}`}
          </button>

          {depositStatus && <p className="text-sm text-duel-blue">{depositStatus}</p>}
        </form>
      )}

      {tab === 'withdraw' && (
        <form onSubmit={handleWithdraw} className="space-y-4">
          <input
            type="number"
            step="0.01"
            min="100"
            placeholder="Amount in Ksh"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            required
            className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-sm placeholder:text-fog-600 focus-visible:outline-2 focus-visible:outline-duel-blue"
          />
          <input
            type="tel"
            placeholder="M-Pesa phone number to receive payout"
            value={withdrawPhone}
            onChange={(e) => setWithdrawPhone(e.target.value)}
            required
            className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-sm placeholder:text-fog-600 focus-visible:outline-2 focus-visible:outline-duel-blue"
          />

          <button
            type="submit"
            disabled={withdrawLoading}
            className="w-full rounded-xl bg-signal-amber text-ink-950 font-semibold py-3 text-sm hover:brightness-110 transition disabled:opacity-50"
          >
            {withdrawLoading ? 'Submitting…' : 'Request withdrawal'}
          </button>

          {withdrawStatus && <p className="text-sm text-duel-blue">{withdrawStatus}</p>}
          <p className="text-xs text-fog-600">
            Withdrawals are paid out by hand — allow some time after requesting.
          </p>
        </form>
      )}

      {(deposits.length > 0 || withdrawals.length > 0) && (
        <div className="mt-10">
          <p className="text-xs uppercase tracking-widest text-fog-400 mono mb-3">
            Recent activity
          </p>
          <div className="space-y-2">
            {tab === 'deposit'
              ? deposits.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-sm"
                  >
                    <span className="mono">{formatKsh(d.amount)}</span>
                    <StatusBadge status={d.status} />
                  </div>
                ))
              : withdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-sm"
                  >
                    <span className="mono">{formatKsh(w.amount)}</span>
                    <StatusBadge status={w.status} />
                  </div>
                ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'success' || status === 'paid'
      ? 'text-signal-amber'
      : status === 'failed' || status === 'rejected'
        ? 'text-loss-red'
        : 'text-duel-blue'
  return <span className={`text-xs uppercase tracking-widest mono ${color}`}>{status}</span>
}