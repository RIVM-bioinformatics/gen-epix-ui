---
name: create-datahook
description: Use a named or selected hook, file, consumer, endpoint, or SDK enum to create a missing Gen-EpiX data hook or automatically check and update an existing one. Covers CaseDB, SeqDB, OMOPDB, and shared CommonDB queries and options. No mode argument is needed.
---

# Create or update a data hook

## Infer the action from the target

Use the target from the request or, if none is named, the IDE selection and its file. For example, use `/create-datahook #sym:lociGetAll` or invoke `/create-datahook` with the hook export selected. Never ask the user to choose a mode. Ask which resource or client they mean only if the target is still ambiguous.

Search the owning and common clients for a hook backed by the same endpoint or enum, even if its name differs. **If no hook exists, create it. If one exists, check the hook family and its consumers and fix confirmed deviations in place.** Add a missing projection to the existing module rather than duplicating its fetch or cache key. If the user asks only for findings or an explanation, report what you find without editing, scaffolding, or running fixers.

Use the applicable sections below as the checklist for an existing hook:

- For API queries, verify the SDK method and DI owner, abort signal, returned data, persisted ID, cache key and dependency entry. Check that request parameters affect the key and that observer-only filtering does not.
- For derived hooks, verify memoization, FK-based IDs/labels, shared base data, and propagation of loading and errors. For static enums, verify one presentation record, no network request or cache key, and options that consumers can bind to the real model field without remapping.
- Follow the barrel and package export to callers. Check that consumers (including any admin page) still receive the expected options, maps, or loadable state. Preserve public names, signatures, and shared cache shapes unless a change is required and its callers are updated together.

After a change, recheck affected consumers using the verification steps below. Report fixes and remaining exceptions with file locations and reasons. If the hook already conforms and no other change was requested, leave it unchanged.

## Resolve the owner and cache key

1. Start from the requested symbol and consumer. Follow the repository's Graphify-first workflow, then verify the exact signature in `packages/api-*/src/api.ts`. Use the public method's declaring class and the typed response, not the method spelling alone. For example, `treeAlgorithmsGetAll` exists in both SeqDB and CaseDB. Use a selected declaration or an explicit target; ask if ownership is still ambiguous.

   | SDK | Owning UI package | Key / dependency record in `src/constants/query.constants.ts` |
   |---|---|---|
   | `@gen-epix/api-casedb` | `@gen-epix/ui-client-casedb` | `CASEDB_QUERY_KEY` / `CASEDB_QUERY_DEPENDENCIES` |
   | `@gen-epix/api-seqdb` | `@gen-epix/ui-client-seqdb` | `SEQDB_QUERY_KEY` / `SEQDB_QUERY_DEPENDENCIES` |
   | `@gen-epix/api-omopdb` | `@gen-epix/ui-client-omopdb` | `OMOPDB_QUERY_KEY` / `OMOPDB_QUERY_DEPENDENCIES` |
   | `@gen-epix/api-commondb` (shared contract) | `@gen-epix/ui-client-common` | `COMMON_QUERY_KEY` / `COMMON_QUERY_DEPENDENCIES` |

2. Search the owning client's **and common's** `src/dataHooks` and package exports for the endpoint and existing list/map/options names. Reuse a suitable hook; add a missing derived export to its module rather than fetching again. For a common resource, prefer the existing common hook/key, e.g. [useOrganizationsQuery](../../../packages/ui-client-common/src/dataHooks/useOrganizationsQuery/useOrganizationsQuery.ts). A new shared query resolves the appropriate `API_*_TOKEN` from common's `constants/api.constants`, bound to the concrete SDK in each client's setup. `CommonDb...Api` interfaces are not DI tokens. For domain queries, resolve the owning SDK class; never import a sibling UI client to get a hook.
3. If the source is an SDK enum rather than an endpoint, follow [Static enum options](#static-enum-options) instead of creating a query key. For API queries, reuse the key for the same cached response. If missing, add a plural `UPPER_SNAKE_CASE: 'UPPER_SNAKE_CASE'` to the owning `*_QUERY_KEY` and **one computed entry** to the matching `*_QUERY_DEPENDENCIES` record. Keep the existing `as const`/union and unrelated entries. These records are already registered alongside common's in `src/setup/setup.ts`.

   When adding a key or changing its backing model, apply [update-query-dependencies](../update-query-dependencies/SKILL.md) to the **whole owning map**. Batch this once after all keys are in place when called from `create-admin-page`. Don't create separate keys for map/options projections.

## Implement the smallest useful hook family

Use the existing module and barrel. For a new family, create `src/dataHooks/use<Resources>Query/use<Resources>Query.ts` (create `dataHooks` if absent) and `index.ts` containing `export * from './use<Resources>Query';`. Keep the base list and its derived hooks together. Follow established export names when extending a module; singular/plural map names vary.

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
- For item, stats, validation-rule, or composite queries, preserve the actual result shape rather than forcing everything into an array. Aggregate upstream loadables/errors for computed results; reserve specialized rights workflows for consumers that need them.

## Static enum options

1. Follow [conceptSetTypePresentationValues and useConceptSetTypeOptionsQuery](../../../packages/ui-client-casedb/src/dataHooks/useConceptSetTypeQuery/useConceptSetTypeQuery.ts). Search the owning and common `src/dataHooks` for the enum first. Reuse or fix its existing hook; otherwise create one module and barrel for the **enum**, not for each consuming page. A static enum needs no network request, cache key, dependency entry, or route permission.
2. Keep one `<enum>PresentationValues` map keyed by SDK members. Use `Record<EnumType, string>` for the full enum; use `Partial<Record<EnumType, string>>` for an intentional subset. Export the map for fixed labels. For translated labels, use literal `t` calls and memoize with `[t]` so a locale change updates all consumers.
3. Build the final options **inside the hook**. For a string enum, follow the reference's `UseOptions<string>` contract; each option's `value` is the enum value, not its label. Memoize the result with `error: null`, `isEnabled: true`, and `isFetching`, `isLoading`, `isPending` all `false`:

   ```ts
   const options: OptionBase<string>[] = Object.entries(conceptSetTypePresentationValues)
     .map(([value, label]) => ({ label, value }));
   ```

4. Verify the unchanged `.options` against a raw row and the form, not just the column signature. `Object.entries` yields string keys: that matches `CaseDbConceptSetType`, but `"2"` does **not** match the numeric `SeqDbSeqFormat.STR_DNA` (`2`). The current [TableUtil](../../../packages/ui-client-common/src/utils/TableUtil/TableUtil.ts) accepts `OptionBase<string>[]` and compares values with `===`. If the shared table cannot consume the SDK value type, flag the shared table/filter limitation. Do not mask it with a cast, stringify the hook values, or require a page-specific adapter. Numeric support belongs in the shared consumer, with tests for display, filtering, and a numeric form round-trip.

   Include the hook result in the admin page's `loadables` and pass its `.options` directly to the selector and [options column](../create-admin-page/SKILL.md#options-columns-and-loadables).

## Verify the consumer contract

Run `pnpm run update-exports` in the owning UI package for new barrels; this regenerates both workspace and published subpaths. Run the package's `lint-fix`, `lint`, `check-types`, and `test-run` scripts. When used by `create-admin-page`, batch these checks with the page changes.

Check that the base list uses the expected SDK method and key, maps/options for it share the same request, and options contain IDs rather than whole objects. Check empty, loading, and failed lookups as well as success. Tell the caller which hooks to import, the key to share, and which read permissions their route needs (including any lookups used for labels).
