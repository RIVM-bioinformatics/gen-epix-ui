---
name: update-graphify-ui-graph
description: >-
  Update the Graphify graph for UI TypeScript sources only. Use when asked to
  update or rebuild the graphify graph for packages/ui-*, examples, TypeScript
  UI sources, or a scoped workspace-only graph excluding external references.
---

# Update Graphify UI Graph

Update the repository Graphify graph from a scoped TypeScript corpus.

## Scope

Include only these workspace areas:

- `packages/ui-*`
- `examples`

Include only these file types:

- `*.ts`
- `*.tsx`

Exclude these files everywhere:

- `vite.config.ts`
- `vite-env.d.ts`

Do not include external dependency references. Package manifests are outside this
scope, and any graph nodes or links that refer only to third-party packages,
peer dependencies, npm package names, or files outside this workspace must be
removed from the final graph.

## Workflow

1. From the repository root, build a clean scoped corpus that preserves relative
   workspace paths:

   ```sh
   rm -rf .graphify-scope/ui-ts
   mkdir -p .graphify-scope/ui-ts
   find packages/ui-* examples \
     -type f \
     \( -name '*.ts' -o -name '*.tsx' \) \
     ! -name 'vite.config.ts' \
     ! -name 'vite-env.d.ts' \
     -print | while IFS= read -r file; do
       mkdir -p ".graphify-scope/ui-ts/$(dirname "$file")"
       cp "$file" ".graphify-scope/ui-ts/$file"
     done
   ```

2. Confirm the corpus contains only intended files:

   ```sh
   find .graphify-scope/ui-ts -type f | sort
   find .graphify-scope/ui-ts -type f ! \( -name '*.ts' -o -name '*.tsx' \) -print
   find .graphify-scope/ui-ts -type f \( -name 'vite.config.ts' -o -name 'vite-env.d.ts' \) -print
   ```

   The second and third commands must print nothing.

3. Update Graphify from the scoped corpus:

   ```sh
   graphify .graphify-scope/ui-ts --update
   ```

   If the graph does not exist or `--update` cannot reuse the current graph,
   rebuild from the same scoped corpus:

   ```sh
   graphify .graphify-scope/ui-ts
   ```

4. Prune any external-only nodes and links from `graphify-out/graph.json`:

   ```sh
   node <<'NODE'
   const fs = require('fs');
   const path = 'graphify-out/graph.json';
   const graph = JSON.parse(fs.readFileSync(path, 'utf8'));
   const allowedPrefixes = ['packages/ui-', 'examples/'];
   const excludedNames = new Set(['vite.config.ts', 'vite-env.d.ts']);

   const sourceFile = (node) => String(node.source_file || node.file || node.path || '');
   const inScope = (file) =>
     allowedPrefixes.some((prefix) => file.startsWith(prefix)) &&
     (file.endsWith('.ts') || file.endsWith('.tsx')) &&
     !excludedNames.has(file.split('/').pop());

   const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
   const keptNodes = nodes.filter((node) => inScope(sourceFile(node)));
   const keptIds = new Set(keptNodes.map((node) => node.id));

   const links = Array.isArray(graph.links) ? graph.links : [];
   const keptLinks = links.filter((link) => {
     const source = typeof link.source === 'object' ? link.source.id : link.source;
     const target = typeof link.target === 'object' ? link.target.id : link.target;
     return keptIds.has(source) && keptIds.has(target);
   });

   graph.nodes = keptNodes;
   graph.links = keptLinks;
   if (Array.isArray(graph.edges)) {
     graph.edges = graph.edges.filter((edge) => {
       const source = typeof edge.source === 'object' ? edge.source.id : edge.source;
       const target = typeof edge.target === 'object' ? edge.target.id : edge.target;
       return keptIds.has(source) && keptIds.has(target);
     });
   }
   if (Array.isArray(graph.hyperedges)) {
     graph.hyperedges = graph.hyperedges.filter((edge) => {
       const endpoints = edge.nodes || edge.members || [];
       return endpoints.every((endpoint) => keptIds.has(typeof endpoint === 'object' ? endpoint.id : endpoint));
     });
   }

   fs.writeFileSync(path, JSON.stringify(graph, null, 2) + '\n');
   console.log(`Pruned graph: ${keptNodes.length} nodes, ${keptLinks.length} links`);
   NODE
   ```

5. Verify the final graph scope:

   ```sh
   node <<'NODE'
   const fs = require('fs');
   const graph = JSON.parse(fs.readFileSync('graphify-out/graph.json', 'utf8'));
   const badNodes = (graph.nodes || []).filter((node) => {
     const file = String(node.source_file || node.file || node.path || '');
     return !(
       (file.startsWith('packages/ui-') || file.startsWith('examples/')) &&
       (file.endsWith('.ts') || file.endsWith('.tsx')) &&
       !file.endsWith('/vite.config.ts') &&
       !file.endsWith('/vite-env.d.ts')
     );
   });
   const ids = new Set((graph.nodes || []).map((node) => node.id));
   const badLinks = (graph.links || []).filter((link) => {
     const source = typeof link.source === 'object' ? link.source.id : link.source;
     const target = typeof link.target === 'object' ? link.target.id : link.target;
     return !ids.has(source) || !ids.has(target);
   });
   if (badNodes.length || badLinks.length) {
     console.error({ badNodes: badNodes.slice(0, 10), badLinks: badLinks.slice(0, 10) });
     process.exit(1);
   }
   console.log(`Graph scope verified: ${(graph.nodes || []).length} nodes, ${(graph.links || []).length} links`);
   NODE
   ```

6. Review and stage Graphify outputs only when requested. Do not stage
   `.graphify-scope/` unless the user explicitly wants to keep the scoped corpus.

## Notes

- The scoped corpus is a working directory aid, not repository source.
- Keep all graph inputs workspace-local; do not add `package.json` dependency or
  peer dependency metadata to this scoped graph.
- If Graphify generates reports or HTML alongside `graphify-out/graph.json`, keep
  them consistent with the pruned graph when those files are part of the desired
  output.
