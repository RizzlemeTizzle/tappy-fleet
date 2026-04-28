#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const apiRoot = join(root, 'app', 'api');
const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
const failures = [];

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.name === 'route.ts') {
      files.push(fullPath);
    }
  }

  return files;
}

if (!existsSync(apiRoot)) {
  failures.push('Missing app/api directory.');
} else {
  for (const file of walk(apiRoot)) {
    const source = readFileSync(file, 'utf8');
    const rel = relative(root, file).replaceAll('\\', '/');
    const exportedMethods = httpMethods.filter((method) => {
      const pattern = new RegExp(`export\\s+(?:(?:async\\s+)?function\\s+${method}\\b|const\\s+${method}\\b)`);
      return pattern.test(source);
    });

    if (exportedMethods.length === 0) {
      failures.push(`${rel} does not export an HTTP route handler.`);
      continue;
    }

    if (exportedMethods.some((method) => mutatingMethods.includes(method))) {
      if (rel === 'app/api/auth/clear-cookie/route.ts') {
        continue;
      }

      const referencesBackend = /apiFetch|NEXT_PUBLIC_API_URL|fetch\(/.test(source);
      const handlesErrors = /try\s*{|catch\s*\(|Unauthorized|backendRes\.status/.test(source);

      if (!referencesBackend) {
        failures.push(`${rel} exports a mutating handler without an obvious backend proxy call.`);
      }

      if (!handlesErrors) {
        failures.push(`${rel} exports a mutating handler without an explicit error path.`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error('Route handler smoke tests failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Route handler smoke tests passed.');
