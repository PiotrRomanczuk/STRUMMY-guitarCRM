#!/usr/bin/env tsx
/**
 * Scaffold one .bru file per (method × route) from docs/api-inventory.json.
 *
 * Hand-edited files are preserved: any .bru with `hand-edited` in its
 * meta name is skipped on regeneration.
 *
 * Run: npm run audit:bruno
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const INVENTORY = path.join(REPO_ROOT, 'docs', 'api-inventory.json');
const BRUNO_ROOT = path.join(REPO_ROOT, 'bruno', 'strummy');

const RESERVED = new Set(['_auth', 'environments']);

interface RouteEntry {
  file: string;
  domain: string;
  path: string;
  methods: string[];
  auth: {
    requiresUser: boolean;
    requiresAdminClient: boolean;
    requiresCronSecret: boolean;
    requiresApiKey: boolean;
    requiresServiceRole: boolean;
    roleChecks: string[];
  };
  schemas: string[];
  orphan?: boolean;
}

function slugify(routePath: string): string {
  return (
    routePath
      .replace(/^\/api\/?/, '')
      .replace(/\//g, '-')
      .replace(/:/g, '')
      .replace(/[^a-z0-9-]/gi, '')
      .toLowerCase() || 'root'
  );
}

function pathWithSampleParams(routePath: string): string {
  return routePath.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => `{{sample_${name}}}`);
}

function buildBru(route: RouteEntry, method: string, seq: number): string {
  const slug = slugify(route.path);
  const name = `${method.toLowerCase()}-${slug}`;
  const url = `{{baseUrl}}${pathWithSampleParams(route.path)}`;

  const usesCron = route.auth.requiresCronSecret;
  const usesApiKey = route.auth.requiresApiKey;
  const usesServiceRole = route.auth.requiresServiceRole;

  let authBlock = '';
  if (usesCron) {
    authBlock = 'auth:bearer {\n  token: {{CRON_SECRET}}\n}\n';
  } else if (usesApiKey) {
    authBlock = 'auth:bearer {\n  token: {{API_KEY}}\n}\n';
  } else if (usesServiceRole) {
    authBlock = 'auth:bearer {\n  token: {{SUPABASE_SERVICE_ROLE_KEY}}\n}\n';
  }

  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);
  const bodyBlock = hasBody ? `body { json }\n\nbody:json {\n  {}\n}\n` : '';

  const authSummary =
    [
      route.auth.requiresUser && 'user',
      route.auth.requiresAdminClient && 'admin-client',
      route.auth.requiresCronSecret && 'cron-secret',
      route.auth.requiresApiKey && 'api-key',
      route.auth.requiresServiceRole && 'service-role',
      route.auth.roleChecks.length && `role:${route.auth.roleChecks.join('+')}`,
    ]
      .filter(Boolean)
      .join(', ') || 'none';
  const orphanTag = route.orphan ? ' [orphan]' : '';
  const schemaTag = route.schemas.length ? ` schemas=${route.schemas.join(',')}` : '';

  return `meta {
  name: ${name}
  type: http
  seq: ${seq}
}

${method.toLowerCase()} {
  url: ${url}
  ${hasBody ? 'body: json\n  ' : ''}auth: ${usesCron || usesApiKey || usesServiceRole ? 'bearer' : 'inherit'}
}

${authBlock}${bodyBlock}docs {
  Domain ${route.domain}${orphanTag}. Auth ${authSummary}.${schemaTag}
}
`;
}

function isHandEdited(file: string): boolean {
  if (!fs.existsSync(file)) return false;
  const head = fs.readFileSync(file, 'utf8').slice(0, 400);
  return head.includes('hand-edited');
}

function main(): void {
  const inv = JSON.parse(fs.readFileSync(INVENTORY, 'utf8')) as { routes: RouteEntry[] };
  let created = 0;
  let skipped = 0;
  const seqByDomain = new Map<string, number>();

  for (const route of inv.routes) {
    if (RESERVED.has(route.domain)) continue;
    if (route.methods.length === 0) continue;
    const domainDir = path.join(BRUNO_ROOT, route.domain);
    fs.mkdirSync(domainDir, { recursive: true });

    for (const method of route.methods) {
      const seq = (seqByDomain.get(route.domain) ?? 0) + 1;
      seqByDomain.set(route.domain, seq);

      const slug = slugify(route.path);
      const file = path.join(domainDir, `${method.toLowerCase()}-${slug}.bru`);

      if (isHandEdited(file)) {
        skipped++;
        continue;
      }

      fs.writeFileSync(file, buildBru(route, method, seq));
      created++;
    }
  }

  console.log(`Bruno scaffold: ${created} files generated, ${skipped} hand-edited skipped.`);
  console.log(`  → ${path.relative(REPO_ROOT, BRUNO_ROOT)}`);
}

main();
