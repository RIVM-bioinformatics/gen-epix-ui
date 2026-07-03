#!/usr/bin/env bash
# sync-peer-deps.sh
# For each package.json in the monorepo, update every peerDependency version
# to match the corresponding devDependency version (where both exist).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Write the Node.js helper to a temp file
NODE_HELPER=$(mktemp /tmp/sync-peer-deps-XXXXXX.cjs)
trap 'rm -f "$NODE_HELPER"' EXIT

cat > "$NODE_HELPER" << 'EOF'
const fs = require('fs');

const filePath = process.argv[2];
const raw = fs.readFileSync(filePath, 'utf8');
const pkg = JSON.parse(raw);

const devDeps = pkg.devDependencies || {};
const peerDeps = pkg.peerDependencies || {};

let changed = false;
const updates = [];

for (const [name, peerVersion] of Object.entries(peerDeps)) {
  if (Object.prototype.hasOwnProperty.call(devDeps, name)) {
    const devVersion = devDeps[name];
    if (peerVersion !== devVersion) {
      updates.push('  ' + name + ': ' + peerVersion + ' -> ' + devVersion);
      peerDeps[name] = devVersion;
      changed = true;
    }
  }
}

if (changed) {
  const indentMatch = raw.match(/^(\s+)"/m);
  const indent = indentMatch ? indentMatch[1] : '  ';
  fs.writeFileSync(filePath, JSON.stringify(pkg, null, indent) + '\n', 'utf8');
  process.stdout.write('UPDATED\n' + updates.join('\n') + '\n');
} else {
  process.stdout.write('NO_CHANGES\n');
}
EOF

UPDATED=0
SKIPPED=0

while IFS= read -r PKG_FILE; do
  RESULT=$(node "$NODE_HELPER" "$PKG_FILE")
  REL_PATH="${PKG_FILE#"$ROOT_DIR/"}"

  if [ "$RESULT" = "NO_CHANGES" ]; then
    echo "  [skip] $REL_PATH"
    SKIPPED=$((SKIPPED + 1))
  else
    echo "  [updated] $REL_PATH"
    echo "$RESULT" | tail -n +2 | sed 's/^/    /'
    UPDATED=$((UPDATED + 1))
  fi
done < <(find "$ROOT_DIR/packages" "$ROOT_DIR/examples" \
  -name "package.json" \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*")

echo ""
echo "Done: $UPDATED package(s) updated, $SKIPPED package(s) already in sync."
