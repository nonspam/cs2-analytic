# CS2 Analytics — online setup

## What is already prepared
- `supabase_adapter.js` — browser Supabase/Auth/Realtime adapter.
- `supabase-config.js` — only place where the public project URL and publishable/anon key are configured.
- `supabase_schema.sql` — creates the cloud state table, admin allow-list, RLS and Realtime publication, and seeds the current 66-map state.
- `supabase_state_seed.json` — exact raw state used for the seed (players/maps/matches/aliases/audit).
- Existing local/server fallback remains intact.

## Security model
- Public visitors can read the analytics state.
- Only a Supabase Auth account whose email is present in `app_admins` can change the state.
- The browser must contain only the publishable/anon key.
- Never put a `service_role` key into `supabase-config.js`.

## Next user action
1. In Supabase Dashboard open Project Settings → API.
2. Copy **Project URL** and the **Publishable key** (or legacy anon key if that is what the project shows).
3. Send those two values in chat. Do not send the database password or service_role key.

After that the remaining setup can be done step-by-step: configure the client, run the SQL, create the admin Auth account, add its email to the allow-list, test read/write/realtime, then publish to GitHub Pages.
