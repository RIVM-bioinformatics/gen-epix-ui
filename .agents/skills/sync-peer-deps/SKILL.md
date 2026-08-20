---
name: sync-peer-deps
description: >-
  Use scripts/sync-peer-deps.sh to synchronize peerDependency versions with
  matching devDependency versions across packages and examples. Use when asked to
  sync peer deps, align peerDependencies, update package peer versions, or run
  the sync-peer-deps script.
---

# Sync Peer Dependencies

Synchronize `peerDependencies` with matching `devDependencies` in workspace
package manifests by using the repository script.

## Workflow

1. From the repository root, run the script:

   ```sh
   ./scripts/sync-peer-deps.sh
   ```

2. Review the changed package manifests:

   ```sh
   git --no-pager diff -- packages/*/package.json examples/*/package.json
   ```

3. Confirm that each change only updates a `peerDependencies` version to match
   the same dependency in `devDependencies`.

   - Do not manually rewrite unrelated package metadata.
   - Do not edit `pnpm-lock.yaml` unless a package manager command is required
     for a separate requested change.
   - If the script updates an unexpected manifest, inspect that package before
     proceeding.

4. Validate with the narrowest relevant command:

   ```sh
   pnpm run lint
   pnpm run check-types
   ```

   For a large or metadata-only sync where full validation is impractical, at
   minimum verify the package JSON files still parse:

   ```sh
   node -e "for (const file of process.argv.slice(1)) JSON.parse(require('fs').readFileSync(file, 'utf8'))" packages/*/package.json examples/*/package.json
   ```

5. Stage only package manifest files changed by the sync:

   ```sh
   git add -- packages/*/package.json examples/*/package.json
   ```

6. Confirm the staged set contains only intended package manifests:

   ```sh
   git --no-pager diff --cached --name-only
   ```

## Notes

- Use the script as the source of truth; do not hand-sync versions first.
- The script only changes peer dependencies that also exist in the same file's
  `devDependencies`.
- If no manifests changed, report that all peer dependencies were already in
  sync and do not stage unrelated files.
