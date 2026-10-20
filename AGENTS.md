# ReserveKit — agent notes

White-label booking SaaS. pnpm workspace: `artifacts/reservekit` (Vite + React SPA),
`artifacts/api-server` (Express 5 + Drizzle), `lib/db` (schema, migrations, seed),
`lib/api-spec` (OpenAPI source), `lib/api-zod` / `lib/api-client-react` (generated).
`artifacts/mockup-sandbox` is a UI playground and is not part of the running app.

## Running it here (Base44 sandbox)

`docker compose -f docker-compose.base44.yml up -d --build`

- `web` — Vite dev server on host port **3000**; proxies `/api` to `api:5000`
  (`API_PROXY_TARGET`), so the browser is single-origin and session cookies work.
- `api` — Express on 5000 (internal only). Runs the repo's `dev` script, which
  **esbuilds then starts**; it has no watcher, so restart it after backend edits:
  `docker compose -f docker-compose.base44.yml restart api`.
- `db` — Postgres 16 in a named volume (`reservekit_db-data`).
- `install` and `db-push` are one-shot: they install from the lockfile and apply
  the Drizzle schema whenever the stack comes up.
- `seed` is behind the `tools` profile because it **clears domain tables**:
  `docker compose -f docker-compose.base44.yml run --rm seed`
  Demo logins: `admin@reservekit.demo / admin1234`, `olivia.park@email.com / customer1234`.
  Seed dates are relative to the day it runs, so the dashboard always looks current.

`docker-compose.base44.yml` uses `.base44/node.Dockerfile` (Node 24 + pnpm only);
the repo is bind-mounted at `/app`, never baked into an image.

## Gotchas

- Vite config requires `PORT` and `BASE_PATH`; compose supplies both.
- Changing `lib/api-spec/openapi.yaml` requires regenerating the client and Zod
  schemas: `docker compose -f docker-compose.base44.yml exec web pnpm --filter @workspace/api-spec run codegen`
  (then restart `api`, then typecheck).
- Nullable DB columns must be declared `type: [string, "null"]` in the spec.
  Optional-only (`type: string`) makes the generated Zod response schemas reject
  the `null` the DB actually returns, and the endpoint 500s.
- Stripe and Resend are optional. Without `STRIPE_SECRET_KEY` payments are mocked;
  without `RESEND_API_KEY` booking emails are logged instead of sent.
  Dashboard secrets arrive in `/run/base44/app.env`, loaded as the last `env_file`.

## Verify

- `curl -s http://localhost:3000/api/healthz` → `{"status":"ok"}`
- `curl -s http://localhost:3000/` → Vite HTML for the SPA
- Typecheck: `pnpm --filter @workspace/api-server run typecheck` and
  `pnpm --filter @workspace/reservekit run typecheck` (run inside `web`).
