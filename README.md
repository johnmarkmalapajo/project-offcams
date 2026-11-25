# OffCams: Off-Campus Activity Monitoring

Next.js 15 + shadcn/ui + Tailwind 4 + Mapbox. Students log off-campus trips with daily itineraries and check in with GPS, time and a photo. VPSAS staff see a live map of delegates, ongoing activities, and a breakdown per college and department. XP, levels, streaks, badges and a college leaderboard make check-ins a game.

## Pages
- `/` role picker
- `/student` profile, active trip, itinerary (paste-to-import), check-in (GPS + camera), XP/badges/leaderboard
- `/staff` passcode gate, KPIs, live Mapbox map, live feed, ongoing activities, by college/department, delegates table

## Run locally
```bash
npm install
cp .env.example .env.local   # fill in what you have
npm run dev
npm test                     # itinerary parser test
```

## Modes
- **Demo (no env vars):** sample data in the browser's localStorage. Syncs between tabs only. Good for a walkthrough.
- **Live (Supabase env vars set):** shared database, photo storage and real-time updates. Run `supabase/schema.sql` in your Supabase project first.

## Deploy
**Vercel:** import the repo, add the env vars from `.env.example`, deploy. No other config.
**Netlify:** import the repo, Netlify detects Next.js (`netlify.toml` included), add the same env vars, deploy.

GPS and camera need HTTPS, which both hosts provide.

## Before real use
- Replace the shared staff passcode and open Supabase policies with Supabase Auth accounts.
- Replace the placeholder college/department list in `src/lib/colleges.ts`.
