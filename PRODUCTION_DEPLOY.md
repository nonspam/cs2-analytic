# Production deployment — CS2 Admin API

## 1. Supabase migration

~~~bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db push
~~~

## 2. Edge Function secrets

~~~bash
supabase secrets set CS2_ADMIN_API_KEY="<random-long-api-key>"
supabase secrets set SUPABASE_BACKEND_KEY="<server-only-supabase-key>"
~~~

Never commit either value.

## 3. Deploy

~~~bash
supabase functions deploy cs2-admin --no-verify-jwt
~~~

## 4. Smoke test

~~~bash
export CS2_ADMIN_API_KEY="<same-value-as-supabase-secret>"
curl -fsS "https://<PROJECT_REF>.supabase.co/functions/v1/cs2-admin/health" -H "x-cs2-api-key: $CS2_ADMIN_API_KEY"
curl -fsS "https://<PROJECT_REF>.supabase.co/functions/v1/cs2-admin" -H "x-cs2-api-key: $CS2_ADMIN_API_KEY"
curl -fsS -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/cs2-admin" -H "x-cs2-api-key: $CS2_ADMIN_API_KEY" -H "content-type: application/json" -d '{"action":"validate"}'
~~~

## 5. GitHub Pages

The browser receives only the Supabase publishable key. Never expose the admin API key, backend key, database password, or service-role credentials.

## 6. First write

Use a disposable/test object or staging project first. Flow: GPT -> Edge Function -> shared validation -> commit_cs2_state -> version increment -> Realtime -> active browser.

A 409 means optimistic-concurrency conflict: re-read state, rebuild the operation, and use a new operation_id.

## 7. CI

Every push and pull request runs syntax checks, validation tests, operation tests, and shared-validator reference checks.
