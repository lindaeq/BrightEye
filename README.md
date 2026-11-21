# Hack Western 13 arcade

## Save completed runs to Tiger Cloud

1. In the Tiger Console SQL editor for your development service, run [the arcade runs migration](server/001_arcade_runs.sql).
2. Create a PostgreSQL login for the API with `USAGE` on the `public` schema and `SELECT, INSERT, DELETE` on `public.arcade_runs`. Supply that login's TLS-enabled PostgreSQL URI as `DATABASE_URL` in `server/.env.local`. This file is gitignored. Use `sslmode=verify-full` in the connection URI.
3. With Node.js 22 or later, run `npm install --prefix server` and `npm run start --prefix server` from the repo root.
4. Run `npm install` and `npm run dev` from the repo root in another terminal. Open the localhost URL printed by Vite.

Finish both missions and watch the upload popup. Open Operator → Run history to select a saved replay or delete a run. The API binds to localhost and Vite forwards requests to it during development. To verify the write in Tiger Console, run:

```sql
SELECT id, ended_at FROM public.arcade_runs ORDER BY ended_at DESC LIMIT 5;
```
