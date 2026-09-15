import type { Confidence, ScoreBand, Status } from "./types";
import { BAND_LABELS, STATUS_LABELS } from "./types";

export function formatUsd(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function formatMw(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value} MW`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  if (/^\d{4}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().slice(0, 10);
}

export function locationLine(p: {
  city: string | null;
  state: string | null;
  country: string | null;
}): string {
  const bits = [p.city, p.state, p.country === "US" || p.country === "USA" ? null : p.country]
    .filter(Boolean);
  return bits.join(", ") || "—";
}

export function bandClass(band: ScoreBand): string {
  switch (band) {
    case "pursuit_now":
      return "bg-cyan-400/15 text-cyan-300 ring-cyan-400/40";
    case "develop":
      return "bg-sky-400/10 text-sky-300 ring-sky-400/30";
    case "monitor":
      return "bg-amber-400/10 text-amber-300 ring-amber-400/30";
    default:
      return "bg-slate-500/10 text-slate-400 ring-slate-500/30";
  }
}

export function confidenceClass(c: Confidence): string {
  switch (c) {
    case "confirmed":
      return "text-cyan-300/90 ring-cyan-400/30";
    case "inferred":
      return "text-amber-300/90 ring-amber-400/30";
    default:
      return "text-slate-500 ring-slate-600/40";
  }
}

export function statusLabel(s: Status): string {
  return STATUS_LABELS[s];
}

export function bandLabel(b: ScoreBand): string {
  return BAND_LABELS[b];
}
