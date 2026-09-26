#!/usr/bin/env node
/**
 * scripts/fix-alias-imports.mjs
 * Migrates internal office imports from `@/` to `@office/`,
 * and optionally updates relative imports across `src/` to use
 * `@components/`, `@hooks/`, `@lib/`, `@office/`, etc.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
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
  console.log('🚀 Running Alias Migration across src/ ...');
  let fixedCount = 0;
  let totalReplacements = 0;

  // 1. First ensure all files in src/office/ have @/ migrated to @office/
  for (const file of walkDir(OFFICE_DIR)) {
    const content = fs.readFileSync(file, 'utf-8');
    let replacedInFile = 0;

    let updated = content.replace(/from\s+(['"])@\/([^'"]+)(['"])/g, (match, q1, p1, q2) => {
      replacedInFile++;
      return `from ${q1}@office/${p1}${q2}`;
    });

    updated = updated.replace(/import\(\s*(['"])@\/([^'"]+)(['"])\s*\)/g, (match, q1, p1, q2) => {
      replacedInFile++;
      return `import(${q1}@office/${p1}${q2})`;
    });

    if (updated !== content) {
      fs.writeFileSync(file, updated, 'utf-8');
      const rel = path.relative(ROOT, file);
      console.log(`✅ [Office Internal] Fixed ${replacedInFile} imports in: ${rel}`);
      fixedCount++;
      totalReplacements += replacedInFile;
    }
  }

  // 2. In src/App.tsx and top-level src/ files, migrate relative paths to aliases
  for (const file of walkDir(SRC_DIR)) {
    // Only target files directly in src/ (like App.tsx) to avoid unintended relative submodule breaks
    if (path.dirname(file) !== SRC_DIR) continue;

    const content = fs.readFileSync(file, 'utf-8');
    let replacedInFile = 0;

    let updated = content
      .replace(/from\s+(['"])\.\/components\/([^'"]+)(['"])/g, (m, q1, p, q2) => {
        replacedInFile++;
        return `from ${q1}@components/${p}${q2}`;
      })
      .replace(/from\s+(['"])\.\/hooks\/([^'"]+)(['"])/g, (m, q1, p, q2) => {
        replacedInFile++;
        return `from ${q1}@hooks/${p}${q2}`;
      })
      .replace(/from\s+(['"])\.\/lib\/([^'"]+)(['"])/g, (m, q1, p, q2) => {
        replacedInFile++;
        return `from ${q1}@lib/${p}${q2}`;
      })
      .replace(/from\s+(['"])\.\/office\/([^'"]+)(['"])/g, (m, q1, p, q2) => {
        replacedInFile++;
        return `from ${q1}@office/${p}${q2}`;
      })
      .replace(/from\s+(['"])\.\/services\/([^'"]+)(['"])/g, (m, q1, p, q2) => {
        replacedInFile++;
        return `from ${q1}@/services/${p}${q2}`;
      });

    if (updated !== content) {
      fs.writeFileSync(file, updated, 'utf-8');
      const rel = path.relative(ROOT, file);
      console.log(`✅ [Top-Level Src] Fixed ${replacedInFile} imports in: ${rel}`);
      fixedCount++;
      totalReplacements += replacedInFile;
    }
  }

  console.log(`\n🎉 Alias Migration Completed! Total files updated: ${fixedCount}, replacements: ${totalReplacements}`);
}

fixAliasImports().catch((err) => {
  console.error('Error running fixAliasImports:', err);
  process.exit(1);
});
