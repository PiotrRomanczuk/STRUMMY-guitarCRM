#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Unbreakable-core tripwire.
 *
 * Reads tasks/unbreakable-core.md, parses each scenario row, and verifies
 * that the test files claimed in the "Test" column actually exist on disk.
 * Reports drift (✅ rows whose test paths are missing) and prints counts.
 *
 * Report-only by default. Exit 1 only on drift, not on remaining ❌ TODOs.
 *
 * Usage:
 *   node scripts/testing/check-unbreakable.cjs           # print + exit 1 on drift
 *   node scripts/testing/check-unbreakable.cjs --strict  # exit 1 if any P0 is ❌
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const SPEC_PATH = path.join(ROOT, 'tasks', 'unbreakable-core.md');
const STRICT = process.argv.includes('--strict');

const STATUS = { GREEN: '✅', PARTIAL: '⚠️', MISSING: '❌' };

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

if (!fs.existsSync(SPEC_PATH)) {
  fail(`spec not found: ${SPEC_PATH}`);
}

const spec = fs.readFileSync(SPEC_PATH, 'utf8');

/** Parse markdown table rows into {id, status, testCell} triples. */
function parseRows(md) {
  const rows = [];
  for (const line of md.split('\n')) {
    if (!line.startsWith('| `')) continue; // only data rows
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 4) continue;
    const [idCell, , statusCell, testCell] = cells;
    const idMatch = idCell.match(/`([^`]+)`/);
    if (!idMatch) continue;
    rows.push({ id: idMatch[1], status: statusCell, testCell });
  }
  return rows;
}

/** Pull test file paths out of the test cell (back-ticked literals). */
function extractTestPaths(cell) {
  const paths = [];
  const re = /`([^`]+\.(?:test|spec)\.[a-z]+)`/g;
  let m;
  while ((m = re.exec(cell)) !== null) paths.push(m[1]);
  return paths;
}

const rows = parseRows(spec);
if (rows.length === 0) {
  fail('no scenario rows parsed from spec — check the table format.');
}

const counts = { green: 0, partial: 0, missing: 0 };
const drift = []; // claimed ✅ or ⚠️ but file not on disk

for (const row of rows) {
  const isGreen = row.status.includes(STATUS.GREEN);
  const isPartial = row.status.includes(STATUS.PARTIAL);
  const isMissing = row.status.includes(STATUS.MISSING);

  if (isGreen) counts.green++;
  else if (isPartial) counts.partial++;
  else if (isMissing) counts.missing++;

  if (isGreen || isPartial) {
    const paths = extractTestPaths(row.testCell);
    for (const p of paths) {
      const abs = path.join(ROOT, p);
      if (!fs.existsSync(abs)) {
        drift.push({ id: row.id, path: p, status: row.status });
      }
    }
  }
}

const total = rows.length;
const pad = (n) => String(n).padStart(3, ' ');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Strummy unbreakable-core status');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  total scenarios:  ${pad(total)}`);
console.log(`  ✅ green:         ${pad(counts.green)}`);
console.log(`  ⚠️  partial:       ${pad(counts.partial)}`);
console.log(`  ❌ missing:       ${pad(counts.missing)}`);
console.log(
  `  coverage:         ${Math.round((counts.green / total) * 1000) / 10}%   (green only)`
);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (drift.length > 0) {
  console.error('');
  console.error('DRIFT — spec claims a test exists but the file is missing:');
  for (const d of drift) {
    console.error(`  ${d.status}  ${d.id}  →  ${d.path}`);
  }
  console.error('');
  console.error(
    'Either restore the test file, fix the path in the spec, or downgrade the status to ❌.'
  );
  process.exit(1);
}

if (STRICT && counts.missing > 0) {
  console.error(`\n--strict mode: ${counts.missing} ❌ scenario(s) still missing.`);
  process.exit(1);
}

console.log('\nNo drift. Spec and codebase are consistent.\n');
