---
name: project-os
description: Bootstrap or validate a reusable project operating system for new or existing repositories. Use when the user wants to set up Claude and Codex workflows, review verdict gates, project manifests, automation policy, Cloudflare-first infrastructure guidance, SEO/GEO policy, GA4/GSC launch gates, AI model tracking, or a secrets manifest in any project without depending on a source project.
---

# Project OS

Use this skill to install or validate a portable project operating system in a
repo. The system is provider-neutral at the core and has separate Claude and
Codex adapters.

## Default Workflow

1. Inspect the target repo first.
2. Confirm or infer:
   - project name
   - GitHub repository slug
   - primary domain
   - default branch
   - primary locale
   - desired profile, usually `cloudflare-fullstack-saas`
3. Run the bootstrap script with `--dry-run`.
4. Review the file list and confirm it will not overwrite important files.
5. Run bootstrap without `--dry-run` only when the target and overwrite behavior
   are clear.
6. Run the checker.
7. Report which files were created and which project-specific values still need
   editing.

## Bootstrap

Use the bundled script:

```bash
node path/to/project-os/scripts/bootstrap-project-os.mjs \
  --dry-run \
  --target /path/to/repo \
  --project-name "Project Name" \
  --repository "owner/repo" \
  --primary-domain "https://example.com"
```

Then apply:

```bash
node path/to/project-os/scripts/bootstrap-project-os.mjs \
  --target /path/to/repo \
  --project-name "Project Name" \
  --repository "owner/repo" \
  --primary-domain "https://example.com"
```

Use `--force` only after inspecting existing files. Never use `--force` to
overwrite unrelated user work casually.

## Bundled Resources

- `scripts/bootstrap-project-os.mjs`: copies Project OS files into a target repo.
- `scripts/apply-project-os.mjs`: one-command wrapper for bootstrap, check, and
  optional local secret seeding from a private profile.
- `scripts/check-project-os.mjs`: validates an installed Project OS.
- `scripts/seed-project-secrets.mjs`: seeds local `.env.local` from private
  profile environment references without printing secret values.
- `assets/private-profile.example.json`: example private profile shape.
- `assets/starter-kit/contracts/`: JSON schemas for manifests.
- `assets/starter-kit/templates/`: generic manifest templates.
- `assets/starter-kit/adapters/codex/`: Codex `AGENTS.md` and review docs.
- `assets/starter-kit/adapters/claude/`: Claude `CLAUDE.md`, Blueprint agent,
  and settings hooks.
- `assets/starter-kit/packs/cloudflare-fullstack/`: Cloudflare-first guidance.
- `assets/starter-kit/packs/seo-core/`: SEO/GEO guidance.
- `assets/starter-kit/packs/analytics-search/`: GA4 and Google Search Console
  guidance.

Resolve paths relative to this skill directory. If the skill is installed at
`~/.codex/skills/project-os`, the bootstrap script is:

```bash
node ~/.codex/skills/project-os/scripts/bootstrap-project-os.mjs ...
```

## Safety Rules

- Do not put secret values in manifests, docs, prompts, or logs.
- Do not put secret values in public profile examples or committed profile files.
- `secrets.manifest.json` lists names, destinations, owners, and required status
  only.
- Use `--profile-file` for private reusable defaults and environment-variable
  references. Profile files should live outside the project repo.
- Run `seed-project-secrets.mjs` only with explicit `--dry-run` or
  `--write-env-local`; it must not print values and must require `.env.local` to
  be ignored unless explicitly overridden.
- When the user says "use my secrets", prefer `apply-project-os.mjs
  --use-my-secrets`; it auto-discovers `PROJECT_OS_PROFILE`,
  `~/.config/project-os/personal.json`, then `~/.project-os/profile.json`.
- The bootstrap script must not deploy infrastructure, create secrets, push
  branches, or write outside the requested target directory.
- Claude and Codex share the same review verdict contract, but they use separate
  markers:
  - Codex: `.claude/.plan-review-approved`
  - Claude Blueprint: `.claude/.blueprint-approved`
- The real approval artifact is the review verdict recorded in a spec or issue:
  `APPROVE`, `REVISE`, `REJECT`, or `NEEDS_APPROVAL`.

## Validation

After bootstrap, run:

```bash
node path/to/project-os/scripts/check-project-os.mjs --root /path/to/repo
```

The checker validates required manifests, JSON parsing, secret-value policy,
automation defaults, SEO baseline, GA4/GSC launch gates, and Claude/Codex
marker separation.

## One-Command Personal Workflow

For "install/use Project OS with my secrets", run:

```bash
node path/to/project-os/scripts/apply-project-os.mjs \
  --target /path/to/repo \
  --use-my-secrets
```

This is a dry run. To apply:

```bash
node path/to/project-os/scripts/apply-project-os.mjs \
  --target /path/to/repo \
  --use-my-secrets \
  --yes
```

The wrapper must not create remote GitHub, Cloudflare, or Google secrets.

## When Publishing Or Updating This Skill

- Keep `SKILL.md` concise.
- Keep reusable files in `assets/starter-kit/`.
- Keep deterministic operations in `scripts/`.
- Do not include project-specific domains, issue IDs, notification topics, or
  secret values in templates.
