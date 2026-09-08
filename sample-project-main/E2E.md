# Versionly E2E — what the error means & how to finish the test

## What that error was

```
GitHub blocked reading your-github-org-or-user/versionly-e2e-consumer:
the Versionly App cannot read this repository yet…
```

Two separate problems:

1. **Wrong repo in `.env`** — still `your-github-org-or-user/versionly-e2e-consumer`.  
   Your real remote is **`WoWSQL/sample-project`**. Fixed in `.env`.

2. **GitHub App not allowed on that repo** — Versionly’s App needs **Contents: Read and write** and **Pull requests: Read and write**, and must be **installed** on `WoWSQL/sample-project`.

Without (2), scans cannot clone/read code or open fix PRs → HTTP 500.

---

## Do this in order (senior E2E)

### A. GitHub App permissions (one-time, App owner account)

1. Open [GitHub Apps](https://github.com/settings/apps) → **Versionly**  
   (or org: `https://github.com/organizations/WoWSQL/settings/apps`)
2. **Permissions & events** → Repository permissions:
   - **Contents** → Read and write  
   - **Pull requests** → Read and write  
   - (optional) **Metadata** → Read-only  
3. **Save**
4. Open [Installations](https://github.com/settings/installations) → **Versionly** → **Accept new permissions**
5. Ensure installation includes **`WoWSQL/sample-project`**  
   (All repos, or select that repo)

### B. Install App from Versionly dashboard

1. Login [app.versionly.dev](https://app.versionly.dev)
2. Connect GitHub / Install App on **`WoWSQL/sample-project`**
3. Confirm API key in `.env` (`SMA_API_KEY`) — already set

### C. Re-register the **correct** repo + vendors

```bash
cd D:\Project\wowapis\Testproject
# .env must say:
#   GITHUB_OWNER=WoWSQL
#   GITHUB_REPO=sample-project

npm run versionly:setup
npm run versionly:scan
```

Expect: scan completes (findings may be 0 on first clean SDK usage — that’s OK).

### D. Prove auto-detect + auto-fix PR

1. Wire legacy call sites (intentional drift):

```ts
// e.g. in src/routes/payments.ts — add a route that calls legacyStripeCharge
import { legacyStripeCharge } from "../clients/legacy-for-e2e.js";
```

   Or copy patterns from `src/clients/legacy-for-e2e.ts` into the main clients, commit, push.

2. Push to GitHub:

```bash
git add -A
git commit -m "chore(e2e): add legacy Stripe/OpenAI/Twilio call sites for Versionly"
git push origin main
```

3. Scan with autofix:

```bash
npm run versionly:scan
# or AUTO_FIX=false npm run versionly:scan   # detect only
```

4. Check:
   - Versionly **Findings** UI  
   - GitHub **Pull requests** on `WoWSQL/sample-project` (branch from Versionly)

### E. Vendor checklist

| Vendor | Spec registered in `versionly:setup` | Code |
|--------|--------------------------------------|------|
| Stripe | stripe openapi | `src/clients/stripe.ts` (+ legacy) |
| OpenAI | openai-openapi | `src/clients/openai.ts` (+ legacy) |
| Twilio | twilio-oai | `src/clients/twilio.ts` (+ legacy) |

If setup printed `✓ stripe / openai / twilio`, vendor registration worked.  
Detection only works after GitHub can **read** the repo (step A–B).

---

## Quick verify App can see the repo

After install + permissions:

```bash
npm run versionly:scan
```

- Still “cannot read this repository” → App not on `sample-project` or permissions not accepted  
- `Repo … not registered` → run `versionly:setup` again with fixed `.env`  
- Findings / PRs → pipeline is working
