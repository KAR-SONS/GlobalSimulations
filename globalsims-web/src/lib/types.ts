export type Package = {
  id: string
  label: string
  wager_amount: number // cents
  payout_multiplier: number
  active: boolean
  sort_order: number
}

export type Move = 'rock' | 'paper' | 'scissors'

export type StartGameResponse = {
  game_id: string
  wager_amount: number
  round: number
  error?: string
}

export type SubmitMoveResponse = {
  round_number: number
  player_move: Move
  bot_move: Move
  round_winner: 'player' | 'bot' | 'tie'
  rounds_won_player: number
  rounds_won_bot: number
  game_status: 'in_progress' | 'complete'
  game_winner: 'player' | 'bot' | null
  next_round: number | null
  error?: string
}

export type Wallet = {
  user_id: string
  balance: number // cents
}

export function formatKsh(cents: number): string {
  return `Ksh ${(cents / 100).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
