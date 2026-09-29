# Admin API smoke tests

Run locally after checkout:

node tests/validation.test.js
node tests/operations.test.js
node --check app.js
node --check supabase_adapter.js
node --check validation.js

After Supabase deployment:

curl -sS https://<project-ref>.supabase.co/functions/v1/cs2-admin/health \
  -H "x-cs2-api-key: $CS2_ADMIN_API_KEY"

curl -sS https://<project-ref>.supabase.co/functions/v1/cs2-admin \
  -H "x-cs2-api-key: $CS2_ADMIN_API_KEY"

Validate:

curl -sS -X POST https://<project-ref>.supabase.co/functions/v1/cs2-admin \
  -H "x-cs2-api-key: $CS2_ADMIN_API_KEY" \
  -H "content-type: application/json" \
  -d '{"action":"validate"}'

The first production write should use a deliberately harmless metadata-only patch on a test record, or be performed against a backup/staging project first.
