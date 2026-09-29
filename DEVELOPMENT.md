# DEVELOPMENT.md — CS2 Analytics

## Architecture

Production data flow:

GPT / admin client -> Supabase Edge Function cs2-admin -> shared validation -> atomic commit_cs2_state RPC -> cs2_app_state -> Supabase Realtime -> already-open frontend.

GitHub Pages serves the static frontend. Supabase is the production data source when configured.

## Important files

- index.html — page shell and script order.
- style.css — UI styles.
- app.js — existing application/UI logic; keep changes focused.
- data_embedded.js — embedded fallback data; do not invent production data here.
- supabase-config.js — publishable Supabase configuration only.
- supabase_adapter.js — browser auth/load/realtime/commit adapter.
- validation.js — canonical state validator used by browser, tests and Edge Function.
- supabase/migrations/ — database schema/RLS/RPC changes.
- supabase/functions/cs2-admin/ — protected admin data API.
- tests/ — automated tests.
- .github/workflows/ — CI and Pages deployment.
- GPT_HANDOFF.md — continuation context for another GPT.

## State rules

The canonical application state contains players, maps, matches and aliases. Extra metadata such as audit entries is allowed.

Do not hard-code derived statistics. Preserve source K/D/A and match/map relations; application code derives analytics.

## Local development

Run the LAN/dev server:

    python3 server.py

Then open http://localhost:8000.

Run tests:

    node tests/validation.test.js
    node tests/operations.test.js
    node tests/api_contract.test.js
    node --check app.js
    node --check supabase_adapter.js
    node --check validation.js

## Safe code changes

1. Read the relevant file and its callers first.
2. Prefer small targeted changes.
3. Do not rewrite app.js wholesale.
4. Preserve existing data shape and UI behavior unless explicitly requested.
5. If state shape changes, update validation.js, tests and documentation together.
6. If an API operation changes, update the Edge Function, browser adapter, API contract and tests together.
7. Never commit Supabase backend secrets or admin API keys.
8. Do not create fake production records to make tests pass.

## Safe production data changes

Use the admin API, not hand-edited JSON:

1. GET current state.
2. Build operations against that exact version.
3. POST commit with a unique operation_id.
4. On 409, GET again, rebase the intended change and retry with a new operation ID.
5. Never silently overwrite a newer state.

A commit accepts 1–100 operations, so related changes can be atomic.

Supported operation kinds:

- player
- player_patch
- map
- map_patch
- match
- match_patch
- aliases

Cancellation/archive is represented as a patch with archived=true and archived_at; restoration uses archived=false and archived_at=null.

## Testing philosophy

Test invariants: IDs/references, aliases, detailed/compact map stats, BO1/BO3, operation application, API contract, optimistic concurrency and idempotency.

A real Realtime smoke test requires a linked Supabase project and deployed Edge Function. It cannot honestly be simulated by a unit test.

## Deployment

See PRODUCTION_DEPLOY.md and API_CONTRACT.md.
