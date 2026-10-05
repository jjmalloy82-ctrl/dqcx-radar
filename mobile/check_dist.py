#!/usr/bin/env python3
"""Fail if a Radar dist folder still contains internal board data.

    python3 mobile/check_dist.py --out mobile/dist
    python3 mobile/check_dist.py --out mobile/dist --expect 388
"""

from __future__ import annotations

import argparse
import json
import struct
import sys
from pathlib import Path

NEEDLES = (b"bd_owner", b"notes_internal", b"/workspace", b"template_notice", b"listen_note")
DROP_KEYS = {"bd_owner", "bd_owner_internal", "notes_internal", "template_notice"}
TEXT_SUFFIXES = {".html", ".css", ".js", ".webmanifest", ".txt", ".json", ""}


def png_size(data: bytes):
    if len(data) < 24 or data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
        return None
    return struct.unpack(">II", data[16:24])


def check(out: Path, expect: int | None = None) -> list[str]:
    errors = []
    if not out.is_dir():
        return [f"Missing dist directory: {out}"]

    required = [
        "index.html",
        "app.css",
        "app.js",
        "sw.js",
        "manifest.webmanifest",
        "robots.txt",
        "board.json",
        ".nojekyll",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/apple-touch-icon.png",
    ]
    for name in required:
        if not (out / name).is_file():
            errors.append(f"Missing {name}")

    for path in out.rglob("*"):
        if path.name == "projects.json":
            errors.append(f"Raw projects.json must not ship: {path}")
        if not path.is_file():
            continue
        blob = path.read_bytes()
        for needle in NEEDLES:
            if needle in blob:
                errors.append(f"{path.relative_to(out)} contains {needle.decode()}")
        if b"__DQCX_VERSION__" in blob:
            errors.append(f"{path.relative_to(out)} still has the version placeholder")

    index = out / "index.html"
    if index.is_file():
        html = index.read_text(encoding="utf-8")
        if 'name="robots"' not in html or "noindex,nofollow" not in html:
            errors.append("index.html is missing robots noindex,nofollow")
        if "manifest.webmanifest" not in html:
            errors.append("index.html does not link the manifest")
        if "apple-touch-icon" not in html:
            errors.append("index.html is missing the apple touch icon")

    robots = out / "robots.txt"
    if robots.is_file() and "Disallow: /" not in robots.read_text(encoding="utf-8"):
        errors.append("robots.txt does not disallow all")

    script = out / "app.js"
    if script.is_file() and "IT MW" not in script.read_text(encoding="utf-8"):
        errors.append("app.js does not label IT MW")

    worker = out / "sw.js"
    if worker.is_file():
        sw = worker.read_text(encoding="utf-8")
        if "network-first" not in sw or "board.json" not in sw:
            errors.append("service worker is missing the network-first board.json handler")

    manifest_path = out / "manifest.webmanifest"
    if manifest_path.is_file():
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"manifest is not JSON: {exc}")
            manifest = {}
        if manifest.get("name") != "DQCX Radar":
            errors.append("manifest name is not DQCX Radar")
        if manifest.get("display") != "standalone":
            errors.append("manifest is not standalone")
        for icon in manifest.get("icons") or []:
            src = icon.get("src")
            if not src or not (out / src).is_file():
                errors.append(f"manifest icon missing: {src}")

    expected_icons = {
        "icons/icon-192.png": (192, 192),
        "icons/icon-512.png": (512, 512),
        "icons/apple-touch-icon.png": (180, 180),
    }
    for name, size in expected_icons.items():
        path = out / name
        if not path.is_file():
            continue
        data = path.read_bytes()
        if png_size(data) != size:
            errors.append(f"{name} is not a {size[0]}x{size[1]} PNG")
        if len(data) < 400:
            errors.append(f"{name} looks empty")

    board_path = out / "board.json"
    if board_path.is_file():
        try:
            board = json.loads(board_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"board.json is not JSON: {exc}")
            board = {}
        projects = board.get("projects")
        if not isinstance(projects, list):
            errors.append("board.json has no projects list")
            projects = []
        if board.get("project_count") != len(projects):
            errors.append("project_count does not match the projects list")
        if expect is not None and len(projects) != expect:
            errors.append(f"expected {expect} projects, found {len(projects)}")
        if "listen_note" in board:
            errors.append("board.json still has listen_note")

        def walk(value, path):
            if isinstance(value, dict):
                for key, child in value.items():
                    if key in DROP_KEYS:
                        errors.append(f"internal field {key} at {path}")
                    walk(child, f"{path}.{key}")
            elif isinstance(value, list):
                for index, child in enumerate(value):
                    walk(child, f"{path}[{index}]")

        walk(board, "board")
        for project in projects:
            if not isinstance(project, dict):
                errors.append("project is not an object")
                continue
            if project.get("record_kind") == "example":
                errors.append(f"example record shipped: {project.get('project_id')}")
            for source in project.get("sources") or []:
                if not isinstance(source, dict):
                    errors.append(f"bad source on {project.get('project_id')}")
                    continue
                kind = str(source.get("type") or "").strip().lower()
                if kind.startswith("internal"):
                    errors.append(f"internal source on {project.get('project_id')}")
                url = source.get("url")
                if not isinstance(url, str) or not (url.startswith("https://") or url.startswith("http://")):
                    errors.append(f"non-public source url on {project.get('project_id')}")
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Check a DQCX Radar dist folder for internal data.")
    parser.add_argument("--out", required=True, help="Dist directory written by build.py")
    parser.add_argument("--expect", type=int, help="Exact sanitized project count")
    args = parser.parse_args(argv)
    errors = check(Path(args.out), args.expect)
    if errors:
        print(f"{len(errors)} problem(s) in {args.out}:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1
    print(f"OK {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
