# Deployment — the online prototype

The prototype is a plain Next.js app with no backend and no environment variables, so it runs on
Vercel as is. Mock data lives in each visitor's browser (`localStorage`); visitors don't see each
other's changes.

## Setup (once, by a Vercel account owner)

1. Vercel → **Add New… → Project** → import `ProductPope/rentino-panel` (install the Vercel GitHub
   app for the repo if asked).
2. Framework preset: **Next.js** (detected). Build and install commands: leave the defaults — Vercel
   uses pnpm from `pnpm-lock.yaml` and the version in `packageManager`; Node from `engines` (≥ 22).
3. No environment variables.
4. Deploy. Production follows `main`; every PR gets a **preview deployment** with its own URL, posted
   on the PR by the Vercel bot.
5. Put the production URL in the [README](../README.md) ("Online prototype").

## What's in the repo for it

- `vercel.json` — `X-Robots-Tag: noindex` on every response, so the prototype isn't indexed by
  search engines.
- Nothing else: no build step changes, no secrets.

## Notes

- **Access**: Vercel protects preview deployments (team sign-in) by default; the production URL is
  public unless _Deployment Protection_ is turned on for it too. It's a prototype on demo data, but
  decide who should see it.
- **Plan**: Vercel's Hobby plan is for non-commercial use; a team or commercial project needs Pro.
- **CI minutes**: Vercel builds run on Vercel, not in GitHub Actions — they don't use the Actions
  minutes described in [.github/CI.md](../.github/CI.md).
- **Links to share**: any state can be linked directly, e.g. `/welcome?mock=draft-ready`,
  `/settings/discount-codes?mock=empty`. See [Mock data](./mock-data.md).
