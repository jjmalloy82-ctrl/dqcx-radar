"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteProject, resetDemoData, upsertProject } from "./db";
import { newProjectDraft } from "./scoring";
import type {
  Confidence,
  CxAwardStatus,
  ProjectInput,
  ProjectType,
  RecordKind,
  Region,
  Relationship,
  ScopeFit,
  Source,
  SourceType,
  Status,
} from "./types";
import { DATE_KEYS, SCOPE_KEYS } from "./types";

function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function bool(v: unknown): boolean | null {
  if (v == null || v === "" || v === "unknown") return null;
  if (v === true || v === "true" || v === "yes") return true;
  if (v === false || v === "false" || v === "no") return false;
  return null;
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  const s = String(v ?? "");
  return (allowed as readonly string[]).includes(s) ? (s as T) : fallback;
}

function promoteIfFilled(
  conf: ProjectInput["field_confidence"],
  key: string,
  filled: boolean,
) {
  if (filled && (!conf[key] || conf[key] === "unknown")) {
    conf[key] = "confirmed";
  }
}

export async function saveProjectAction(raw: ProjectInput): Promise<{ id: string }> {
  if (!raw.name || !raw.name.trim()) {
    throw new Error("Project name is required.");
  }
  const field_confidence = { ...raw.field_confidence };
  promoteIfFilled(field_confidence, "it_mw", raw.it_mw != null);
  promoteIfFilled(field_confidence, "critical_mw", raw.critical_mw != null);
  promoteIfFilled(field_confidence, "value_usd", raw.value_usd != null);
  promoteIfFilled(field_confidence, "owner", Boolean(raw.owner));
  promoteIfFilled(field_confidence, "gc", Boolean(raw.gc));
  promoteIfFilled(field_confidence, "cxa_incumbent", Boolean(raw.cxa_incumbent));
  promoteIfFilled(field_confidence, "dates.L3", Boolean(raw.dates?.L3));
  promoteIfFilled(field_confidence, "utility", Boolean(raw.utility));
  promoteIfFilled(field_confidence, "tab", Boolean(raw.tab));
  const saved = upsertProject({
    ...newProjectDraft(),
    ...raw,
    name: raw.name.trim(),
    aliases: (raw.aliases ?? []).map((a) => a.trim()).filter(Boolean),
    oem_vendors: (raw.oem_vendors ?? []).map((a) => a.trim()).filter(Boolean),
    sources: (raw.sources ?? []).filter((s) => s.quote.trim() || s.url.trim()),
    field_confidence,
  });
  revalidatePath("/app");
  revalidatePath("/app/alerts");
  revalidatePath(`/app/projects/${saved.project_id}`);
  return { id: saved.project_id };
}

export async function deleteProjectAction(projectId: string) {
  deleteProject(projectId);
  revalidatePath("/app");
  revalidatePath("/app/alerts");
  redirect("/app");
}

export async function resetDemoAction() {
  resetDemoData();
  revalidatePath("/app");
  revalidatePath("/app/alerts");
  redirect("/app");
}

/** FormData path used by the project form. */
export async function saveProjectFormAction(formData: FormData) {
  const aliases = String(formData.get("aliases") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const oem = String(formData.get("oem_vendors") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const sourceCount = Number(formData.get("source_count") ?? 0);
  const sources: Source[] = [];
  for (let i = 0; i < sourceCount; i++) {
    const quote = str(formData.get(`source_${i}_quote`)) ?? "";
    const url = str(formData.get(`source_${i}_url`)) ?? "";
    const date = str(formData.get(`source_${i}_date`)) ?? "";
    const type = oneOf(
      formData.get(`source_${i}_type`),
      ["primary", "internal", "secondary", "rumor", "example"] as const,
      "internal",
    ) as SourceType;
    if (!quote && !url) continue;
    sources.push({ quote, url, date, type });
  }

  const dates = Object.fromEntries(
    DATE_KEYS.map((k) => [k, str(formData.get(`date_${k}`))]),
  ) as ProjectInput["dates"];

  const scope_fit = Object.fromEntries(
    SCOPE_KEYS.map((k) => [
      k,
      oneOf(formData.get(`scope_${k}`), ["high", "medium", "low", "unknown"] as const, "unknown"),
    ]),
  ) as ScopeFit;

  const confKeys = [
    "it_mw",
    "critical_mw",
    "value_usd",
    "owner",
    "gc",
    "cxa_incumbent",
    "dates.L3",
    "region",
    "project_type",
    "utility",
    "tab",
  ];
  const field_confidence: ProjectInput["field_confidence"] = {};
  for (const key of confKeys) {
    const v = formData.get(`conf_${key}`);
    if (v) field_confidence[key] = String(v) as Confidence;
  }

  const input: ProjectInput = {
    project_id: str(formData.get("project_id")) ?? "",
    name: str(formData.get("name")) ?? "",
    aliases,
    campus: str(formData.get("campus")),
    building: str(formData.get("building")),
    city: str(formData.get("city")),
    state: str(formData.get("state")),
    country: str(formData.get("country")),
    region: oneOf(
      formData.get("region"),
      ["TX", "VA", "AZ", "GA", "OH", "Carolinas", "Other"] as const,
      "Other",
    ) as Region,
    dq_number: str(formData.get("dq_number")),
    record_kind: oneOf(formData.get("record_kind"), ["live", "example"] as const, "live") as RecordKind,
    project_type: oneOf(
      formData.get("project_type"),
      ["hyperscale", "colo", "AI/HPC", "enterprise", "expansion", "power-for-DC", "unknown"] as const,
      "unknown",
    ) as ProjectType,
    it_mw: num(formData.get("it_mw")),
    critical_mw: num(formData.get("critical_mw")),
    buildings: num(formData.get("buildings")),
    high_density: bool(formData.get("high_density")),
    liquid_cool: bool(formData.get("liquid_cool")),
    value_usd: num(formData.get("value_usd")),
    status: oneOf(
      formData.get("status"),
      ["keep_warm", "active_pursuit", "watching", "awarded", "lost", "on_hold", "unknown"] as const,
      "watching",
    ) as Status,
    owner: str(formData.get("owner")),
    developer: str(formData.get("developer")),
    tenant: str(formData.get("tenant")),
    gc: str(formData.get("gc")),
    mep: str(formData.get("mep")),
    utility: str(formData.get("utility")),
    cxa_incumbent: str(formData.get("cxa_incumbent")),
    tab: str(formData.get("tab")),
    electrical_contractor: str(formData.get("electrical_contractor")),
    mechanical_contractor: str(formData.get("mechanical_contractor")),
    oem_vendors: oem,
    bd_owner_internal: str(formData.get("bd_owner_internal")),
    cx_award_status: oneOf(
      formData.get("cx_award_status"),
      ["open", "pending", "competitor_locked", "dqcx_awarded", "unknown"] as const,
      "unknown",
    ) as CxAwardStatus,
    relationship: oneOf(
      formData.get("relationship"),
      ["existing", "prior", "none", "unknown"] as const,
      "unknown",
    ) as Relationship,
    dates,
    scope_fit,
    next_action: str(formData.get("next_action")) ?? "",
    next_action_due: str(formData.get("next_action_due")),
    sources,
    field_confidence,
    notes: str(formData.get("notes")),
  };

  const { id } = await saveProjectAction(input);
  redirect(`/app/projects/${id}`);
}
