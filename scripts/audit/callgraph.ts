#!/usr/bin/env tsx
/**
 * Orphan detector: for each route path in docs/api-inventory.json, grep
 * app/ + components/ + hooks/ + lib/ for callers (literal path or templated
 * path with :params replaced). Routes with zero callers (excluding the route
 * file itself) are tagged `orphan: true`.
 *
 * Run: npm run audit:callgraph
 *
 * Mutates docs/api-inventory.json in place.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const INVENTORY = path.join(REPO_ROOT, 'docs', 'api-inventory.json');
const SEARCH_DIRS = ['app', 'components', 'hooks', 'lib', 'tests', '__tests__'];

interface RouteEntry {
  file: string;
  domain: string;
  path: string;
  methods: string[];
  orphan?: boolean;
  callers?: number;
}

interface Inventory {
  generatedAt: string;
  routes: RouteEntry[];
}

function searchVariants(routePath: string): string[] {
  // /api/lessons/:id  → '/api/lessons/' (prefix) + '/api/lessons' (exact)
  const stripped = routePath.replace(/\/:[^/]+/g, '');
  const variants = new Set<string>([routePath, stripped]);
  // Add intermediate prefixes for nested routes (so /api/lessons matches /api/lessons/foo etc.)
  return [...variants].filter((v) => v.length > 4);
}

function countCallers(routePath: string, ownFile: string): number {
  const variants = searchVariants(routePath);
  let count = 0;
  for (const variant of variants) {
    try {
      const args = [
        '-r',
        '-l',
        '--include=*.ts',
        '--include=*.tsx',
        '--exclude-dir=node_modules',
        '--exclude-dir=.next',
        `--exclude=${path.basename(ownFile)}`,
        variant,
        ...SEARCH_DIRS.filter((d) => fs.existsSync(path.join(REPO_ROOT, d))),
      ];
      const out = execFileSync('grep', args, {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const lines = out.split('\n').filter((l) => l && !l.endsWith(ownFile));
      count += lines.length;
    } catch {
      // grep exits 1 when no matches — that's fine.
    }
  }
  return count;
}

function main(): void {
  const inv = JSON.parse(fs.readFileSync(INVENTORY, 'utf8')) as Inventory;
  let orphanCount = 0;
  for (const route of inv.routes) {
    const callers = countCallers(route.path, route.file);
    route.callers = callers;
    route.orphan = callers === 0;
    if (route.orphan) orphanCount++;
  }
  fs.writeFileSync(INVENTORY, JSON.stringify(inv, null, 2));
  console.log(`Callgraph: ${inv.routes.length} routes scanned, ${orphanCount} orphan candidates.`);
  if (orphanCount > 0) {
    console.log('Orphans:');
    for (const r of inv.routes.filter((r) => r.orphan)) {
      console.log(`  ${r.path}`);
    }
  }
}

main();
