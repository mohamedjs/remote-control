import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : [];
  });
}

test('Modular monolith boundary rules', () => {
  const srcDir = join(process.cwd(), 'src');
  const files = walk(srcDir);

  for (const file of files) {
    const rel = relative(srcDir, file);
    const content = readFileSync(file, 'utf8');
    const imports = [...content.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);

    // Rule 1: domain/ files must never import infrastructure, application, or Node I/O
    if (rel.includes('/domain/')) {
      for (const imp of imports) {
        assert.ok(
          !imp.includes('infrastructure') &&
            !imp.includes('application') &&
            !imp.startsWith('node:fs') &&
            !imp.startsWith('fs') &&
            !imp.startsWith('node:child_process') &&
            !imp.startsWith('child_process') &&
            !imp.startsWith('node:http') &&
            !imp.startsWith('http') &&
            !imp.startsWith('node:net') &&
            !imp.startsWith('net') &&
            !imp.startsWith('express') &&
            !imp.startsWith('ws'),
          `Domain purity violation in ${rel}: forbidden import "${imp}"`,
        );
      }
    }

    // Rule 2: Cross-module imports must go through modules/<other>/index.js
    const modMatch = /^modules\/([^/]+)\//.exec(rel);
    if (modMatch) {
      const currentMod = modMatch[1];
      for (const imp of imports) {
        const crossMatch = /modules\/([^/]+)\/(.+)/.exec(imp);
        if (crossMatch && crossMatch[1] !== currentMod) {
          assert.equal(
            crossMatch[2],
            'index.js',
            `Boundary violation in ${rel}: imported internal path "${imp}" of module "${crossMatch[1]}"`,
          );
        }
      }
    }
  }
});
