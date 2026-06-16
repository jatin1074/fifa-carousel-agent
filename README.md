# FIFA 2026 Story Carousel Agent

A standalone web app that generates viral Instagram/YouTube carousel posts about FIFA World Cup 2026 — real photos + story text overlay, in the "timeline" format.

## How it works

This is a real website (Node.js + Express), NOT a Claude artifact — so it has no sandbox restrictions and can freely call external APIs (Claude, Pexels) from its own backend.

- Frontend: single `public/index.html` (vanilla JS, no build step)
- Backend: `server.js` proxies requests to Claude API and Pexels API (keeps your API keys safe server-side, and avoids any CORS/sandbox issues)

## Deploy on Railway

1. Push this folder to a GitHub repo (or use Railway's GitHub import)
2. In Railway, create a new service from that repo
3. Go to the service → **Variables** tab and add:
   - `ANTHROPIC_API_KEY` = your Anthropic API key
   - `PEXELS_API_KEY` = your Pexels API key
4. Railway will auto-detect Node.js and deploy
5. Go to **Settings → Networking → Generate Domain** to get your public URL
6. Open that URL — the app is live!

## Local testing (optional)

```
npm install
ANTHROPIC_API_KEY=sk-ant-... PEXELS_API_KEY=... npm start
```
Then open http://localhost:3000

## Notes

- No database needed — everything is generated on demand
- Each generation calls Claude twice (story + nothing else) and Pexels once per slide
- Images come from Pexels stock photos matched to AI-generated search queries
