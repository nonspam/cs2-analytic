# GPT HANDOFF — CS2 Analytics modernization

Repository: nonspam/cs2-analytic

## DONE IN GITHUB

The production architecture code is committed.

Key files:
- validation.js — shared browser/Node/Deno state validator.
- supabase_adapter.js — Supabase auth, realtime, atomic cloud commits through commit_cs2_state RPC.
- app.js — delegates state validation to window.CS2Validation.
- supabase/migrations/20260929_cs2_admin_api.sql — operations/audit tables + atomic/idempotent optimistic-concurrency RPC.
- supabase/functions/cs2-admin/index.ts — authenticated API gateway for GET state, GET health, POST validate, POST commit.
- API_CONTRACT.md — GPT/API contract.
- PRODUCTION_DEPLOY.md — deployment commands.
- tests/validation.test.js
- tests/operations.test.js
- .github/workflows/ci.yml — syntax/unit/reference checks.
- supabase/config.toml
- supabase/functions/cs2-admin/README.md

## TARGET FLOW

GPT -> cs2-admin Edge Function -> shared validation -> commit_cs2_state -> cs2_app_state -> Supabase Realtime -> already-open website.

No GitHub redeploy is needed for data changes.

## STILL REQUIRED OUTSIDE GITHUB

These steps require the user's Supabase project credentials/access:

1. Install/login Supabase CLI.
2. Link project:
   supabase link --project-ref <PROJECT_REF>
3. Apply migration:
   supabase db push
4. Set secrets:
   supabase secrets set CS2_ADMIN_API_KEY="<long-random-secret>"
   supabase secrets set SUPABASE_BACKEND_KEY="<server-only-supabase-backend-key>"
5. Deploy:
   supabase functions deploy cs2-admin --no-verify-jwt
6. Smoke test /health, GET state, POST validate.
7. Perform one harmless test write in staging/disposable data.
8. Verify the already-open site receives the update through Realtime.

## SECURITY

Never put CS2_ADMIN_API_KEY or SUPABASE_BACKEND_KEY in:
- GitHub
- supabase-config.js
- app.js
- browser JavaScript
- GPT prompt/context

The browser must only use the existing Supabase publishable key.

## CONCURRENCY

API commits are versioned. A 409/version conflict means:
GET latest state -> rebuild operation -> retry with a new operation_id.

## CURRENT LIMITATION

This chat cannot complete the final Supabase deployment without access to the user's Supabase project/secrets. Do not claim production deployment has happened until the smoke tests succeed.

## FIRST THING FOR THE NEXT CHAT

Continue from this file. Do not redesign the architecture. Check deployment status first, then run the Supabase migration/deploy/smoke-test sequence above.
