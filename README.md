# DQCX Radar

DataQuestCX project intelligence. **When should we call, and about what.**

Radar is an internal BD board for DataQuestCX commissioning pursuits. It finds, scores, and times data-center Cx opportunities so the next conversation is about a real window — not a headline.

Public articles are phase 2. v1 is the single-tenant pursuit board in this repo.

## What Radar is

- A master project record per campus / building, with confidence on every field
- A **function** that scores 0–100 (not magic numbers in the UI)
- A call-timing layer: best fit is **6–18 months before L3**
- Daily alerts for pursuit windows that are open now or start in the next 90 days

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

Stack: Next.js App Router, TypeScript, Tailwind, SQLite via `better-sqlite3`. Single-tenant, no auth. The database file is created at `data/radar.sqlite` on first boot and seeded if empty. **Reset demo data** from the board header restores the seed.

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
| Develop | 75–89 | Build the pursuit |
| Monitor | 50–74 | Keep warm; still holes in the record |
| Intel only | <50 | Do not staff; enrich from a primary source |

## Seed (honest)

Live records do **not** invent MW / COD / EPC / dollars:

1. **Summit Project Horizon** — Fort Stockton TX, DQ# 260022, award pending September, `value_usd` 645435, BD David Dinh, status keep warm. Scores conservatively in **monitor**.
2. **ColoShield - NSCALE Cx** — DQ# 260013. **intel_only**. No invented September revenue.
3. Sparse hunt campuses (`record_kind=live`, intel_only, next action *Enrich from primary source*): Oulu, Goodnight, Columbiana, SMX01, CloudBurst TX, Hyperion Richland Parish, Tembo Cheyenne, Clydesdale Owasso. Location tokens come from the name only.
4. **North Texas AI Campus** — `record_kind=example`. A full enriched template with NEED tags. **Not a real pursuit.**

## Screens

- `/` — product one-pager vs news aggregators; CTA into `/app`
- `/app` — Radar list with region, score band, status, project type filters
- `/app/projects/[id]` — who / what / when, L0–L6 timeline, score breakdown, next action, sources
- `/app/projects/new` and `.../edit` — add / edit
- `/app/alerts` — pursuit window now / next 90 days
