# Versionly E2E consumer (`Testproject`)

Dedicated **consumer** app (not part of the Versionly monorepo) used to test Versionly end-to-end:

1. Real usage of **Stripe**, **OpenAI**, and **Twilio** SDKs  
2. Push to its **own GitHub repo**  
3. Connect that repo in Versionly (GitHub App)  
4. Register vendors + run scans via **`@wowsql/sma`**  
5. Verify Versionly detects API drift and opens **auto-fix PRs** (when applicable)

This folder has its **own git history**. It is gitignored from `WoWApis`.

## Quick start

```bash
cd Testproject
cp .env.example .env
npm install
npm run dev
# http://127.0.0.1:4090/health
```

Dry-run is **on by default** (`DRY_RUN` unset) — vendor calls return fake payloads unless you set real keys and `DRY_RUN=false`.

### Smoke the HTTP surface

```bash
curl -s http://127.0.0.1:4090/health | jq
curl -s -X POST http://127.0.0.1:4090/payments/checkout \
  -H 'content-type: application/json' \
  -d '{"email":"test@example.com","amountCents":2500}' | jq
curl -s -X POST http://127.0.0.1:4090/ai/chat \
  -H 'content-type: application/json' \
  -d '{"prompt":"ping"}' | jq
curl -s -X POST http://127.0.0.1:4090/sms/send \
  -H 'content-type: application/json' \
  -d '{"to":"+15555550123","body":"hi"}' | jq
```

## GitHub repo (required for Versionly)

```bash
cd Testproject
git remote add origin git@github.com:<YOU>/versionly-e2e-consumer.git
# or: gh repo create versionly-e2e-consumer --private --source=. --push

git push -u origin main
```

Set in `.env`:

```env
GITHUB_OWNER=<YOU>
GITHUB_REPO=versionly-e2e-consumer
SMA_API_KEY=sma_live_...
SMA_BASE_URL=https://api.versionly.dev
# local Versionly API while developing the product:
# SMA_BASE_URL=http://127.0.0.1:8080
```

## Connect into Versionly (E2E checklist)

| Step | Action |
|------|--------|
| 1 | Login [app.versionly.dev](https://app.versionly.dev) — active plan |
| 2 | Install **Versionly GitHub App** on `versionly-e2e-consumer` |
| 3 | Dashboard → create **API key** → put in `.env` as `SMA_API_KEY` |
| 4 | `npm run versionly:setup` — registers Stripe / OpenAI / Twilio + this repo |
| 5 | `npm run versionly:scan` — scan with `autoFix: true` |
| 6 | Check GitHub for PRs / Versionly Findings UI |

SDK-only path (same as dashboard connect):

```bash
npm run versionly:setup
npm run versionly:scan
AUTO_FIX=false npm run versionly:scan   # detect only
```

## What Versionly should see

| Vendor | Code | Spec registered in setup |
|--------|------|---------------------------|
| Stripe | `src/clients/stripe.ts` | stripe/openapi `spec3.json` |
| OpenAI | `src/clients/openai.ts` | openai-openapi |
| Twilio | `src/clients/twilio.ts` | twilio-oai |

Import hints: `stripe`, `openai`, `twilio`.

## Layout

```
src/
  clients/     stripe · openai · twilio
  routes/      HTTP wrappers
  index.ts     Express app :4090
scripts/
  versionly-setup.ts
  versionly-scan.ts
```

## Senior test notes

- Prefer **`SMA_API_URL` / loopback** only inside the Versionly dashboard app; this consumer talks to Versionly via `SMA_BASE_URL`.
- If scan finds nothing: specs may match pinned SDK usage — still validates the pipeline (connect → register → scan → empty findings).
- To force more interesting diffs later: pin older Stripe `apiVersion`, older OpenAI models, or remove fields Versionly flags as required.
- Keep secrets out of git (`.env` is ignored).
