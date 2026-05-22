# Supabase setup

The v1 schema lives in [`schema.sql`](./schema.sql). It's idempotent — safe to re-run after edits.

## First-time setup (~5 min)

1. **Create a Supabase project** at https://supabase.com/dashboard (free tier is fine for v1).
2. In the dashboard, open **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only — never commit)
3. Put those values in `.env.local` (copy from `.env.local.example` in repo root).
4. Open the **SQL Editor** in the Supabase dashboard, paste the full contents of `schema.sql`, run it.
5. Open **Authentication → Providers**, make sure **Email** is enabled. Disable "Confirm email" for local dev if you want frictionless signup; turn it back on before launch.

## Verifying the trigger

After running the schema, create a test user in **Authentication → Users → Add user**. A matching row should appear in `public.profiles` automatically. If not, re-run `schema.sql` — the `on_auth_user_created` trigger may not have attached.

## Later: switching to the Supabase CLI

When the schema starts changing frequently, switch to the CLI for proper migrations:

```bash
brew install supabase/tap/supabase
supabase init
supabase link --project-ref <your-ref>
supabase db pull       # turn the current schema into a baseline migration
```

From then on, `supabase migration new <name>` + `supabase db push` replaces editing `schema.sql` by hand.
