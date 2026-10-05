#!/usr/bin/env python3
"""Build the DQCX Radar handheld site.

Reads a projects.json board, drops the template record and internal-only
fields, and writes a static site to --out (HTML, CSS, JS, manifest, icons,
service worker, robots.txt, and sanitized board.json).

    python3 mobile/build.py --data /path/projects.json --out /path/dist
"""

from __future__ import annotations

import argparse
import json
import math
import shutil
import struct
import subprocess
import sys
import zlib
from datetime import datetime, timezone
from pathlib import Path

DROP_KEYS = {"bd_owner_internal", "bd_owner", "notes_internal", "template_notice"}
TOKEN = "__DQCX_VERSION__"
SRC = Path(__file__).resolve().parent / "src"

BG = (7, 13, 24)
DISC = (16, 25, 43)
CYAN = (34, 211, 238)
AMBER = (251, 191, 36)


def strip_keys(value):
    if isinstance(value, dict):
        return {key: strip_keys(child) for key, child in value.items() if key not in DROP_KEYS}
    if isinstance(value, list):
        return [strip_keys(child) for child in value]
    return value


def is_public_http(url) -> bool:
    if not isinstance(url, str):
        return False
    trimmed = url.strip()
    if any(char in trimmed for char in " \t\r\n"):
        return False
    lowered = trimmed.lower()
    return lowered.startswith("https://") or lowered.startswith("http://")


def is_template(project) -> bool:
    if not isinstance(project, dict):
        return True
    notice = project.get("template_notice")
    if notice not in (None, "", False):
        return True
    return project.get("record_kind") == "example"


def empty_value(value) -> bool:
    return value is None or value == "" or value == [] or value == {}


def prune(value):
    if isinstance(value, dict):
        cleaned = {}
        for key, child in value.items():
            pruned = prune(child)
            if empty_value(pruned):
                continue
            cleaned[key] = pruned
        return cleaned
    if isinstance(value, list):
        return [prune(child) for child in value]
    return value


def public_sources(sources) -> tuple[list, int]:
    kept = []
    dropped = 0
    for source in sources or []:
        if not isinstance(source, dict):
            dropped += 1
            continue
        source = strip_keys(source)
        kind = str(source.get("type") or "").strip().lower()
        if kind.startswith("internal"):
            dropped += 1
            continue
        url = source.get("url")
        if not is_public_http(url):
            dropped += 1
            continue
        source["url"] = url.strip()
        blob = json.dumps(source, ensure_ascii=False)
        if "/workspace" in blob or "bd_owner" in blob or "notes_internal" in blob or "template_notice" in blob:
            dropped += 1
            continue
        kept.append(source)
    return kept, dropped


def sanitize_project(raw: dict) -> dict:
    cleaned = strip_keys(raw)
    sources, _dropped = public_sources(cleaned.get("sources"))
    cleaned.pop("sources", None)
    cleaned = prune(cleaned)
    cleaned["sources"] = sources
    return cleaned


def load_board(path: Path) -> dict:
    try:
        text = path.read_text(encoding="utf-8-sig")
        data = json.loads(text)
    except FileNotFoundError:
        raise SystemExit(f"Board file not found: {path}")
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Board file is not valid JSON: {path}: {exc}")
    if isinstance(data, list):
        return {"projects": data}
    if not isinstance(data, dict) or not isinstance(data.get("projects"), list):
        raise SystemExit("Board file must be an object with a projects list")
    return data


def build_projects(data: dict) -> tuple[list, dict]:
    stats = {
        "input": 0,
        "templates": 0,
        "invalid": 0,
        "sources_dropped": 0,
        "sources_kept": 0,
    }
    projects = []
    seen = set()
    for raw in data["projects"]:
        stats["input"] += 1
        if is_template(raw):
            stats["templates"] += 1
            continue
        if not isinstance(raw, dict):
            stats["invalid"] += 1
            continue
        project_id = raw.get("project_id")
        name = raw.get("name")
        if not isinstance(project_id, str) or not project_id.strip():
            stats["invalid"] += 1
            continue
        if not isinstance(name, str) or not name.strip():
            stats["invalid"] += 1
            continue
        if project_id in seen:
            stats["invalid"] += 1
            continue
        seen.add(project_id)
        _sources, dropped = public_sources(raw.get("sources"))
        stats["sources_dropped"] += dropped
        project = sanitize_project(raw)
        stats["sources_kept"] += len(project["sources"])
        projects.append(project)

    def sort_key(project):
        score = project.get("opportunity_score")
        if not isinstance(score, (int, float)):
            score = -1
        return (-score, str(project.get("name") or "").lower())

    projects.sort(key=sort_key)
    return projects, stats


def write_board(out: Path, data: dict, projects: list, built_at: str) -> None:
    payload = {
        "product": data.get("product") or "DQCX Radar",
        "version": data.get("version") or "0",
        "updated": data.get("updated"),
        "built_at": built_at,
        "project_count": len(projects),
        "projects": projects,
    }
    # Null updated is still useful as an explicit gap; keep it.
    if payload["updated"] is None:
        payload.pop("updated")
    text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    (out / "board.json").write_text(text + "\n", encoding="utf-8")


def copy_shell(out: Path, version: str) -> None:
    for name in ("index.html", "app.css", "app.js", "manifest.webmanifest", "robots.txt", "sw.js"):
        source = SRC / name
        if not source.is_file():
            raise SystemExit(f"Missing shell file: {source}")
        text = source.read_text(encoding="utf-8")
        if name in ("app.js", "sw.js"):
            if TOKEN not in text:
                raise SystemExit(f"{name} is missing the {TOKEN} placeholder")
            text = text.replace(TOKEN, version)
        (out / name).write_text(text, encoding="utf-8")
    (out / ".nojekyll").write_text("", encoding="utf-8")


def write_png(path: Path, width: int, height: int, rgb: bytes) -> None:
    if len(rgb) != width * height * 3:
        raise SystemExit("PNG buffer size does not match dimensions")

    def chunk(tag: bytes, payload: bytes) -> bytes:
        return struct.pack(">I", len(payload)) + tag + payload + struct.pack(">I", zlib.crc32(tag + payload) & 0xFFFFFFFF)

    raw = b"".join(b"\x00" + rgb[y * width * 3 : (y + 1) * width * 3] for y in range(height))
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    path.write_bytes(png)


class Canvas:
    def __init__(self, size: int, color: tuple[int, int, int]):
        self.size = size
        self.buf = bytearray(color) * (size * size)

    def blend(self, x: int, y: int, color: tuple[int, int, int], alpha: float) -> None:
        if alpha <= 0 or x < 0 or y < 0 or x >= self.size or y >= self.size:
            return
        if alpha > 1:
            alpha = 1
        index = (y * self.size + x) * 3
        keep = 1 - alpha
        self.buf[index] = int(self.buf[index] * keep + color[0] * alpha)
        self.buf[index + 1] = int(self.buf[index + 1] * keep + color[1] * alpha)
        self.buf[index + 2] = int(self.buf[index + 2] * keep + color[2] * alpha)

    def fill_circle(self, cx: float, cy: float, radius: float, color: tuple[int, int, int], alpha: float = 1) -> None:
        x0 = max(0, int(cx - radius - 2))
        x1 = min(self.size - 1, int(cx + radius + 2))
        y0 = max(0, int(cy - radius - 2))
        y1 = min(self.size - 1, int(cy + radius + 2))
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                distance = math.hypot(x + 0.5 - cx, y + 0.5 - cy)
                cover = radius - distance
                if cover >= 0.5:
                    self.blend(x, y, color, alpha)
                elif cover > -0.5:
                    self.blend(x, y, color, alpha * (cover + 0.5))

    def ring(self, cx: float, cy: float, radius: float, width: float, color: tuple[int, int, int], alpha: float) -> None:
        pad = width / 2 + 2
        x0 = max(0, int(cx - radius - pad))
        x1 = min(self.size - 1, int(cx + radius + pad))
        y0 = max(0, int(cy - radius - pad))
        y1 = min(self.size - 1, int(cy + radius + pad))
        half = width / 2
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                distance = abs(math.hypot(x + 0.5 - cx, y + 0.5 - cy) - radius)
                cover = half - distance
                if cover >= 0.5:
                    self.blend(x, y, color, alpha)
                elif cover > -0.5:
                    self.blend(x, y, color, alpha * (cover + 0.5))

    def sector(self, cx: float, cy: float, radius: float, start: float, end: float, color: tuple[int, int, int], alpha: float) -> None:
        x0 = max(0, int(cx - radius - 2))
        x1 = min(self.size - 1, int(cx + radius + 2))
        y0 = max(0, int(cy - radius - 2))
        y1 = min(self.size - 1, int(cy + radius + 2))
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                dx = x + 0.5 - cx
                dy = cy - (y + 0.5)
                distance = math.hypot(dx, dy)
                if distance > radius + 0.5:
                    continue
                angle = math.atan2(dy, dx)
                if angle < start or angle > end:
                    continue
                cover = radius - distance
                if cover >= 0.5:
                    self.blend(x, y, color, alpha)
                elif cover > -0.5:
                    self.blend(x, y, color, alpha * (cover + 0.5))


def render_icon(size: int) -> bytes:
    """Radar mark: dark disc, cyan rings, a sweep, and one amber blip.

    Artwork stays inside the center 80% so the 512 icon can also be maskable.
    """
    canvas = Canvas(size, BG)
    center = (size - 1) / 2
    canvas.fill_circle(center, center, size * 0.40, DISC, 1)
    canvas.ring(center, center, size * 0.16, max(2, size * 0.012), CYAN, 0.45)
    canvas.ring(center, center, size * 0.25, max(2, size * 0.012), CYAN, 0.7)
    canvas.ring(center, center, size * 0.34, max(2, size * 0.014), CYAN, 0.95)
    canvas.sector(center, center, size * 0.34, math.radians(28), math.radians(96), CYAN, 0.28)
    canvas.fill_circle(center, center, max(3, size * 0.035), CYAN, 1)
    angle = math.radians(58)
    blip_r = size * 0.29
    blip_x = center + math.cos(angle) * blip_r
    blip_y = center - math.sin(angle) * blip_r
    canvas.fill_circle(blip_x, blip_y, max(5, size * 0.055), AMBER, 0.35)
    canvas.fill_circle(blip_x, blip_y, max(3, size * 0.032), AMBER, 1)
    return bytes(canvas.buf)


def write_icons(out: Path) -> None:
    folder = out / "icons"
    folder.mkdir(parents=True, exist_ok=True)
    for size, name in ((192, "icon-192.png"), (512, "icon-512.png"), (180, "apple-touch-icon.png")):
        write_png(folder / name, size, size, render_icon(size))


def run_check(out: Path) -> None:
    script = Path(__file__).resolve().parent / "check_dist.py"
    subprocess.run([sys.executable, str(script), "--out", str(out)], check=True)


def build(data_path: Path, out: Path) -> dict:
    if not SRC.is_dir():
        raise SystemExit(f"Missing shell directory: {SRC}")
    data = load_board(data_path)
    projects, stats = build_projects(data)
    now = datetime.now(timezone.utc).replace(microsecond=0)
    built_at = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    version = now.strftime("%Y%m%dT%H%M%SZ")
    if out.exists():
        # Replace the publish folder so a previous raw board cannot linger.
        for child in out.iterdir():
            if child.is_dir():
                shutil.rmtree(child)
            else:
                child.unlink()
    else:
        out.mkdir(parents=True)
    write_board(out, data, projects, built_at)
    copy_shell(out, version)
    write_icons(out)
    stats["projects"] = len(projects)
    stats["bytes"] = (out / "board.json").stat().st_size
    stats["built_at"] = built_at
    return stats


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build the DQCX Radar handheld site from a projects.json board.")
    parser.add_argument("--data", required=True, help="Path to the source projects.json")
    parser.add_argument("--out", required=True, help="Directory to write the static site into")
    args = parser.parse_args(argv)
    data_path = Path(args.data)
    out = Path(args.out)
    stats = build(data_path, out)
    print(
        "Wrote {out} — {projects} campuses "
        "(dropped {templates} template, {invalid} invalid; "
        "public sources {sources_kept}, dropped sources {sources_dropped}; "
        "board.json {bytes} bytes; built {built_at})".format(out=out, **stats)
    )
    run_check(out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
