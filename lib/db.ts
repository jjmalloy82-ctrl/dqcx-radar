import "server-only";

import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { applyScoring } from "./scoring";
import { seedProjects } from "./seed";
import type { Project, ProjectFilters, ProjectInput } from "./types";

type ProjectRow = {
  project_id: string;
  name: string;
  region: string;
  score_band: string;
  status: string;
  project_type: string;
  record_kind: string;
  opportunity_score: number;
  updated_at: string;
  data: string;
};

const globalForDb = globalThis as unknown as {
  dqcxSqlite?: Database.Database;
};

function dbPath() {
  return path.join(process.cwd(), "data", "radar.sqlite");
}

function openDb(): Database.Database {
  if (globalForDb.dqcxSqlite) return globalForDb.dqcxSqlite;
  fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
  const db = new Database(dbPath());
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      project_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      region TEXT NOT NULL,
      score_band TEXT NOT NULL,
      status TEXT NOT NULL,
      project_type TEXT NOT NULL,
      record_kind TEXT NOT NULL,
      opportunity_score INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      data TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_projects_band ON projects(score_band);
    CREATE INDEX IF NOT EXISTS idx_projects_region ON projects(region);
  `);
  const row = db.prepare("SELECT COUNT(*) AS c FROM projects").get() as { c: number };
  if (row.c === 0) insertAll(db, seedProjects());
  globalForDb.dqcxSqlite = db;
  return db;
}

function insertAll(db: Database.Database, projects: Project[]) {
  const stmt = db.prepare(`
    INSERT INTO projects (
      project_id, name, region, score_band, status, project_type,
      record_kind, opportunity_score, updated_at, data
    ) VALUES (
      @project_id, @name, @region, @score_band, @status, @project_type,
      @record_kind, @opportunity_score, @updated_at, @data
    )
  `);
  const tx = db.transaction((rows: Project[]) => {
    for (const p of rows) stmt.run(toRow(p));
  });
  tx(projects);
}

function toRow(p: Project) {
  return {
    project_id: p.project_id,
    name: p.name,
    region: p.region,
    score_band: p.score_band,
    status: p.status,
    project_type: p.project_type,
    record_kind: p.record_kind,
    opportunity_score: p.opportunity_score,
    updated_at: p.updated_at,
    data: JSON.stringify(p),
  };
}

function fromRow(row: ProjectRow): Project {
  return JSON.parse(row.data) as Project;
}

export function listProjects(filters: ProjectFilters = {}): Project[] {
  const db = openDb();
  const clauses: string[] = [];
  const params: Record<string, string> = {};
  if (filters.region) {
    clauses.push("region = @region");
    params.region = filters.region;
  }
  if (filters.band) {
    clauses.push("score_band = @band");
    params.band = filters.band;
  }
  if (filters.status) {
    clauses.push("status = @status");
    params.status = filters.status;
  }
  if (filters.project_type) {
    clauses.push("project_type = @project_type");
    params.project_type = filters.project_type;
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT * FROM projects ${where} ORDER BY opportunity_score DESC, name ASC`,
    )
    .all(params) as ProjectRow[];
  let projects = rows.map(fromRow);
  const q = filters.q?.trim().toLowerCase();
  if (q) {
    projects = projects.filter((p) => {
      const blob = [
        p.name,
        p.dq_number,
        p.city,
        p.state,
        p.campus,
        p.bd_owner_internal,
        p.owner,
        p.gc,
        ...p.aliases,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }
  return projects;
}

export function getProject(id: string): Project | null {
  const db = openDb();
  const row = db
    .prepare("SELECT * FROM projects WHERE project_id = ?")
    .get(id) as ProjectRow | undefined;
  return row ? fromRow(row) : null;
}

export function upsertProject(input: ProjectInput): Project {
  const db = openDb();
  const existing = input.project_id ? getProject(input.project_id) : null;
  const scored = applyScoring({
    ...input,
    created_at: existing?.created_at,
  });
  db.prepare(
    `
    INSERT INTO projects (
      project_id, name, region, score_band, status, project_type,
      record_kind, opportunity_score, updated_at, data
    ) VALUES (
      @project_id, @name, @region, @score_band, @status, @project_type,
      @record_kind, @opportunity_score, @updated_at, @data
    )
    ON CONFLICT(project_id) DO UPDATE SET
      name = excluded.name,
      region = excluded.region,
      score_band = excluded.score_band,
      status = excluded.status,
      project_type = excluded.project_type,
      record_kind = excluded.record_kind,
      opportunity_score = excluded.opportunity_score,
      updated_at = excluded.updated_at,
      data = excluded.data
  `,
  ).run(toRow(scored));
  return scored;
}

export function deleteProject(id: string) {
  const db = openDb();
  db.prepare("DELETE FROM projects WHERE project_id = ?").run(id);
}

export function resetDemoData(): number {
  const db = openDb();
  db.exec("DELETE FROM projects");
  const seeded = seedProjects();
  insertAll(db, seeded);
  return seeded.length;
}

export function countProjects(): number {
  const db = openDb();
  const row = db.prepare("SELECT COUNT(*) AS c FROM projects").get() as { c: number };
  return row.c;
}
