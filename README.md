# Register Locator

A POS360-branded web app for warehouse associates to locate, check in/out, move, and tag
cash registers across a true-to-life floor map. Built with Next.js 16, Tailwind v4,
Drizzle ORM, and Neon Postgres.

## What it does

- **Floor map** — 16 racks in their real positions, colored by how full they are. Tap a rack to open it.
- **Rack detail** — 25 slots per rack (one register each); a separate Pre-Deployment area (up to 30).
- **Check In** — add a register: serial, model (Matsuda / Hanasis / Yunos), role (Primary/Secondary), status (New/Used/Broken), notes, and where to place it.
- **Check Out** — pick a model; the app suggests the **oldest** units first (by the date encoded in the serial) and you send one to Pre-Deployment or out to a store.
- **Totals** — live counts by model × role × status (checked-out units excluded).
- **CSV export** — download the full current state any time.
- **Passcode gate** — one shared team passcode unlocks the app.

---

## Deploy to Vercel + Neon (free, ~5 minutes)

The database schema creates itself automatically on first run — there is **no migration step to run**.

1. **Import the repo into Vercel**
   - Go to https://vercel.com/new and import `DrCigar/bins`.
   - Framework preset: **Next.js** (auto-detected). Click **Deploy** (the first build will succeed even before the database is connected).

2. **Add a free Neon database**
   - In the Vercel project → **Storage** tab → **Create Database** → **Neon** (Postgres) → choose the free plan.
   - Connecting it automatically adds a `DATABASE_URL` environment variable to the project.

3. **Set the team passcode**
   - Vercel project → **Settings → Environment Variables** → add:
     - `APP_PASSCODE` = *(whatever passcode you want the team to type)*
   - Apply it to **Production** (and Preview if you want).

4. **Redeploy**
   - Vercel project → **Deployments** → redeploy the latest, so it picks up `DATABASE_URL` and `APP_PASSCODE`.

5. **Open the app**
   - Visit the deployment URL, enter the passcode, and you're in. The `machines` table is created on the first request.

That's it — no commands to run. Add registers with **Check In**.

---

## Local development (optional)

```bash
npm install
cp .env.local.example .env.local   # then edit values
#   DATABASE_URL  -> a Neon (or any Postgres) connection string
#   APP_PASSCODE  -> any passcode for local use
npm run dev                         # http://localhost:3000
```

Other scripts:

```bash
npm test            # run the unit tests (domain logic + repository)
npm run build       # production build
npm run db:generate # regenerate migration SQL after schema changes
npm run db:migrate  # apply migrations explicitly (optional; app self-creates the table)
```

## Customizing the warehouse layout

Rack letters, positions, orientation, and zones live in
[`lib/layout/warehouse.ts`](lib/layout/warehouse.ts) — edit that file to rename racks
(currently placeholders `A`–`P`) or nudge their positions. No database changes needed.

## Serial number format

Check Out's "oldest first" suggestion reads the date encoded in the serial:
`S36` + `YYMMDD` + sequence (e.g. `S36250423001` → 2025-04-23). The parser lives in
[`lib/domain/serial.ts`](lib/domain/serial.ts); adjust it if the prefix or format differs.
