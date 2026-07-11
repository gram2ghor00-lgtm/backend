# Gram2Ghor Backend — Deployment & Ops Notes

> Last updated: 2026-07-12 (after the July 11 outage was fixed)

## Architecture

| Piece | Where | Notes |
|---|---|---|
| Frontend (Next.js) | **Vercel** | `www.gram2ghor.com` — DNS stays on registrar nameservers (`dns1/dns2.registrar-servers.com`). Do **NOT** switch nameservers to ProCloudify; it would break the Vercel frontend. |
| Backend (this repo) | **ProCloudify cPanel** | `api.gram2ghor.com` → server `49.12.82.48` (`server.procloudify.com`) |
| Database | **MongoDB Atlas** | `cluster0.doi0cdw.mongodb.net` (M0, AWS Mumbai). Network Access allows `0.0.0.0/0`. |
| Images | Cloudinary | |
| Email | Brevo SMTP | |

## cPanel Node.js app settings

- **Setup Node.js App** (CloudLinux Selector):
  - Application root: `api.gram2ghor.com` (i.e. `/home/gramghor/api.gram2ghor.com`)
  - Application URL: `api.gram2ghor.com`
  - Startup file: `src/server.js`
  - Node: 22.x, mode: Production
- All environment variables from `.env.example` must be entered in the **Environment Variables UI** (not a `.env` file). Secrets are not stored in this repo.
- cPanel **Git Version Control** clones this repo to `/home/gramghor/repositories/backend` — that is **NOT** the app directory. Deploying requires either:
  - "Update from Remote" + **Deploy HEAD Commit** (uses `.cpanel.yml` to copy `src/` + `package.json` into the app dir), or
  - manually copying changed files via File Manager (careful: the Copy dialog's default destination is the *source* folder — change it, or you get "Source and Destination are the Same").
- After any code/env change: **Restart** the app. After changing Node version or recreating the app: **Run NPM Install** first (the venv's `node_modules` starts empty; app-root `node_modules` is a symlink into the venv).

## ProCloudify hosting quirks (learned the hard way)

1. **No SSH** — shell access is disabled for this account ("Shell access is not enabled"). Use File Manager / Node.js Selector UI.
2. **Imunify360 bot-protection** blocks automation (headless browsers, curl to cPanel API). Only a real, interactively-verified browser session works.
3. **Outbound ports are firewalled (CSF `TCP_OUT`)** — outbound TCP `27017` (MongoDB Atlas) was blocked by default (`ECONNREFUSED`). Support opened it on request (ticket, 2026-07-11). If a new outbound port is ever needed (different DB, external API on a custom port), expect to ask support again.
4. To debug networking without SSH: drop a small script in the app root, add it to `package.json` `scripts`, and use Node.js Selector → **Run JS script** (remember: repo is ESM — `"type": "module"` — so use `import`, not `require`).

## The July 2026 outage — root causes & fixes

Symptom: `www.gram2ghor.com` loaded but all products/banners were blank; every `api.gram2ghor.com` request hung ~20s then timed out — even `/`.

**Root cause 1 (code):** `server.js` gated `app.listen()` behind `connectDB()`:
```js
connectDB().then(() => app.listen(PORT))   // BUG — never listens if DB unreachable
```
Under Passenger/LiteSpeed, if the app never calls `listen()`, every request hangs. Fixed in commit `150ce98`: `app.listen()` runs immediately; `initDB()` retries Mongo in the background (5×, 5s); `connectDB.js` uses `serverSelectionTimeoutMS: 10000` and throws instead of `process.exit(1)`.

**Root cause 2 (network):** the server firewall blocked outbound `27017`, so Mongoose could never reach Atlas (`ECONNREFUSED` on all three shards → "Operation ... buffering timed out after 10000ms"). Fixed by ProCloudify support allowing outbound TCP 27017.

**Recovery gotcha:** after Mongo becomes reachable again, the app still needs one **Restart** — the retry loop gives up after 5 attempts and Mongoose won't establish a first connection on its own.

## Quick health checks

```bash
# App alive (no DB needed) — should be instant 200:
curl -m 10 https://api.gram2ghor.com/

# DB path working — should return category JSON:
curl -m 15 https://api.gram2ghor.com/api/client/category/get-all-category
```

If `/` hangs → app isn't listening (crashed at boot / venv broken / wrong startup file).
If `/` is fine but DB routes 500 with "buffering timed out" → Mongo unreachable (check outbound 27017, Atlas status, `MONGODB_URI`).
Logs: `/home/gramghor/api.gram2ghor.com/stderr.log`.
