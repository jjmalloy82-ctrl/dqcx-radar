# DQCX Radar handheld

Phone-first board for DQCX commissioning pursuits. The spreadsheet stays in Google Sheets. This folder builds the view JJ opens on his phone: hottest campuses first, tap one for the call, the parties, and the public sources.

The page is a static site. There is no server and no framework. `build.py` reads a `projects.json` export and writes a folder you can host as-is.

## Build

Requires Python 3.9+ from the standard library. No packages to install.

```bash
python3 mobile/build.py --data /path/to/projects.json --out /path/to/dist
```

That command:

- Drops the example record (`template_notice` or `record_kind: example`).
- Strips `bd_owner_internal`, `bd_owner`, `notes_internal`, and `template_notice`, including a `bd_owner` key inside `confidence`.
- Drops the top-level `listen_note` (internal listen scratch, not a campus fact).
- Keeps a source only when its type does not start with `internal` and its URL is `http://` or `https://`. Local paths and empty URLs are removed.
- Writes `board.json` (sanitized campuses only — never the raw `projects.json`).
- Copies the shell, generates the icons, and runs `check_dist.py`.

A cron rebuild is the same command. Publish the dist folder only when the command exits 0.

```bash
python3 /opt/dqcx-radar/mobile/build.py \
  --data /var/dqcx/projects.json \
  --out /tmp/dqcx-radar-dist
```

Check an existing folder on its own:

```bash
python3 mobile/check_dist.py --out /tmp/dqcx-radar-dist
python3 mobile/check_dist.py --out /tmp/dqcx-radar-dist --expect 388
```

The check fails if `bd_owner`, `notes_internal`, `/workspace`, `template_notice`, or `listen_note` appear anywhere in the output, or if a source URL is not http(s). `--expect` is optional; the live board as of 2026-10-03 is 388 campuses after the template is removed. Leave it off if the sheet has grown.

Fixture test (no live board required):

```bash
python3 mobile/test_build.py
```

`mobile/sample/board.json` is a sanitized export of that fixture, for reading the shape. The site always loads whatever `board.json` the build just wrote. Do not point the build at `sample/board.json`; that file is already sanitized.

## What the phone shows

- Cards sorted by `opportunity_score`, highest first.
- **IT MW** is `it_mw` only. `critical_mw` is labeled Critical MW and called out as critical power, not IT load. A blank IT MW stays unknown even when critical MW is filled in.
- Search matches name, aliases, city, owner, tenant, and developer.
- **Call this week** is `pursuit_now` or `develop`, with `next_action_due` on or before today + 7 days (overdue counts).
- **Overdue** is a next-action due date before today. Due dates are read as calendar dates, not UTC timestamps.
- Region chips use the Radar region (TX, VA, AZ, GA, OH, Carolinas, Other). The State sheet can filter by region or by state code.
- A campus link is the hash `#/p/<project_id>`. Back, the browser back button, and an edge swipe return to the list.
- The header shows the board’s `updated` field as “Board updated …”.

## Deploy

Host the **contents** of the dist folder on HTTPS so the service worker can install. GitHub Pages is enough. Use a separate repo from this one and force-push the built files onto the branch Pages serves (usually `main` or `gh-pages`). Do not push this source tree, and do not commit the raw `projects.json` into the Pages repo.

```bash
# One-time: an empty repo with Pages set to deploy from branch / root.
git clone git@github.com:ORG/dqcx-radar-pages.git /tmp/dqcx-pages
cd /tmp/dqcx-pages

rm -rf ./*
cp -a /tmp/dqcx-radar-dist/. .
git add -A
git commit -m "Board $(date -u +%F)"
git push --force origin HEAD
```

`.nojekyll` is included so Pages serves the folder as plain files. The site ships `robots.txt` with `Disallow: /` and `<meta name="robots" content="noindex,nofollow">`. An unlisted URL is not access control — anyone with the link can open it. That is why the build strips internal fields before anything is written.

On a phone: open the Pages URL in Safari or Chrome, then Add to Home Screen (iOS Share sheet, or the install prompt on Android). The manifest name is **DQCX Radar**. Theme color is `#070d18`.

The service worker caches the shell (cache-first, new cache name every build) and loads `board.json` network-first, falling back to the last cached copy offline. After a publish, the next online open picks up the new board. The first install needs a network connection; after that the last board still opens on a plane.

Local preview (service workers need http, not `file://`):

```bash
python3 mobile/build.py --data /path/to/projects.json --out /tmp/dqcx-radar-dist
python3 -m http.server 8765 --directory /tmp/dqcx-radar-dist
```

Open `http://127.0.0.1:8765/` and use a 390×844 viewport for the phone layout. Desktop just centers the same column.
