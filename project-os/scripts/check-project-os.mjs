#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const root = path.resolve(valueFor('--root') || '.');
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(scriptDir, '..');
const starterKitRoot = path.join(skillRoot, 'assets', 'starter-kit');
const failures = [];

function valueFor(name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] || null;
}

function valuesFor(name) {
  const values = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === name && args[index + 1]) {
      values.push(args[index + 1]);
    }
  }
  return values;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mentionsReviewVerdict(text) {
  return /review\s+verdict/i.test(text);
}

function fail(message) {
  failures.push(message);
}

function filePath(...parts) {
  return path.join(root, ...parts);
}

function readTextFrom(base, relativePath, label, options = {}) {
  const fullPath = path.join(base, relativePath);
  if (!existsSync(fullPath)) {
    if (!options.optional) fail(`Missing required ${label}: ${relativePath}`);
    return '';
  }
  return readFileSync(fullPath, 'utf8');
}

function readText(relativePath, options = {}) {
  return readTextFrom(root, relativePath, 'file', options);
}

function readKitText(relativePath, options = {}) {
  return readTextFrom(starterKitRoot, relativePath, 'starter-kit file', options);
}

function readJson(relativePath, options = {}) {
  const text = readText(relativePath, options);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`Invalid JSON in ${relativePath}: ${error.message}`);
    return null;
  }
}

function readKitJson(relativePath, options = {}) {
  const text = readKitText(relativePath, options);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`Invalid JSON in bundled ${relativePath}: ${error.message}`);
    return null;
  }
}

function walkFilesFrom(base, relativeDir, label) {
  const dir = path.join(base, relativeDir);
  if (!existsSync(dir)) {
    fail(`Missing required ${label}: ${relativeDir}`);
    return [];
  }

  const files = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of readdirSync(current)) {
      const full = path.join(current, entry);
      const stats = statSync(full);
      if (stats.isDirectory()) {
        stack.push(full);
      } else {
        files.push(path.relative(base, full));
      }
    }
  }
  return files.sort();
}

function walkFiles(relativeDir) {
  return walkFilesFrom(root, relativeDir, 'directory');
}

function walkKitFiles(relativeDir) {
  return walkFilesFrom(starterKitRoot, relativeDir, 'starter-kit directory');
}

const requiredRootJson = [
  'project-os.config.json',
  'automation-policy.json',
  'ai-models.json',
  'seo-policy.json',
  'secrets.manifest.json',
];

const rootJson = new Map(requiredRootJson.map((file) => [file, readJson(file)]));

const requiredSchemas = [
  'contracts/project-os.schema.json',
  'contracts/automation-policy.schema.json',
  'contracts/ai-models.schema.json',
  'contracts/seo-policy.schema.json',
  'contracts/secrets.manifest.schema.json',
];

for (const schemaPath of requiredSchemas) {
  const schema = readKitJson(schemaPath);
  if (schema && !schema.$schema) {
    fail(`Bundled ${schemaPath} must declare $schema.`);
  }
}

for (const template of walkKitFiles('templates')) {
  if (template.endsWith('.json')) {
    readKitJson(template);
  }
}

const projectConfig = rootJson.get('project-os.config.json');
if (projectConfig) {
  if (projectConfig.workflow?.reviewVerdictRequired !== true) {
    fail('project-os.config.json must require review verdicts.');
  }
  if (projectConfig.workflow?.issueRequiredForSourceEdits !== true) {
    fail('project-os.config.json must require an issue before source edits.');
  }
  if (!projectConfig.portability?.extractable) {
    fail('project-os.config.json must mark portability.extractable as true.');
  }
}

const automationPolicy = rootJson.get('automation-policy.json');
if (automationPolicy) {
  for (const [laneName, lane] of Object.entries(automationPolicy.nonDefaultLanes || {})) {
    if (lane.enabledByDefault !== false) {
      fail(`automation-policy.json nonDefaultLanes.${laneName}.enabledByDefault must be false.`);
    }
  }
}

const aiModels = rootJson.get('ai-models.json');
if (aiModels) {
  if (aiModels.policy?.modelsAreConfiguration !== true) {
    fail('ai-models.json must mark models as configuration.');
  }
  if (aiModels.policy?.fallbackRequiredForCustomerFacingAI !== true) {
    fail('ai-models.json must require fallbacks for customer-facing AI.');
  }
}

const seoPolicy = rootJson.get('seo-policy.json');
if (seoPolicy) {
  const primary = seoPolicy.coreWebVitals?.primaryMetrics || [];
  const deprecated = seoPolicy.coreWebVitals?.deprecatedMetrics || [];
  if (!primary.includes('INP')) {
    fail('seo-policy.json must include INP as a primary Core Web Vital.');
  }
  if (primary.includes('FID')) {
    fail('seo-policy.json must not include FID as a primary Core Web Vital.');
  }
  if (!deprecated.includes('FID')) {
    fail('seo-policy.json should list FID as deprecated.');
  }
  if (seoPolicy.metadata?.metaKeywordsRankingDependencyAllowed !== false) {
    fail('seo-policy.json must disallow meta keywords as a ranking dependency.');
  }
}

const secretsManifest = rootJson.get('secrets.manifest.json');
if (secretsManifest) {
  if (secretsManifest.policy?.valuesAllowed !== false) {
    fail('secrets.manifest.json must set policy.valuesAllowed to false.');
  }
  for (const secret of secretsManifest.secrets || []) {
    if ('value' in secret) {
      fail(`secrets.manifest.json must not contain a value field for ${secret.name || '<unnamed secret>'}.`);
    }
    if (!/^[A-Z0-9_]+$/.test(secret.name || '')) {
      fail(`Secret name must be uppercase snake case: ${secret.name || '<missing>'}.`);
    }
  }
}

const codexAgent = readText('AGENTS.md');
if (codexAgent && !mentionsReviewVerdict(codexAgent)) {
  fail('Codex AGENTS adapter must reference review verdicts.');
}
if (codexAgent && !/\.claude\/\.plan-review-approved/.test(codexAgent)) {
  fail('Codex AGENTS adapter must reference .claude/.plan-review-approved.');
}

const codexWorkflow = readText('docs/CODEX-WORKFLOW.md');
if (codexWorkflow && !/\.claude\/\.plan-review-approved/.test(codexWorkflow)) {
  fail('Codex workflow adapter must reference .claude/.plan-review-approved.');
}

const codexBlueprint = readText('docs/CODEX-BLUEPRINT.md');
if (codexBlueprint && !mentionsReviewVerdict(codexBlueprint)) {
  fail('Codex Blueprint docs must reference review verdicts.');
}

const claudeRoot = readText('CLAUDE.md');
if (claudeRoot && !mentionsReviewVerdict(claudeRoot)) {
  fail('Claude adapter must reference review verdicts.');
}

const claudeAgent = readText('.claude/agents/blueprint.md');
if (claudeAgent && !/\.claude\/\.blueprint-approved/.test(claudeAgent)) {
  fail('Claude Blueprint adapter must reference .claude/.blueprint-approved.');
}
if (claudeAgent && !mentionsReviewVerdict(claudeAgent)) {
  fail('Claude Blueprint adapter must reference review verdicts.');
}

const claudeSettings = readJson('.claude/settings.json');
if (claudeSettings) {
  const settingsText = readText('.claude/settings.json');
  if (!settingsText.includes('.blueprint-approved') || !settingsText.includes('.plan-review-approved')) {
    fail('Claude settings adapter must recognize both review markers.');
  }
}

const sourceMarkers = [
  projectConfig?.project?.name,
  projectConfig?.project?.repository,
  projectConfig?.project?.primaryDomain,
  projectConfig?.automation?.notificationTopic,
  projectConfig?.automation?.notificationIssue == null ? null : String(projectConfig.automation.notificationIssue),
  ...valuesFor('--banned-pattern')
].filter((value) => typeof value === 'string' && value.length >= 4);

const bannedTemplatePatterns = sourceMarkers.map((value) => new RegExp(escapeRegExp(value), 'i'));

for (const dir of ['templates', 'adapters', 'packs']) {
  for (const file of walkKitFiles(dir)) {
    const text = readKitText(file);
    for (const pattern of bannedTemplatePatterns) {
      if (pattern.test(text)) {
        fail(`Bundled ${file} contains project-specific text matching ${pattern}.`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error('Project OS check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Project OS check passed.');
