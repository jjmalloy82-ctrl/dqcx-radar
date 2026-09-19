import { Wordmark } from "@/components/Wordmark";
import { BAND_LABELS, BAND_RANGES, SCORE_WEIGHTS } from "@/lib/types";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="radar-grid radar-scan min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Wordmark />
        <Link
          href="/app"
          className="rounded-sm bg-radar-cyan px-4 py-2 font-mono text-xs uppercase tracking-wider text-radar"
        >
          Open the board
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-8 pt-10 md:pt-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-radar-cyan">
          DataQuestCX · Internal BD
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
          When should we call, and about what.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-radar-muted">
          DQCX Radar is project intelligence for DataQuestCX commissioning
          pursuits. It finds, scores, and times data-center Cx opportunities so
          BD spends the next conversation on a real window — not a press clip.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/app"
            className="rounded-sm bg-radar-cyan px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-radar"
          >
            Enter Radar
          </Link>
          <a
            href="#not-this"
            className="rounded-sm border border-radar-line px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-radar-muted"
          >
            What this is not
          </a>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 py-8 md:grid-cols-3">
        {[
          {
            k: "01",
            t: "Find",
            d: "One master record per campus/building — live hunts stay sparse until a primary source exists.",
          },
          {
            k: "02",
            t: "Score",
            d: "A weighted function (not a gut feel) across MW, schedule fit, geo, award, relationship, sourced $, and sources.",
          },
          {
            k: "03",
            t: "Time",
            d: "The call window is 6–18 months before L3. Daily alerts surface what is open now or in the next 90 days.",
          },
        ].map((card) => (
          <article
            key={card.k}
            className="rounded-md border border-radar-line bg-radar-elev/80 p-5"
          >
            <p className="font-mono text-[11px] text-radar-cyan">{card.k}</p>
            <h2 className="mt-2 text-xl font-semibold">{card.t}</h2>
            <p className="mt-2 text-sm text-radar-muted">{card.d}</p>
          </article>
        ))}
      </section>

      <section id="not-this" className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-md border border-radar-line bg-radar-elev p-6">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-radar-cyan">
              Radar is
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-radar-muted">
              <li>An internal BD board for DataQuestCX.</li>
              <li>A scored pursuit queue with next actions.</li>
              <li>Honest about unknowns — every external fact needs a source.</li>
              <li>Phase 1 of a product. Public articles are phase 2.</li>
            </ul>
          </article>
          <article className="rounded-md border border-radar-line bg-radar-elev p-6">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-radar-warn">
              Radar is not
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-radar-muted">
              <li>A news aggregator or journalism scrape of DC headlines.</li>
              <li>TheJobWalk — different product, different job.</li>
              <li>
                ForgeCX, the job-site Cx ops sibling (different repo). Do not
                rebuild field ops here.
              </li>
              <li>A place to invent MW, COD, EPC, or dollars.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-radar-cyan">
          Scoring bands
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {(Object.keys(BAND_LABELS) as (keyof typeof BAND_LABELS)[]).map((band) => (
            <div
              key={band}
              className="rounded-md border border-radar-line bg-radar-elev p-4"
            >
              <p className="font-mono text-sm text-radar-ink">{BAND_LABELS[band]}</p>
              <p className="mt-1 font-mono text-xs text-radar-cyan">{BAND_RANGES[band]}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-sm text-radar-muted">
          Weights: MW {SCORE_WEIGHTS.mw}, schedule fit {SCORE_WEIGHTS.scheduleFit}{" "}
          (best 6–18 months before L3), geo {SCORE_WEIGHTS.geo}, owner/GC known{" "}
          {SCORE_WEIGHTS.ownerGcKnown}, Cx award {SCORE_WEIGHTS.cxAward}, existing
          relationship {SCORE_WEIGHTS.existingRelationship}, sourced revenue{" "}
          {SCORE_WEIGHTS.revenue}, source quality {SCORE_WEIGHTS.sourceQuality}.
          Unknowns reduce points. Competitor Cx locked −15. Rumor-only caps at
          intel_only.
        </p>
      </section>
    </main>
  );
}
