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

Live records do **not** invent MW / COD / EPC / dollars. Seed lives in `data/projects.json` and is re-scored by `lib/scoring.ts` on ingest.

The listen workspace’s 104-row board dump did not arrive in this GitHub checkout. This seed is only what is sourced here:

1. **CleanSpark Sandersville** — 175 MW critical IT (owner PR 2026-07-14), deliveries Q4 2027, GC/CxA unknown. Hunt brief: 78 develop.
2. **Beale Luckett Road Marana** — construction window Q1/Q2 2027, TEP/Trico, air-cooled, 550 MW lower bound, GC/CxA open. From post-race BD / Day 3 cards (Beale hunt file was not on Drive). Hunt line: 78 develop.
3. **Vantage Frontier Abilene** — 1.4 GW campus (owner PR), TABS TX3 complete 2027-11-12, liquid cool, Kiewit design, IT MW / tenant / GC unknown. Hunt brief: 78 develop.
4. **STACK DFW02 Lancaster** — TABS2025010772 complete 2027-03-01, DCD campus ~220 MW, Corgan design, GC/Cx unknown. Hunt brief: 71 monitor.
5. **Summit Project Horizon** — Fort Stockton TX, DQ# 260022, award pending September, `value_usd` 645435, BD David Dinh, status keep warm. **monitor**.
6. **ColoShield - NSCALE Cx** — DQ# 260013. **intel_only**. No invented September revenue.
7. Sparse hunt campuses (`record_kind=live`, intel_only, next action *Enrich from primary source*): Oulu, Goodnight, Columbiana, SMX01, CloudBurst TX, Hyperion Richland Parish, Tembo Cheyenne, Clydesdale Owasso.
8. **North Texas AI Campus** — `record_kind=example`. A full enriched template with NEED tags. **Not a real pursuit.**

Drop a replacement `data/projects.json` (array or `{ "projects": [...] }`) and reset the board to ingest a later listen dump. Do not hand-edit scores in the JSON — the function owns the number.

## Screens

- `/` — product one-pager vs news aggregators; CTA into `/app`
- `/app` — Radar list with region, score band, status, project type filters; develop-first sort; Export CSV
- `/app/projects/[id]` — who / what / when, L0–L6 timeline, score breakdown, next action, sources
- `/app/projects/new` and `.../edit` — add / edit
- `/app/alerts` — pursuit window now / next 90 days
- `/app/export` — CSV of the current filtered list
