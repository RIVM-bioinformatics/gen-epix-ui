---
name: create-datahook
description: Create, reuse, or extend a Gen-EpiX data hook under src/dataHooks for a GetAll endpoint, foreign-key lookup, map, name factory, or form/table options. Use for CaseDB, SeqDB, OMOPDB, and shared CommonDB queries, including related data needed by an admin page.
---

# Create a data hook

## Resolve the owner and cache key

1. Start from the requested symbol and consumer. Follow the repository's Graphify-first workflow, then verify the exact signature in `packages/api-*/src/api.ts`. Use the public method's declaring class and the typed response, not the method spelling alone. For example, `treeAlgorithmsGetAll` exists in both SeqDB and CaseDB. Use a selected declaration or an explicit target; ask if ownership is still ambiguous.

   | SDK | Owning UI package | Key / dependency record in `src/constants/query.constants.ts` |
   |---|---|---|
   | `@gen-epix/api-casedb` | `@gen-epix/ui-client-casedb` | `CASEDB_QUERY_KEY` / `CASEDB_QUERY_DEPENDENCIES` |
   | `@gen-epix/api-seqdb` | `@gen-epix/ui-client-seqdb` | `SEQDB_QUERY_KEY` / `SEQDB_QUERY_DEPENDENCIES` |
   | `@gen-epix/api-omopdb` | `@gen-epix/ui-client-omopdb` | `OMOPDB_QUERY_KEY` / `OMOPDB_QUERY_DEPENDENCIES` |
   | `@gen-epix/api-commondb` (shared contract) | `@gen-epix/ui-client-common` | `COMMON_QUERY_KEY` / `COMMON_QUERY_DEPENDENCIES` |

2. Search the owning client's **and common's** `src/dataHooks` and package exports for the endpoint and existing list/map/options names. Reuse a suitable hook; add a missing derived export to its module rather than fetching again. For a common resource, prefer the existing common hook/key, e.g. [useOrganizationsQuery](../../../packages/ui-client-common/src/dataHooks/useOrganizationsQuery/useOrganizationsQuery.ts). A new shared query resolves the appropriate `API_*_TOKEN` from common's `constants/api.constants`, bound to the concrete SDK in each client's setup. `CommonDb...Api` interfaces are not DI tokens. For domain queries, resolve the owning SDK class; never import a sibling UI client to get a hook.
3. Reuse the key for the same cached response. If missing, add a plural `UPPER_SNAKE_CASE: 'UPPER_SNAKE_CASE'` to the owning `*_QUERY_KEY` and **one computed entry** to the matching `*_QUERY_DEPENDENCIES` record. Keep the existing `as const`/union and unrelated entries. These records are already registered alongside common's in `src/setup/setup.ts`.

   The direction is **`[dependent key]: [sources it depends on]`**: invalidating a source finds its dependents, not vice versa. A new independent list may simply have `[SEQDB_QUERY_KEY.PROTOCOL_SETS]: []`. Add real upstream keys if their mutations would stale the **cached result**. A page showing labels from another hook is not by itself a dependency of the raw list. Don't add self edges, a new key for every map/options projection, or keys for static enum choices. See [QueryClientService](../../../packages/ui-client-common/src/classes/services/QueryClientService/QueryClientService.ts).

## Implement the smallest useful hook family

Create `src/dataHooks/use<Resources>Query/use<Resources>Query.ts` (create `dataHooks` if absent) and `index.ts` containing `export * from './use<Resources>Query';`. Keep the base list and its derived hooks together. Follow established export names when extending a module; singular/plural map names vary.

**Base query.** Use `useQueryMemo` from `@gen-epix/ui-client-common/hooks/useQueryMemo` and `QueryClientService` from its common `classes/services/QueryClientService` subpath. Forward `signal` to the generated call's options slot; return `response.data` and let errors propagate. The unfiltered list must use `getGenericKey(KEY)` so a `CrudPage` using `resourceQueryKeyBase={KEY}` sees the same cached rows. Verify the element type and persisted primary key: for OMOPDB, `OmopDbConcept.concept_id` is the UUID, not `id` or `concept_int_id`. Agree on any row-ID adapter with other consumers before sharing a key.

Example for a new SeqDB lookup (after adding its key):

```ts
export const useProtocolSetsQuery = (): ReturnType<typeof useQueryMemo<SeqDbProtocolSet[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(SeqDbSeqApi).protocolSetsGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(SEQDB_QUERY_KEY.PROTOCOL_SETS),
  });
};

export const useProtocolSetOptionsQuery = (): UseOptions<string> => {
  const query = useProtocolSetsQuery();
  return useMemo(() => DataHookUtil.createUseOptionsDataHook<SeqDbProtocolSet>(
    query, item => item.id, item => item.name,
  ), [query]);
};
```

Import the model and API class from `@gen-epix/api-seqdb`, `container` from `tsyringe`, and `useMemo` from React. CaseDB annotates base queries with `UseQueryResult<Model[]>`; the `ReturnType` above uses the public common hook when the thin client does not declare `@tanstack/react-query` directly.

**Derived results.** Use common's [DataHookUtil](../../../packages/ui-client-common/src/utils/DataHookUtil/DataHookUtil.ts) and [data-hooks.models](../../../packages/ui-client-common/src/models/data-hooks.models.ts):

- For options, return `UseOptions<string>` with `{ value: actualId, label: readableName }` via `createUseOptionsDataHook(query, getId, getLabel, extraLoadables?, comparator?)`. For ID-to-row access, return `UseMap<Model>` via `createUseMapDataHook(query, getId)`. Wrap each in `useMemo` with the base query and all other inputs. These helpers preserve loading, fetching, pending, enabled, and error state; don't return just an array or `new Map()`. See [useDiseasesQuery](../../../packages/ui-client-casedb/src/dataHooks/useDiseasesQuery/useDiseasesQuery.ts).
- If labels depend on another resource, compose its map/options hook **by foreign-key ID**; never read the unpopulated sibling object. Use `createUseNameFactoryHook` for a reusable composite label, and include every contributing loadable in the options/name helper as well as memo dependencies. Fall back to the original ID when its label is missing. See [useConceptQuery](../../../packages/ui-client-casedb/src/dataHooks/useConceptQuery/useConceptQuery.ts). Use a rank comparator only for ranked resources.
- If only the observer's view changes, use `select` over the shared full list ([useDataCollectionsQuery](../../../packages/ui-client-casedb/src/dataHooks/useDataCollectionsQuery/useDataCollectionsQuery.ts)). If the **request** changes, pass all response-affecting parameters as a stable serializable argument to `getGenericKey(KEY, args)`; use `enabled` to guard missing required inputs, not conditional hook calls. Don't cache a server-filtered subset under `[KEY]`.
- For enum-only choices, use a memoized options hook without an API call ([useConceptRelationTypeQuery](../../../packages/ui-client-casedb/src/dataHooks/useConceptRelationTypeQuery/useConceptRelationTypeQuery.ts)). For item, stats, validation-rule, or composite queries, preserve the actual result shape rather than forcing everything into an array. Aggregate upstream loadables/errors for computed results; reserve specialized rights workflows for consumers that need them.

## Verify the consumer contract

Run `pnpm run update-exports` in the owning UI package for new barrels; this regenerates both workspace and published subpaths. Run the package's `lint-fix`, `lint`, `check-types`, and `test-run` scripts. When used by `create-admin-page`, batch these checks with the page changes.

Check that the base list uses the expected SDK method and key, maps/options for it share the same request, and options contain IDs rather than whole objects. Check empty, loading, and failed lookups as well as success. Tell the caller which hooks to import, the key to share, and which read permissions their route needs (including any lookups used for labels).
