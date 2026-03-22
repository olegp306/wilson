/**
 * Verifies CommonJS require() can load internal packages (via package.json exports)
 * and a built Nest app module.
 *
 * Run from repo root after: pnpm install && pnpm run build
 *
 * Note: Root workspace may not symlink @wilson/* into root node_modules; we require
 * each package directory so Node resolves "main" / "exports" the same way as nested deps.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const root = path.resolve(__dirname, '../..');

function requirePackageDir(relDir, label) {
  const pkgRoot = path.join(root, 'packages', relDir);
  const indexJs = path.join(pkgRoot, 'dist', 'index.js');
  if (!fs.existsSync(indexJs)) {
    console.error(`Missing ${label} build output: ${indexJs}`);
    console.error('Run: pnpm run build');
    process.exit(1);
  }
  require(pkgRoot);
  console.log('ok require:', label, '->', path.relative(root, pkgRoot));
}

/** Same resolution path Nest apps use: package name from app directory. */
function requireFromOrchestrator(spec) {
  const orchestratorPkgJson = path.join(root, 'apps/orchestrator/package.json');
  const req = createRequire(orchestratorPkgJson);
  req.resolve(spec);
  req(spec);
  console.log('ok createRequire(apps/orchestrator):', spec);
}

const internalPackages = [
  ['shared-types', '@wilson/shared-types'],
  ['event-contracts', '@wilson/event-contracts'],
  ['config', '@wilson/config'],
  ['logger', '@wilson/logger'],
  ['db', '@wilson/db'],
  ['integration-sdk', '@wilson/integration-sdk'],
  ['auth', '@wilson/auth'],
];

for (const [dir, label] of internalPackages) {
  requirePackageDir(dir, label);
}

requireFromOrchestrator('@wilson/event-contracts');

const orchestratorModule = path.join(root, 'apps/orchestrator/dist/app.module.js');
if (!fs.existsSync(orchestratorModule)) {
  console.error('Missing orchestrator build:', orchestratorModule);
  console.error('Run: pnpm run build');
  process.exit(1);
}

require(orchestratorModule);
console.log('ok require: apps/orchestrator/dist/app.module.js');

console.log('verify-runtime-load: all checks passed');
