# Two Brains, One Puzzle — v0.1

This is the first real build of the game.

## What works

- Create a 6-character room
- Join with the room code
- Supabase Realtime presence
- Two-player detection
- Mobile-first lobby
- Copy room code
- Leave room
- Vercel-ready Vite project

## Next build

- WebRTC voice
- Mic permissions
- Signaling over Supabase Realtime
- Ready state
- Server-authoritative puzzle state
- Asymmetric puzzle
- 90-second timer
- Answer validation
- Win/fail/replay

## Local setup

1. Install Node.js.
2. Copy `.env.example` to `.env`.
3. Add your Supabase URL and publishable key.
4. Run:

```bash
npm install
npm run dev
```

5. Open the local URL on two devices.

## Vercel

Push the project to GitHub and import it into Vercel.

Add these environment variables in Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Do not put a Supabase service-role key in the frontend.
