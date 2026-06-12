# Cloudflare Fullstack Pack

Use this pack when the project should default to Cloudflare for hosting,
Workers, D1, R2, Queues, and scheduled jobs.

## Defaults

- Runtime: Cloudflare Workers or Pages with Workers.
- Data: D1 for relational data, R2 for object storage, KV only for cache-style
  state, Queues for asynchronous work.
- Deploy: GitHub Actions, with health checks and E2E smoke checks after deploy.
- Secrets: local `.env` or `.env.local`, GitHub Actions secrets, and Worker
  secrets. Never store secret values in manifests.

## Required Contract Updates

- `project-os.config.json`: set `platform.runtime` to `cloudflare`.
- `automation-policy.json`: keep deploy automation fail-closed.
- `secrets.manifest.json`: include Cloudflare account/token names and every
  worker-required secret name.
- `docs/SECRETS.md`: document setup, rotation, and verification commands.

## Setup Checklist

- [ ] Create Cloudflare account/project manually.
- [ ] Create D1/R2/Queue resources manually or through reviewed IaC.
- [ ] Add secret names to `secrets.manifest.json`; do not add values.
- [ ] Add worker-required secrets to deploy verification.
- [ ] Verify deploy with a health check and E2E smoke test.

