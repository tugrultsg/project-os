# {{PROJECT_NAME}} Project

> Project OS enabled | Provider-neutral workflow with Claude adapter

## Workflow

Every non-trivial change follows this pipeline:

```text
Plan -> Plan Hardening -> Blueprint / Review Verdict -> GH Issue -> User Approval -> Execute -> Compliance Check -> Ship -> Monitor
```

## Rules

- Plan Hardening is required before Blueprint for non-trivial work.
- Blueprint produces a review verdict:
  `APPROVE`, `REVISE`, `REJECT`, or `NEEDS_APPROVAL`.
- Record the review verdict in the spec or issue.
- Claude Blueprint may write `.claude/.blueprint-approved` on `APPROVE`.
- Codex review markers use `.claude/.plan-review-approved`; do not treat that
  as Claude Blueprint approval.
- Never push directly to `{{DEFAULT_BRANCH}}`.
- Do not put secret values in manifests, docs, prompts, or logs.

## Contracts

- `project-os.config.json`
- `automation-policy.json`
- `ai-models.json`
- `seo-policy.json`
- `secrets.manifest.json`

