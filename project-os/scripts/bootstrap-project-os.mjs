#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const target = valueFor('--target');

if (!target) {
  console.error('Usage: node project-os/scripts/bootstrap-project-os.mjs --target <dir> [--dry-run] [--force]');
  process.exit(1);
}

const targetRoot = path.resolve(target);
if (targetRoot === path.parse(targetRoot).root) {
  console.error('Refusing to use filesystem root as target.');
  process.exit(1);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(scriptDir, '..');
const starterKitRoot = path.join(skillRoot, 'assets', 'starter-kit');
const currentDate = new Date().toISOString().slice(0, 10);

const replacements = {
  PROJECT_NAME: valueFor('--project-name') || 'New Project',
  REPOSITORY: valueFor('--repository') || 'owner/repository',
  DEFAULT_BRANCH: valueFor('--default-branch') || 'main',
  BRANCH_PREFIX: valueFor('--branch-prefix') || 'codex/',
  PRIMARY_DOMAIN: valueFor('--primary-domain') || 'https://example.com',
  PRIMARY_LOCALE: valueFor('--primary-locale') || 'en',
  PROFILE: valueFor('--profile') || 'cloudflare-fullstack-saas',
  CURRENT_DATE: currentDate
};

const files = [
  ['templates/manifests/project-os.config.json', 'project-os.config.json'],
  ['templates/manifests/automation-policy.json', 'automation-policy.json'],
  ['templates/manifests/ai-models.json', 'ai-models.json'],
  ['templates/manifests/analytics-policy.json', 'analytics-policy.json'],
  ['templates/manifests/seo-policy.json', 'seo-policy.json'],
  ['templates/manifests/secrets.manifest.json', 'secrets.manifest.json'],
  ['adapters/codex/AGENTS.md', 'AGENTS.md'],
  ['adapters/codex/docs/CODEX-WORKFLOW.md', 'docs/CODEX-WORKFLOW.md'],
  ['adapters/codex/docs/CODEX-BLUEPRINT.md', 'docs/CODEX-BLUEPRINT.md'],
  ['adapters/claude/CLAUDE.md', 'CLAUDE.md'],
  ['adapters/claude/agents/blueprint.md', '.claude/agents/blueprint.md'],
  ['adapters/claude/settings.json', '.claude/settings.json'],
  ['packs/cloudflare-fullstack/README.md', 'docs/project-os-packs/cloudflare-fullstack.md'],
  ['packs/seo-core/README.md', 'docs/project-os-packs/seo-core.md'],
  ['packs/analytics-search/README.md', 'docs/project-os-packs/analytics-search.md']
];

function valueFor(name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] || null;
}

function render(template) {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_match, key) => replacements[key] ?? '');
}

function assertInsideTarget(outputPath) {
  const resolved = path.resolve(outputPath);
  if (resolved !== targetRoot && !resolved.startsWith(`${targetRoot}${path.sep}`)) {
    throw new Error(`Refusing to write outside target: ${resolved}`);
  }
}

for (const [sourceRelative, outputRelative] of files) {
  const sourcePath = path.join(starterKitRoot, sourceRelative);
  const outputPath = path.join(targetRoot, outputRelative);
  assertInsideTarget(outputPath);

  const content = render(readFileSync(sourcePath, 'utf8'));
  const exists = existsSync(outputPath);

  if (dryRun) {
    console.log(`[dry-run] write ${outputRelative}${exists ? ' (overwrite)' : ''}`);
    continue;
  }

  if (exists && !force) {
    console.error(`Refusing to overwrite existing file without --force: ${outputRelative}`);
    process.exit(1);
  }

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, content);
  console.log(`wrote ${outputRelative}`);
}

if (dryRun) {
  console.log(`Dry run complete for ${targetRoot}. No files were written.`);
} else {
  console.log(`Project OS bootstrap complete for ${targetRoot}.`);
}
