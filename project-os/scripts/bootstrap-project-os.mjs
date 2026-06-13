#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const target = valueFor('--target');
const profileFile = valueFor('--profile-file');

if (!target) {
  console.error('Usage: node project-os/scripts/bootstrap-project-os.mjs --target <dir> [--profile-file <private-profile.json>] [--dry-run] [--force]');
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
const currentDate = localDateString();
const profile = profileFile ? readJson(path.resolve(profileFile), 'profile file') : {};
const profileReplacements = replacementsFromProfile(profile);

const replacements = {
  PROJECT_NAME: 'New Project',
  REPOSITORY: 'owner/repository',
  DEFAULT_BRANCH: 'main',
  BRANCH_PREFIX: 'codex/',
  PRIMARY_DOMAIN: 'https://example.com',
  PRIMARY_LOCALE: 'en',
  PROFILE: 'cloudflare-fullstack-saas',
  GA4_MEASUREMENT_ID: 'unset',
  GA4_PROPERTY_ID: 'unset',
  GA4_PRODUCTION_MEASUREMENT_ID: 'unset',
  GA4_PRODUCTION_PROPERTY_ID: 'unset',
  GA4_STAGING_MEASUREMENT_ID: 'unset',
  GA4_STAGING_PROPERTY_ID: 'unset',
  GA4_SERVICE_ACCOUNT_SECRET_NAME: 'GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON',
  GSC_PROPERTY_TYPE: 'domain',
  GSC_VERIFICATION_METHOD: 'dns-txt',
  GSC_SERVICE_ACCOUNT_SECRET_NAME: 'GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON',
  CURRENT_DATE: currentDate,
  ...profileReplacements,
  ...removeEmpty({
    PROJECT_NAME: valueFor('--project-name'),
    REPOSITORY: valueFor('--repository'),
    DEFAULT_BRANCH: valueFor('--default-branch'),
    BRANCH_PREFIX: valueFor('--branch-prefix'),
    PRIMARY_DOMAIN: valueFor('--primary-domain'),
    PRIMARY_LOCALE: valueFor('--primary-locale'),
    PROFILE: valueFor('--profile')
  })
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

function readJson(file, label) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    console.error(`Could not read ${label} ${file}: ${error.message}`);
    process.exit(1);
  }
}

function replacementsFromProfile(profile) {
  const defaults = profile.defaults || {};
  const project = profile.project || {};
  const analytics = profile.analytics || {};
  const ga4 = analytics.googleAnalytics4 || analytics.ga4 || {};
  const gsc = analytics.googleSearchConsole || analytics.gsc || {};

  return removeEmpty({
    PROJECT_NAME: project.name,
    REPOSITORY: project.repository,
    DEFAULT_BRANCH: project.defaultBranch || defaults.defaultBranch,
    BRANCH_PREFIX: project.branchPrefix || defaults.branchPrefix,
    PRIMARY_DOMAIN: project.primaryDomain,
    PRIMARY_LOCALE: project.primaryLocale || defaults.primaryLocale,
    PROFILE: defaults.profile,
    GA4_MEASUREMENT_ID: ga4.measurementId,
    GA4_PROPERTY_ID: ga4.propertyId,
    GA4_PRODUCTION_MEASUREMENT_ID: ga4.productionMeasurementId || ga4.measurementId,
    GA4_PRODUCTION_PROPERTY_ID: ga4.productionPropertyId || ga4.propertyId,
    GA4_STAGING_MEASUREMENT_ID: ga4.stagingMeasurementId,
    GA4_STAGING_PROPERTY_ID: ga4.stagingPropertyId,
    GA4_SERVICE_ACCOUNT_SECRET_NAME: ga4.serviceAccountSecretName,
    GSC_PROPERTY_TYPE: gsc.propertyType,
    GSC_VERIFICATION_METHOD: gsc.verificationMethod,
    GSC_SERVICE_ACCOUNT_SECRET_NAME: gsc.serviceAccountSecretName
  });
}

function removeEmpty(values) {
  return Object.fromEntries(
    Object.entries(values).filter(([_key, value]) => typeof value === 'string' && value.length > 0)
  );
}

function localDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
