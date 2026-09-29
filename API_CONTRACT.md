# CS2 Analytics — Admin API contract

Base URL:
https://<project-ref>.supabase.co/functions/v1/cs2-admin

Authentication:
x-cs2-api-key: <CS2_ADMIN_API_KEY>

Never expose the API key or Supabase backend key in the browser or repository.

## GET /

Returns the current state and version.

## GET /health

Returns a small health response.

## POST / — validate

Request:

    {"action":"validate"}

The server validates the current state with the canonical validator.

## POST / — commit

Request shape:

    {
      "action": "commit",
      "operation_id": "unique-id",
      "operations": [],
      "audit": {
        "action": "EDIT_MATCH",
        "target": "match-id",
        "detail": {}
      },
      "actor": "gpt-or-admin"
    }

Operations are limited to 1–100 items and are applied to a cloned state. The final state is validated before the database RPC is called.

Supported operation kinds:

- player / player_patch
- map / map_patch
- match / match_patch
- aliases

Use patches for corrections, including cancellation/archive:

    {"kind":"match_patch","match_id":"...","patch":{"archived":true,"archived_at":"2026-09-30T12:00:00Z"}}

Restore with archived=false and archived_at=null.

## Concurrency

Every commit is based on the current cs2_app_state version. If another writer committed first, the RPC returns a version conflict and the API returns HTTP 409.

On 409:

1. GET current state.
2. Rebuild/rebase the intended operation.
3. Generate a new operation_id.
4. POST commit again.

Do not retry the same stale state blindly.

## Idempotency

operation_id is stored in cs2_operations. Repeating an already committed operation_id returns the existing current result instead of applying it again.

## Audit

Every successful commit writes cs2_operations and cs2_audit_log with operation_id, action, target, actor, detail and timestamp.

## Errors

- 401 — wrong/missing API key.
- 400 — malformed request or invalid final state.
- 409 — optimistic concurrency conflict.
- 405 — unsupported HTTP method.

No invalid state reaches cs2_app_state.
