# Codex Workflow

This is the Codex adapter for Project OS. It preserves the shared workflow
contract while keeping Codex-specific review behavior separate from Claude.

## Pipeline

1. **Plan**
   - Inspect the repo first.
   - Write or update a spec for broad changes.

2. **Plan Hardening**
   - Critique the plan before review.
   - Include assumptions, critique findings, revisions made, and remaining
     trivial issues or accepted tradeoffs.

3. **Codex Blueprint / Review Verdict**
   - Review the plan using `docs/CODEX-BLUEPRINT.md`.
   - Verdicts: `APPROVE`, `REVISE`, `REJECT`, `NEEDS_APPROVAL`.
   - Record the verdict in the spec before implementation and in the issue
     after issue creation.
   - Use `.claude/.plan-review-approved` only as a local hook marker when
     needed. Do not use `.claude/.blueprint-approved` for Codex review.

4. **Issue**
   - Create or update a GitHub issue with plan, hardening, deliverables,
     verdict, and verification checklist.

5. **Execute**
   - Implement only the approved scope.
   - Preserve unrelated user changes.

6. **Verify**
   - Run targeted checks, then broader checks based on risk.
   - Compare implementation against issue deliverables.

7. **Ship / Monitor**
   - Ship through the configured PR queue.
   - Monitor CI/deploy until success or actionable failure.

