# CS5 Analytics — current release report

## Scope
Current candidate includes the restored 66-map database, 61 detailed maps, 5 compact BO3 maps, 11 players and the complete local analytics UI.

## Final verification performed
- `node --check app.js` — PASS
- `python3 QA_CHECK.py` — PASS
- `node MECHANISM_QA_v39.js` — PASS
- `node E2E_QA_v39.js` — PASS
- `node E2E_QA_v39_strict.js` — PASS
- `node UI_RUNTIME_QA_v40.js` — PASS
- Embedded fallback counts — PASS: 11 players / 66 maps / 32 matches
- HTTP smoke — PASS: index.html, style.css, app.js, data_embedded.js and all four JSON data files return HTTP 200
- Chromium headless DOM dump — not available in this sandbox because navigation times out; this is explicitly not counted as a browser-automation pass.

## Product coverage
- Final top-level navigation: ГЛАВНАЯ / БАЗА / АНАЛИТИКА / КАРТЫ / СОСТАВЫ / РЕКОРДЫ / ⚙
- Home dashboard with live last-game table, changes, recent games, top players, news, metrics and accumulation graph.
- Player Center, comparison, Player Detail, transparent Player Index explanation, RANGE, Form, Stability, Trend, eras and index history.
- Map Lab, Map Detail, Map DNA radar and map history.
- 5v5 Team Builder with manual/random/balance selection, Player Pick, What If and before/after composition metrics.
- Records across all/career/last-match/map scopes with K, D, A, K-D, K/D, Impact and Player Index views.
- Admin lifecycle, transactional local journal, backup/import, rollback and archive/restore.

## Data integrity rules
- No fabricated per-map statistics for compact BO3 records.
- No ADR/KAST/opening/clutch/utility metrics because the source data does not contain them.
- Derived metrics are recalculated from the live database.
- Player identities remain text-only; no avatars are used.

## v40 shared-sync final
- Removed the extra parenthetical `подробно` marker from the БАЗА player table.
- Added `server.py` and `START_SHARED_SERVER.bat` for shared LAN usage.
- Shared mode stores the live combined database in `shared_state.json`.
- Mutations are committed transactionally to the shared server and broadcast to connected browsers through Server-Sent Events, with polling fallback.
- The original `START_SERVER.bat` remains available for single-PC/local mode.
