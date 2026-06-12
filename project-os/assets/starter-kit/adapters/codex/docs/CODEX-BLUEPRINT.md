# Codex Blueprint

Codex Blueprint is a local plan review. It produces the provider-neutral review verdict used by Project OS.

## Required Verdicts

- `APPROVE`: implementation may proceed.
- `REVISE`: fix the plan and review again.
- `REJECT`: rethink the approach.
- `NEEDS_APPROVAL`: plan is good enough technically but touches a sensitive
  boundary requiring explicit human approval.

## Required Checks

- Plan Hardening exists and is substantive.
- Scope is the smallest useful version.
- Runtime, data, auth, deployment, cost, and secrets risks are addressed.
- Tests and verification match the blast radius.
- New secrets are documented by name only.
- Automation that can write, merge, or deploy is fail-closed.

## Output

```markdown
# Codex Blueprint Review - [Title]
## Decision: [APPROVE / REVISE / REJECT / NEEDS_APPROVAL]

## Scores
| Area | Score | Notes |
|---|---:|---|
| Technical | 0.0 | ... |
| Product | 0.0 | ... |
| Architecture | 0.0 | ... |

## Concerns
- ...

## Required Changes
1. ...
```

## Codex Rules

- This review does not create `.claude/.blueprint-approved`.
- If a hook-compatible marker is needed after `APPROVE`, use
  `.claude/.plan-review-approved`.
- Record the verdict in the spec or issue.
