#!/usr/bin/env node

import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const target = path.resolve(valueFor('--target') || '.');
const yes = args.includes('--yes');
const force = args.includes('--force');
const useMySecrets = args.includes('--use-my-secrets') || args.includes('--seed-local-secrets');
const allowUnignoredEnv = args.includes('--allow-unignored-env');
const profileFile = resolveProfileFile(valueFor('--profile-file'));

if (target === path.parse(target).root) {
  console.error('Refusing to use filesystem root as target.');
  process.exit(1);
}

if (useMySecrets && !profileFile) {
  console.error('Could not find a private Project OS profile. Set PROJECT_OS_PROFILE or create ~/.config/project-os/personal.json.');
  process.exit(1);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const bootstrapScript = path.join(scriptDir, 'bootstrap-project-os.mjs');
const checkScript = path.join(scriptDir, 'check-project-os.mjs');
const seedScript = path.join(scriptDir, 'seed-project-secrets.mjs');

const bootstrapArgs = [
  bootstrapScript,
  '--target',
  target,
  ...(profileFile ? ['--profile-file', profileFile] : []),
  ...(force ? ['--force'] : []),
  ...(!yes ? ['--dry-run'] : [])
];

run('bootstrap', bootstrapArgs);

if (!yes) {
  if (useMySecrets) {
    run('secret seed dry run', [
      seedScript,
      '--dry-run',
      '--target',
      target,
      '--profile-file',
      profileFile
    ]);
  }
  console.log('Dry run complete. Re-run with --yes to write files.');
  process.exit(0);
}

run('check', [checkScript, '--root', target]);

if (useMySecrets) {
  run('secret seed', [
    seedScript,
    '--write-env-local',
    '--ensure-gitignore',
    '--target',
    target,
    '--profile-file',
    profileFile,
    ...(force ? ['--force'] : []),
    ...(allowUnignoredEnv ? ['--allow-unignored-env'] : [])
  ]);
}

console.log('Project OS apply complete.');

function valueFor(name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] || null;
}

function resolveProfileFile(explicitProfileFile) {
  const candidates = [
    explicitProfileFile,
    process.env.PROJECT_OS_PROFILE,
    process.env.HOME ? path.join(process.env.HOME, '.config', 'project-os', 'personal.json') : null,
    process.env.HOME ? path.join(process.env.HOME, '.project-os', 'profile.json') : null
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (existsSync(resolved)) return resolved;
  }

  return null;
}

function run(label, commandArgs) {
  const result = spawnSync(process.execPath, commandArgs, {
    stdio: 'inherit',
    env: process.env
  });

  if (result.error) {
    console.error(`${label} failed: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`${label} exited with status ${result.status}.`);
    process.exit(result.status || 1);
  }
}
