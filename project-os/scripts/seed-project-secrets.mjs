#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const target = valueFor('--target');
const profileFile = valueFor('--profile-file');
const dryRun = args.includes('--dry-run');
const writeEnvLocal = args.includes('--write-env-local');
const force = args.includes('--force');
const allowUnignoredEnv = args.includes('--allow-unignored-env');

if (!target || !profileFile || (!dryRun && !writeEnvLocal)) {
  console.error('Usage: node project-os/scripts/seed-project-secrets.mjs --target <dir> --profile-file <private-profile.json> (--dry-run | --write-env-local) [--force]');
  process.exit(1);
}

const targetRoot = path.resolve(target);
if (targetRoot === path.parse(targetRoot).root) {
  console.error('Refusing to use filesystem root as target.');
  process.exit(1);
}

const profile = readJson(path.resolve(profileFile), 'profile file');
const secretSources = profile.secretSources || {};
const entries = Object.entries(secretSources);

if (entries.length === 0) {
  console.error('Profile has no secretSources entries.');
  process.exit(1);
}

const missing = [];
const available = [];

for (const [secretName, source] of entries) {
  if (!/^[A-Z0-9_]+$/.test(secretName)) {
    console.error(`Invalid secret name: ${secretName}`);
    process.exit(1);
  }

  const envName = source.fromEnv || secretName;
  const value = process.env[envName];
  if (!value) {
    if (source.required === true) {
      missing.push(`${secretName} from ${envName}`);
    }
    continue;
  }

  available.push({ secretName, envName, value });
}

if (missing.length > 0) {
  console.error('Missing required secret source environment variables:');
  for (const item of missing) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

if (dryRun) {
  console.log(`Secret seed dry run for ${targetRoot}. Values are not printed.`);
  console.log(`Available secrets: ${available.map((entry) => entry.secretName).join(', ') || 'none'}`);
  const optionalMissing = entries
    .filter(([name, source]) => source.required !== true && !process.env[source.fromEnv || name])
    .map(([name]) => name);
  if (optionalMissing.length > 0) {
    console.log(`Optional missing secrets: ${optionalMissing.join(', ')}`);
  }
  process.exit(0);
}

if (writeEnvLocal) {
  assertEnvLocalIgnored(targetRoot);
  const envPath = path.join(targetRoot, '.env.local');
  const existingText = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
  const result = upsertEnv(existingText, available, force);
  mkdirSync(path.dirname(envPath), { recursive: true });
  writeFileSync(envPath, result.text);
  console.log(`Wrote .env.local for ${targetRoot}. Values are not printed.`);
  console.log(`Added: ${result.added.length === 0 ? 'none' : result.added.join(', ')}`);
  console.log(`Updated: ${result.updated.length === 0 ? 'none' : result.updated.join(', ')}`);
  console.log(`Skipped existing: ${result.skipped.length === 0 ? 'none' : result.skipped.join(', ')}`);
}

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

function assertEnvLocalIgnored(root) {
  if (allowUnignoredEnv) return;

  const gitignorePath = path.join(root, '.gitignore');
  if (!existsSync(gitignorePath)) {
    console.error('Refusing to write .env.local because .gitignore is missing. Add .env.local to .gitignore or pass --allow-unignored-env.');
    process.exit(1);
  }

  const gitignore = readFileSync(gitignorePath, 'utf8');
  const ignoresEnvLocal = gitignore
    .split(/\r?\n/)
    .map((line) => line.trim())
    .some((line) => line === '.env.local' || line === '.env*' || line === '*.local');

  if (!ignoresEnvLocal) {
    console.error('Refusing to write .env.local because .gitignore does not ignore it. Add .env.local to .gitignore or pass --allow-unignored-env.');
    process.exit(1);
  }
}

function upsertEnv(existingText, entriesToWrite, overwrite) {
  const lines = existingText.length > 0 ? existingText.split(/\r?\n/) : [];
  const keyToLineIndex = new Map();

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (match) keyToLineIndex.set(match[1], index);
  }

  const added = [];
  const updated = [];
  const skipped = [];

  for (const entry of entriesToWrite) {
    const line = `${entry.secretName}=${formatEnvValue(entry.value)}`;
    if (keyToLineIndex.has(entry.secretName)) {
      if (!overwrite) {
        skipped.push(entry.secretName);
        continue;
      }
      lines[keyToLineIndex.get(entry.secretName)] = line;
      updated.push(entry.secretName);
      continue;
    }

    lines.push(line);
    added.push(entry.secretName);
  }

  return {
    text: `${lines.join('\n').replace(/\n+$/, '')}\n`,
    added,
    updated,
    skipped
  };
}

function formatEnvValue(value) {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(value)) {
    return value;
  }
  return JSON.stringify(value);
}
