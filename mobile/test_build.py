#!/usr/bin/env python3
"""Build the fixture board and assert the public export is safe.

    python3 mobile/test_build.py
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def main() -> int:
    out = Path(tempfile.mkdtemp(prefix="dqcx-radar-"))
    data = ROOT / "testdata" / "projects.json"
    subprocess.run(
        [sys.executable, str(ROOT / "build.py"), "--data", str(data), "--out", str(out)],
        check=True,
    )
    subprocess.run(
        [sys.executable, str(ROOT / "check_dist.py"), "--out", str(out), "--expect", "4"],
        check=True,
    )
    board = json.loads((out / "board.json").read_text(encoding="utf-8"))
    ids = [project["project_id"] for project in board["projects"]]
    if ids != ["DQ-TEST-PURSUE", "DQ-TEST-DEVELOP", "DQ-TEST-MONITOR", "DQ-TEST-INTEL"]:
        raise SystemExit(f"unexpected project order: {ids}")
    text = (out / "board.json").read_text(encoding="utf-8")
    for banned in ("SECRET", "should-drop", "EXAMPLE — North Texas", "do not ship"):
        if banned in text:
            raise SystemExit(f"sanitized board still contains {banned}")
    if "https://example.com/permit" not in text:
        raise SystemExit("public https source was dropped")
    if "http://example.com/news" not in text:
        raise SystemExit("public http source was dropped")
    pursue = board["projects"][0]
    if pursue["confidence"].get("name") != "confirmed" or "bd_owner" in pursue["confidence"]:
        raise SystemExit("confidence map was not sanitized")
    if pursue.get("it_mw") != 100 or pursue.get("critical_mw") != 140:
        raise SystemExit("MW fields were not preserved")
    if pursue.get("l0_date") != "2026-03-01" or pursue.get("pursuit_window_end") != "2027-05-01":
        raise SystemExit("schedule fields were not preserved")
    if pursue.get("liquid_cool_flag") is not False:
        raise SystemExit("false flags should be kept")
    monitor = board["projects"][2]
    if "it_mw" in monitor:
        raise SystemExit("null IT MW should be omitted rather than invented")
    if monitor.get("critical_mw") != 50:
        raise SystemExit("critical MW should remain available for a separate label")
    if board.get("updated") != "2026-10-03":
        raise SystemExit("board updated timestamp was dropped")
    if "listen_note" in board:
        raise SystemExit("listen note shipped")
    print(f"fixture build ok → {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
