# DQCX Radar

DataQuestCX project intelligence. **When should we call, and about what.**

Radar is an internal BD board for DataQuestCX commissioning pursuits. It finds, scores, and times data-center Cx opportunities so the next conversation is about a real window — not a headline.

**Post-race (Sep 2026):** the Galaxy race ended Thursday 17 Sep 2026, 6:00 PM PT. DQCX Radar is the ongoing product. The board grows through the weekday listen routine (`dqcx-radar-listen`) — hunt briefs in, scored records out. Public articles remain phase 2. v1 is the single-tenant pursuit board in this repo.

## What Radar is

- A master project record per campus / building, with confidence on every field
- A **function** that scores 0–100 (not magic numbers in the UI)
- A call-timing layer: best fit is **6–18 months before L3**
- Daily alerts for pursuit windows that are open now or start in the next 90 days
- Default `/app` list pins **Develop** (75–89) to the top, then score
- **Export CSV** of the current filtered board

## What Radar is not

- **Not a news site.** Journalism scraping and headline aggregation are out of scope.
- **Not TheJobWalk.** Different product.
- **Not ForgeCX.** ForgeCX is job-site Cx ops in a sibling repo. Do not rebuild field ops here.
- **Not a place to invent facts.** MW, COD, EPC, and dollars stay unknown unless sourced. Every external fact needs a `sources[]` row (`url`, `type`, `date`, `quote`).

## Run

```bash
npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the product one-pager, then **Enter Radar** → `/app`.

Stack: Next.js App Router, TypeScript, Tailwind, SQLite via `better-sqlite3`. Single-tenant, no auth. The database file is created at `data/radar.sqlite` on first boot and seeded from `data/projects.json` if empty or the seed version changed. **Reset demo data** from the board header restores that seed.

## Scoring

Implemented in `lib/scoring.ts`. Weights:

| Factor | Weight |
| --- | --- |
| MW | 20 |
| Schedule fit (best 6–18 months before L3) | 25 |
| Geo | 15 |
| Owner / GC known | 10 |
| Cx award | 10 |
| Existing relationship | 10 |
| Revenue (sourced $ only) | 5 |
| Source quality | 5 |

Unknowns reduce points. Competitor Cx locked is **−15**. Rumor-only / unsourced records are capped at **intel_only**.

### Bands

| Band | Range | Meaning |
| --- | --- | --- |
| Pursuit now | 90–100 | Window is open — call about scoped Cx |
| Develop | 75–89 | Build the pursuit — default `/app` sort pins this band first |
| Monitor | 50–74 | Keep warm; still holes in the record |
| Intel only | <50 | Do not staff; enrich from a primary source |

## Seed (post-race)

Live records do **not** invent MW / COD / EPC / dollars. Seed is the listen board dump in `data/projects.json` (**114 live** + 1 example template, listen 2026-09-18 ~21:50Z). `lib/ingest.ts` maps that flattened pack into the Radar schema. Board scores on first load match the dump (CleanSpark / Beale / Frontier at **78 develop**). `lib/scoring.ts` still owns the number on add/edit.

Develop on this dump (sorts to the top of `/app`):

1. **CleanSpark Sandersville** — 78 develop
2. **Beale Luckett Road Marana** — 78 develop
3. **Vantage Frontier Shackelford** — 78 develop
4. **EXAMPLE — North Texas AI Campus** — 78 develop (`record_kind=example`, not a live pursuit)
5. **Crusoe Abilene 900 MW (Microsoft)** — 75 develop

Latest listen add: **Valara / NorthMark Spartanburg HPC** — 43 intel_only (SCDES air construction permit 2026-09-18; Cx/GC/IT MW unknown). Also on this dump: CoreSite DA1 Irving (62 monitor), Crossroads Spotsylvania, Vantage Lighthouse Port Washington, and the prior hunt board (STACK DFW02, Whitney, PowerHouse Charlotte, Summit DQ# 260022, ColoShield DQ# 260013). Replace `data/projects.json` and reset the board to ingest a later listen dump.

## Screens

- `/` — product one-pager vs news aggregators; CTA into `/app`
- `/app` — Radar list with region, score band, status, project type filters; develop-first sort; Export CSV
- `/app/projects/[id]` — who / what / when, L0–L6 timeline, score breakdown, next action, sources
- `/app/projects/new` and `.../edit` — add / edit
- `/app/alerts` — pursuit window now / next 90 days
- `/app/export` — CSV of the current filtered list
