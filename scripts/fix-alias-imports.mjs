#!/usr/bin/env node
/**
 * scripts/fix-alias-imports.mjs
 * Migrates internal office imports from `@/` to `@office/`
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OFFICE_DIR = path.join(ROOT, 'src', 'office');

function* walkDir(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      yield fullPath;
    }
  }
}

async function fixAliasImports() {
  console.log('Scanning src/office/ for @/ imports...');
  let fixedCount = 0;
  let totalReplacements = 0;

  for (const file of walkDir(OFFICE_DIR)) {
    const content = fs.readFileSync(file, 'utf-8');
    let replacedCountInFile = 0;

    // Replace static imports: from '@/...' -> from '@office/...'
    let updated = content.replace(/from\s+(['"])@\/([^'"]+)(['"])/g, (match, q1, p1, q2) => {
      replacedCountInFile++;
      return `from ${q1}@office/${p1}${q2}`;
    });

    // Replace dynamic imports: import('@/...') -> import('@office/...')
    updated = updated.replace(/import\(\s*(['"])@\/([^'"]+)(['"])\s*\)/g, (match, q1, p1, q2) => {
      replacedCountInFile++;
      return `import(${q1}@office/${p1}${q2})`;
    });

    if (updated !== content) {
      fs.writeFileSync(file, updated, 'utf-8');
      const rel = path.relative(ROOT, file);
      console.log(`✅ Fixed (${replacedCountInFile} imports): ${rel}`);
      fixedCount++;
      totalReplacements += replacedCountInFile;
    }
  }

  console.log(`\n🎉 Done! Fixed ${fixedCount} files (${totalReplacements} import statements migrated to @office/).`);
}

fixAliasImports().catch((err) => {
  console.error('Error running fixAliasImports:', err);
  process.exit(1);
});
