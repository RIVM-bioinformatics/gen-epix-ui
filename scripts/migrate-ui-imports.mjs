#!/usr/bin/env node
/**
 * Migrates `@gen-epix/ui` barrel imports to individual sub-path imports.
 * Usage: node scripts/migrate-ui-imports.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

// ── 1. Parse export sub-paths from packages/ui/package.json ──────────────────
const uiPkg = JSON.parse(readFileSync(join(ROOT, 'packages/ui/package.json'), 'utf8'));
const exportPaths = Object.keys(uiPkg.exports); // e.g. ["./classes/services/ConfigService", ...]

// ── 2. For each export path, resolve source and extract exported symbol names ─
function extractExportsFromFile(filePath) {
  try {
    const src = readFileSync(filePath, 'utf8');
    const symbols = new Set();

    // export { Foo, Bar } or export { Foo as default }
    for (const m of src.matchAll(/^export\s+(?:type\s+)?\{([^}]+)\}/gm)) {
      for (const s of m[1].split(',')) {
        const name = s.trim().split(/\s+as\s+/)[0].trim();
        if (name) symbols.add(name);
      }
    }

    // export class/interface/type/function/const/enum Foo
    for (const m of src.matchAll(/^export\s+(?:declare\s+)?(?:abstract\s+)?(?:class|interface|type|function|const|enum|let|var)\s+(\w+)/gm)) {
      symbols.add(m[1]);
    }

    // export default class/function Foo
    for (const m of src.matchAll(/^export\s+default\s+(?:class|function)\s+(\w+)/gm)) {
      symbols.add(m[1]);
    }

    return symbols;
  } catch {
    return new Set();
  }
}

function resolveSymbolsForExportPath(subPath) {
  // subPath like "./classes/services/ConfigService"
  const exportEntry = uiPkg.exports[subPath];
  if (!exportEntry) return new Set();

  // use the source (non-dist) entry
  const srcRelative = exportEntry.types || exportEntry.import;
  const srcAbsolute = join(ROOT, 'packages/ui', srcRelative);

  const src = readFileSync(srcAbsolute, 'utf8');
  const symbols = new Set();

  // collect re-exports: export * from './Foo'
  const reExports = [...src.matchAll(/^export\s+\*\s+from\s+['"]([^'"]+)['"]/gm)];
  if (reExports.length > 0) {
    const dir = dirname(srcAbsolute);
    for (const [, rel] of reExports) {
      const target = rel.endsWith('.ts') || rel.endsWith('.tsx')
        ? join(dir, rel)
        : [join(dir, rel + '.ts'), join(dir, rel + '.tsx'), join(dir, rel, 'index.ts')].find(p => {
          try { statSync(p); return true; } catch { return false; }
        });
      if (target) {
        for (const s of extractExportsFromFile(target)) symbols.add(s);
      }
    }
  }

  // also collect direct exports from the index itself
  for (const s of extractExportsFromFile(srcAbsolute)) symbols.add(s);

  return symbols;
}

// Build: symbol -> subPath (use first match; warn on collisions)
const symbolToPath = new Map();
const collisions = new Map();

for (const subPath of exportPaths) {
  const symbols = resolveSymbolsForExportPath(subPath);
  for (const sym of symbols) {
    if (symbolToPath.has(sym)) {
      if (!collisions.has(sym)) collisions.set(sym, [symbolToPath.get(sym)]);
      collisions.get(sym).push(subPath);
    } else {
      symbolToPath.set(sym, subPath);
    }
  }
}

if (collisions.size > 0) {
  console.warn('⚠ Symbol collisions (first path wins):');
  for (const [sym, paths] of collisions) {
    console.warn(`  ${sym}: ${paths.join(', ')}`);
  }
}

console.log(`Mapped ${symbolToPath.size} symbols across ${exportPaths.length} export paths.`);

// ── 3. Rewrite import statements in consuming source files ────────────────────
function collectFiles(dir, exts = ['.ts', '.tsx']) {
  const result = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...collectFiles(full, exts));
    else if (exts.some(e => entry.name.endsWith(e))) result.push(full);
  }
  return result;
}

const TARGET_DIRS = [
  join(ROOT, 'packages/ui-casedb/src'),
  join(ROOT, 'packages/ui-omopdb/src'),
  join(ROOT, 'packages/ui-seqdb/src'),
  join(ROOT, 'packages/ui-form/src'),
  join(ROOT, 'packages/ui-core/src'),
  join(ROOT, 'packages/ui-phylogenetic-tree/src'),
  join(ROOT, 'examples/demo-client-casedb/src'),
  join(ROOT, 'examples/demo-client-omopdb/src'),
  join(ROOT, 'examples/demo-client-seqdb/src'),
];

// Regex to match a single import statement from '@gen-epix/ui'
// Handles multi-line imports and both `import` and `import type`
const IMPORT_RE = /^(import\s+(?:type\s+)?)\{([^}]+)\}\s+from\s+'@gen-epix\/ui';$/gm;

let totalFilesChanged = 0;
let totalImportsReplaced = 0;

for (const dir of TARGET_DIRS) {
  let files;
  try { files = collectFiles(dir); } catch { continue; }

  for (const file of files) {
    let src = readFileSync(file, 'utf8');

    // Normalise multi-line imports into single-line for easier processing
    // Match: import [type] { ... (possibly multiline) } from '@gen-epix/ui';
    const multilineRe = /^(import\s+(?:type\s+)?)\{([^}]*)\}\s+from\s+'@gen-epix\/ui';/gms;

    let changed = false;
    let result = src.replace(multilineRe, (match, prefix, symbolsRaw) => {
      // Parse individual symbols, preserving `type` modifiers
      const entries = symbolsRaw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => {
          // Handle inline `type` keyword: "type Foo" or "Foo"
          const typeMatch = s.match(/^type\s+(\w+)$/);
          return typeMatch
            ? { name: typeMatch[1], isType: true }
            : { name: s.replace(/\s+as\s+\w+/, '').trim(), alias: s.includes(' as ') ? s : null, isType: false };
        });

      // Determine if the whole import was `import type {`
      const isTypeImport = /^import\s+type\s+/.test(prefix);

      // Group symbols by their target sub-path
      const byPath = new Map();
      const unknown = [];

      for (const entry of entries) {
        const path = symbolToPath.get(entry.name);
        if (!path) {
          unknown.push(entry);
        } else {
          if (!byPath.has(path)) byPath.set(path, []);
          byPath.get(path).push(entry);
        }
      }

      if (unknown.length > 0) {
        console.warn(`  ⚠ Unknown symbols in ${file.replace(ROOT + '/', '')}: ${unknown.map(e => e.name).join(', ')}`);
      }

      if (byPath.size === 0 && unknown.length === entries.length) {
        // Nothing to map — leave as is
        return match;
      }

      const lines = [];

      // Symbols we could map
      for (const [subPath, syms] of byPath) {
        const importPath = `@gen-epix/ui/${subPath.replace(/^\.\//, '')}`;
        const allType = isTypeImport || syms.every(s => s.isType);
        const typeKw = allType ? 'type ' : '';
        const symList = syms.map(s => {
          const prefix2 = (!isTypeImport && s.isType) ? 'type ' : '';
          return s.alias ? s.alias : `${prefix2}${s.name}`;
        }).join(', ');
        lines.push(`import ${typeKw}{ ${symList} } from '${importPath}';`);
      }

      // Unknown symbols: keep in original import
      if (unknown.length > 0) {
        const allType = isTypeImport || unknown.every(s => s.isType);
        const typeKw = allType ? 'type ' : '';
        const symList = unknown.map(s => {
          const prefix2 = (!isTypeImport && s.isType) ? 'type ' : '';
          return s.alias ? s.alias : `${prefix2}${s.name}`;
        }).join(', ');
        lines.push(`import ${typeKw}{ ${symList} } from '@gen-epix/ui';`);
      }

      changed = true;
      totalImportsReplaced++;
      return lines.join('\n');
    });

    if (changed) {
      totalFilesChanged++;
      const relPath = file.replace(ROOT + '/', '');
      if (DRY_RUN) {
        console.log(`[dry-run] Would update: ${relPath}`);
      } else {
        writeFileSync(file, result, 'utf8');
        console.log(`Updated: ${relPath}`);
      }
    }
  }
}

console.log(`\nDone. ${totalFilesChanged} files changed, ${totalImportsReplaced} import statements rewritten.`);
