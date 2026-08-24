# GlobalSims — web client

Vite + React + TypeScript + Tailwind v4, talking directly to your
Supabase project (auth, tables via RLS, and the edge functions from
the backend package: `start_game`, `submit_move`, `initiate_deposit`,
`request_withdrawal`).

## Setup

```
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

Build for production with `npm run build` — outputs to `dist/`,
deployable to Vercel, Netlify, or any static host.

## Pages

- `/` — sign up (creates a `profiles` row with a unique username;
  the `wallets` row is auto-created by the database trigger) or log in
- `/play` — pick a stake package, get matched (currently always the
  bot), play best-of-3 rounds through the sealed-vault duel UI
- `/wallet` — balance, M-Pesa deposit (STK push via `initiate_deposit`),
  withdrawal request (via `request_withdrawal`, paid out manually by you)

## How the duel UI stays honest

The "sealed vault" component isn't just visual flair — it mirrors what
the server is actually doing. Your move locks the moment you tap it
(`roundPhase: 'sealed'`) and the request to `submit_move` only fires
after that. The bot's move is generated server-side, after your move
is already committed to the database row — the client only learns it
from the function's response, at the same moment you do. There's no
state in this app that lets a player see the bot's move early.

## Known gaps / next steps

- No password reset flow yet (Supabase Auth supports it — just needs
  a page)
- Deposit status is polled client-side after initiating (`Wallet.tsx`)
  rather than pushed via Supabase Realtime — works fine, but Realtime
  on the `wallets` table would feel snappier
- Matchmaking always resolves to the bot; `matchmaking_queue` in the
  backend is unused by this UI so far
