#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { validateCatalog } from '../worker/catalog.js';

const args = process.argv.slice(2);
const production = args.includes('--production');
const files = args.filter((arg) => arg !== '--production');
if (files.length > 1 || files.some((arg) => arg.startsWith('-'))) {
  process.stderr.write('Usage: node tools/release-catalog.mjs [catalog.json] [--production]\n');
  process.exitCode = 1;
} else {
  try {
    const file = files[0] || new URL('../catalog/releases.json', import.meta.url);
    const doc = JSON.parse(await readFile(file, 'utf8'));
    const assets = validateCatalog(doc, { production });
    process.stdout.write(`Release catalog valid: ${assets.size} listed assets${production ? ' (production)' : ''}.\n`);
  } catch {
    // JSON parser messages may include input; report only the validation outcome.
    process.stderr.write('Release catalog is invalid or unavailable.\n');
    process.exitCode = 1;
  }
}
