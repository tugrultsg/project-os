# {{PROJECT_NAME}} Project

> Project OS enabled | Provider-neutral workflow with Codex adapter

## Before Any Change

1. Check `docs/specs/` for an existing spec.
2. Check `docs/FEATURE-IMPACT-MAP.md` for affected areas when the project has one.
3. If adding API calls or paid services, check `docs/COST-PER-CUSTOMER.md` or create one.
4. Read architecture/design docs only when touching those areas.

## Workflow

Every non-trivial change follows this pipeline:

```text
Plan -> Plan Hardening -> Review Verdict -> GH Issue -> User Approval -> Execute -> Compliance Check -> Ship -> Monitor
```

## Non-Negotiable Rules

- Plan Hardening is required before review for every non-trivial plan.
- Review verdict is required for runtime behavior, schemas, APIs, data flow,
  tests, automation, secrets, deployment, or user-facing docs.
- Record the verdict in the spec or issue:
  `APPROVE`, `REVISE`, `REJECT`, or `NEEDS_APPROVAL`.
- Codex-native reviews may use `.claude/.plan-review-approved` as a local hook
  marker.
- Codex must not create or impersonate `.claude/.blueprint-approved`.
- Never push directly to `{{DEFAULT_BRANCH}}`.
- Every feature branch ships through a PR and the configured queue label.
- New secrets must update `secrets.manifest.json`; never write secret values to
  manifests or docs.

## Commands

```bash
npm run project-os:check
node project-os/scripts/check-project-os.mjs --root .
```

## Key Contracts

- `project-os.config.json`
- `automation-policy.json`
- `ai-models.json`
- `seo-policy.json`
- `secrets.manifest.json`

