const assert=require('node:assert/strict');
const fs=require('node:fs');

const api=fs.readFileSync('API_CONTRACT.md','utf8');
const fn=fs.readFileSync('supabase/functions/cs2-admin/index.ts','utf8');
const migration=fs.readFileSync('supabase/migrations/20260929_cs2_admin_api.sql','utf8');

assert.match(api,/x-cs2-api-key/);
assert.match(api,/409/);
assert.match(api,/1–100|1-100/);
assert.match(fn,/CS2_ADMIN_API_KEY/);
assert.match(fn,/commit_cs2_state/);
assert.match(fn,/operation_id/);
assert.match(fn,/validateBase/);
assert.match(fn,/ops\.length>100/);
assert.match(migration,/cs2_operations/);
assert.match(migration,/cs2_audit_log/);
assert.match(migration,/version conflict/);
assert.match(migration,/operation_id/);
console.log('api contract tests: ok');
