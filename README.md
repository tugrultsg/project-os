# Project OS

Reusable Codex skill for bootstrapping a portable project operating system into
new or existing repositories.

It installs shared manifests plus separate Claude and Codex adapters, so a repo
can carry the same development workflow, review gates, automation policy,
Cloudflare-first infrastructure guidance, SEO/GEO baseline, GA4/GSC launch
gates, AI model policy, and secrets inventory without depending on a previous
project.

## Install

Install the `project-os/` skill folder from this repository.

If your installer asks for a GitHub path, use:

```text
tugrultsg/project-os/project-os
```

Then ask Codex:

```text
Use $project-os to bootstrap this repository with a Cloudflare-first Claude and Codex project operating system.
```

## Manual Usage

Dry run first:

```bash
node ~/.codex/skills/project-os/scripts/bootstrap-project-os.mjs \
  --dry-run \
  --target /path/to/repo \
  --project-name "Project Name" \
  --repository "owner/repo" \
  --primary-domain "https://example.com"
```

Apply:

```bash
node ~/.codex/skills/project-os/scripts/bootstrap-project-os.mjs \
  --target /path/to/repo \
  --project-name "Project Name" \
  --repository "owner/repo" \
  --primary-domain "https://example.com"
```

Validate:

```bash
node ~/.codex/skills/project-os/scripts/check-project-os.mjs --root /path/to/repo
```

## Files Created

- `project-os.config.json`
- `automation-policy.json`
- `ai-models.json`
- `analytics-policy.json`
- `seo-policy.json`
- `secrets.manifest.json`
- `AGENTS.md`
- `CLAUDE.md`
- `docs/CODEX-WORKFLOW.md`
- `docs/CODEX-BLUEPRINT.md`
- `.claude/agents/blueprint.md`
- `.claude/settings.json`
- `docs/project-os-packs/cloudflare-fullstack.md`
- `docs/project-os-packs/seo-core.md`
- `docs/project-os-packs/analytics-search.md`

## Safety

The bootstrap script writes only inside the requested target directory. It does
not deploy infrastructure, create secrets, push branches, or overwrite existing
files unless `--force` is provided.

## License

MIT. See `LICENSE`.
