# CS5 Analytics — implementation pass v40

This build is a functional continuation of v39, not a database rewrite.

## Implemented in this pass
- Map Lab now exposes a clickable history of every active occurrence of a map.
- Added full Map Detail modal: score, match/date/format, 10-player K/D/A, K/D and K-D where detailed data exists.
- Compact BO3 maps explicitly show that per-map K/D/A is unavailable; no values are fabricated.
- Records now has All / Career / Last Match / Map filters and metric/map controls.
- 5v5 Team Builder now shows average Player Index comparison, What If context and Player Pick context alongside manual/random/balance controls.
- Team average is used in the header rather than the raw sum, making the comparison easier to read.
- Start scripts now detect `py`, `python`, or `python3`, choose a free port, start a local HTTP server, and open the browser.
- Existing v39 data validation, local journal, backup/restore and rollback mechanisms are retained.

## Verified
- QA_CHECK.py: PASS
- MECHANISM_QA_v39.js: PASS
- E2E_QA_v39.js: PASS
- E2E_QA_v39_strict.js: PASS
- app.js syntax: PASS
- JSON data files: PASS

## Known limits
- Full browser automation cannot be executed in this environment because Chromium navigation is blocked by the execution sandbox policy. Static/mechanism/E2E checks were executed successfully.
- The source dataset does not contain ADR/KAST/opening/clutch/utility data and does not contain per-map K/D/A for the five compact BO3 maps. The UI therefore does not invent those values.

## v40 analytical/UI hardening — current working copy
- Analytics navigation retains the finalized top-level structure: ГЛАВНАЯ / БАЗА / АНАЛИТИКА / КАРТЫ / СОСТАВЫ / РЕКОРДЫ / ⚙.
- Player Center and comparison support the active player pool and descriptive comparison without match-outcome prediction.
- Player Detail now includes transparent Player Index math, historical range, 5/10/20 form slices, eras, Index history and explicit extrapolation labeling.
- Added `ПОЧЕМУ N?` drill-down: every Player Index component and weight is shown from the live formula.
- Map Lab now includes a real Map DNA radar for a selected player on the selected map, based only on detailed K/D/A-derived metrics.
- Base and Home now provide match drill-down; individual maps open Map Detail. Compact BO3 remains aggregate-only.
- Records now exposes selected-metric TOP 10 plus K, D, A, K-D, K/D, Impact and Player Index record blocks.
- Player identity remains text-only; no player avatars are used.
- Added `UI_RUNTIME_QA_v40.js`, which executes the main views/modals in a DOM stub and verifies derived recalculation after a stat change.

### Current verification
- `node --check app.js` — PASS
- `python3 QA_CHECK.py` — PASS
- `node MECHANISM_QA_v39.js` — PASS
- `node E2E_QA_v39.js` — PASS
- `node E2E_QA_v39_strict.js` — PASS
- `node UI_RUNTIME_QA_v40.js` — PASS (11 UI/runtime paths + derived recalculation)
- Embedded data fallback counts — PASS (11 players / 66 maps / 32 matches)
- HTTP smoke test — PASS for core HTML/CSS/JS/embedded data and four JSON files
- Chromium headless dump-dom remains unavailable in this execution environment (times out); this is an environment limitation, not reported as browser automation success.
