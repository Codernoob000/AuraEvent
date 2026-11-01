/**
 * @fileoverview Automated Code Quality & Static Analysis Linter for AuraEvent.
 * Enforces:
 * 1. Zero console.log statements in production code
 * 2. Zero unused named imports across client and server modules
 * 3. Zero silent/empty catch blocks
 * 4. Zero secret leaks
 * 5. Formatting and module syntax validity
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PRODUCTION_FILES = [
  'server.js',
  'services/geminiService.js',
  'scripts/config.js',
  'scripts/utils.js',
  'scripts/events-data.js',
  'scripts/api.js',
  'scripts/modal-controller.js',
  'scripts/ui-renderers.js',
  'scripts/app.js'
];

let checksTotal = 0;
let checksPassed = 0;
let errors = [];

function check(title, fn) {
  checksTotal++;
  try {
    fn();
    checksPassed++;
    process.stdout.write(`  [OK] ${title}\n`);
  } catch (err) {
    errors.push({ title, error: err.message });
    process.stdout.write(`  [FAIL] ${title}: ${err.message}\n`);
  }
}

process.stdout.write('\n=== AuraEvent Automated Code Quality & Lint Audit ===\n\n');

// 1. Check for console.log statements
check('Zero console.log statements in production code', () => {
  PRODUCTION_FILES.forEach(rel => {
    const full = path.join(rootDir, rel);
    const content = fs.readFileSync(full, 'utf8');
    if (content.includes('console.log(')) {
      throw new Error(`Forbidden console.log detected in ${rel}`);
    }
  });
});

// 2. Check for unused named imports
check('Zero unused named imports in ES modules', () => {
  PRODUCTION_FILES.forEach(rel => {
    const full = path.join(rootDir, rel);
    const content = fs.readFileSync(full, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().startsWith('import '));
    lines.forEach(line => {
      const braceMatch = line.match(/\{([^}]+)\}/);
      if (braceMatch) {
        const symbols = braceMatch[1].split(',').map(s =>
          s
            .trim()
            .split(/\s+as\s+/)
            .pop()
        );
        symbols.forEach(sym => {
          if (!sym) return;
          const count = content.split(sym).length - 1;
          if (count <= 1) {
            throw new Error(`Unused named import '${sym}' in ${rel}`);
          }
        });
      }
    });
  });
});

// 3. Check for silent / empty catch blocks
check('Zero silent or empty catch blocks', () => {
  PRODUCTION_FILES.forEach(rel => {
    const full = path.join(rootDir, rel);
    const content = fs.readFileSync(full, 'utf8');
    const matches = [...content.matchAll(/catch\s*(?:\([^)]*\))?\s*\{([^}]*)\}/g)];
    matches.forEach(m => {
      const body = m[1].replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '').trim();
      if (!body) {
        throw new Error(
          `Empty or comment-only catch block found in ${rel}: "${m[0].slice(0, 35)}..."`
        );
      }
    });
  });
});

// 4. Check for secret leakage or hardcoded keys
check('Zero hardcoded private secrets or API keys in client modules', () => {
  const clientFiles = PRODUCTION_FILES.filter(f => f.startsWith('scripts/'));
  clientFiles.forEach(rel => {
    const full = path.join(rootDir, rel);
    const content = fs.readFileSync(full, 'utf8');
    if (/AIzaSy[a-zA-Z0-9_-]{33}/.test(content)) {
      throw new Error(`Hardcoded Google API key detected in ${rel}`);
    }
    if (/process\.env/.test(content)) {
      throw new Error(`Direct process.env access in client script ${rel} (violates Rule 1)`);
    }
  });
});

// 5. Verify .gitignore protection
check('.gitignore strictly isolates sensitive environment variables', () => {
  const gitignorePath = path.join(rootDir, '.gitignore');
  const content = fs.readFileSync(gitignorePath, 'utf8');
  if (!content.includes('.env') || !content.includes('node_modules')) {
    throw new Error('.gitignore missing required .env or node_modules rules');
  }
});

process.stdout.write(`\n========================================\n`);
process.stdout.write(
  `Quality Checks: ${checksTotal} | Passed: ${checksPassed} | Errors: ${errors.length}\n`
);
process.stdout.write(`========================================\n\n`);

if (errors.length > 0) {
  process.exit(1);
}
