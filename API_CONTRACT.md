# CS2 Analytics — Admin API contract

Base URL:
https://<project-ref>.supabase.co/functions/v1/cs2-admin

Authentication:
x-cs2-api-key: <CS2_ADMIN_API_KEY>

Never expose the API key or Supabase backend key in the browser or repository.

## GET /
Returns { ok, state, version, updated_at }.

## GET /health
Returns { ok: true, service: "cs2-admin" }.

## POST / with { "action": "validate" }
Returns { ok: true, version } or 400 on invalid state.

## POST / with { "action": "commit", "operation_id", "actor", "operations", "audit" }
operations use the existing app format:
- player
- map
- match
- aliases
- player_patch
- map_patch
- match_patch

audit: { action, target, detail }.

A successful commit returns { ok, operation_id, version, updated_at }.

409 means optimistic-concurrency conflict. Re-read state, rebuild the operation against the latest version, and retry with a new operation_id.

The API is command-oriented: callers never send SQL and never receive database credentials.
