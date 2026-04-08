Issue

The preview/production instance returned a Prisma P2021 error: missing table `ResumeEducation` in the connected database. This usually means the DB used by that deployment is missing a corrective migration that exists in the repository.

What I added

- A safe debug endpoint: `GET /api/debug/db` which returns a masked `DATABASE_URL`, whether `ResumeEducation` exists, and recent entries from `_prisma_migrations`.
  - In production the endpoint is disabled unless `DEBUG_DB_TOKEN` is set in the environment; if set, requests must include header `x-debug-token: <value>`.

Remediation options

1) Preferred: run Prisma migrations on the DB used by the failing deployment

- If you control the environment where the failing app runs (e.g., Vercel), set `DATABASE_URL` to the intended DB and run:

```bash
# From CI or a machine with repository checked out and secrets configured
npx prisma migrate deploy --preview-feature --schema=prisma/schema.prisma
```

- Or in GitHub Actions you can use the existing workflow `.github/workflows/prisma-deploy.yml` which already runs `npx prisma migrate deploy` using `${{ secrets.DATABASE_URL }}`.

2) Quick fix: apply the corrective SQL manually

- The corrective migration is in `prisma/migrations/20260403_add_resumeeducation_correction/migration.sql`.
- You can apply it directly with `psql` (non-destructive because it uses `CREATE TABLE IF NOT EXISTS`):

```bash
psql "$DATABASE_URL" -f prisma/migrations/20260403_add_resumeeducation_correction/migration.sql
```

3) Verify the deployed app is pointed at the intended DB

- Check your hosting provider project settings (Vercel Environment Variables) for `DATABASE_URL`.
- Or call the added debug endpoint on the running instance (if you set `DEBUG_DB_TOKEN`) to confirm the masked connection string.

Safety notes

- The debug endpoint never returns full credentials unless `DEBUG_DB_TOKEN` is configured and matched by the caller. It masks the URL by hiding the user:pass portion.
- Prefer `prisma migrate deploy` in CI for repeatable, auditable migrations.

If you want, I can:

- Call the debug endpoint on your deployed preview URL if you provide `DEBUG_DB_TOKEN` so we can confirm which DB that instance uses (I will not store the token).
- Open a small PR with the docs update and the debug route (already added here).
- Run `psql` against the missing DB if you provide connection details or set `DATABASE_URL` in the environment where I should run it.
