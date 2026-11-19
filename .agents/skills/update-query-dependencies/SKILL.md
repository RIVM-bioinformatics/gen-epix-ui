---
name: update-query-dependencies
description: Recheck and update an entire Gen-EpiX query dependency map from a query.constants.ts path, a named or selected symbol such as SEQDB_QUERY_DEPENDENCIES, or after adding a GetAll resource. Trace SDK foreign keys to domain and common query keys, add missing invalidations, and ask before removing existing dependencies.
---

# Update query dependencies

## Resolve the map

`/update-query-dependencies #sym:SEQDB_QUERY_DEPENDENCIES` and `/update-query-dependencies packages/ui-client-seqdb/src/constants/query.constants.ts` target the same map. With no argument, use the IDE selection and its file. Resolve the owning client and its `XXX_QUERY_KEY` / `XXX_QUERY_DEPENDENCIES` pair; ask only if the target is ambiguous. For a domain client, also consult the common keys registered in its `src/setup/setup.ts`, but edit only the requested map.

## Recheck every key, not just the new one

1. Inventory **all** key values and their current dependency entries, including empty arrays. For each key, record its producer, row model, and the fields or other inputs supporting each direct dependency. A new key can be a dependency of any existing entry, even on a page that did not change.
2. Locate the page's `resourceQueryKeyBase` or the base hook's `queryKey`/`getGenericKey`. Follow the main fetch to the actual SDK method. For `xxxGetAll`, inspect the generated signature in `packages/api-<db>/src/api.ts` (or `api-commondb` for a shared contract) and its **returned array element**, including inherited properties. If the response is untyped, corroborate the row using the single-item signatures and consumer's type guard. Do not guess an endpoint or model by pluralizing the key.
3. Identify the resources referenced by that row. Start with required **and optional** `*_id` fields; check `*_ids`, documented maps of IDs, role-specific names, and paired objects or SDK field descriptions. Confirm the referenced resource has a query key in this client or in common. A foreign key counts **even when only the ID is returned**, regardless of whether the page loads the related object. Do not infer a dependency from an external code, audit field, enum, or primary key just because of its name. For example, `SeqDbReadSetIdentifier.internal_id` references `SEQDB_QUERY_KEY.READ_SETS`; `identifier_issuer_id` references `COMMON_QUERY_KEY.IDENTIFIER_ISSUERS`; `external_id` is an issuer-provided value, not another list.
4. Record **`[dependent list]: [referenced lists]`**. Deduplicate multiple fields targeting the same list. Do not add a self-edge for a reference within the same list, reverse an edge, or copy transitive dependencies: [QueryClientService](../../../packages/ui-client-common/src/classes/services/QueryClientService/QueryClientService.ts) already walks dependents. For example, `protocolsGetAll` returns `SeqDbProtocol`; `ref_seq_id`, `seq_category_set_id`, and `locus_set_id` give:

   ```ts
   [SEQDB_QUERY_KEY.PROTOCOLS]: [
     SEQDB_QUERY_KEY.LOCUS_SETS,
     SEQDB_QUERY_KEY.REF_SEQS,
     SEQDB_QUERY_KEY.SEQ_CATEGORY_SETS,
   ],
   ```

5. Also inspect non-`GetAll` producers: stats, joins, permission queries, and filtered/derived caches can have valid dependencies without FK fields (see [Query Key Dependencies](../../../AGENTS.md#query-key-dependencies)). Preserve placeholders and manual dependencies. If a target has no registered key or a relationship cannot be resolved, report the key/field and the missing evidence rather than inventing a key or treating it as proof for removal.

## Apply additions; ask before removals

- Compare the inventory with the **current working file**. Add confirmed missing dependencies and missing entries, retaining the existing ordering style and type-safe constants. Import `COMMON_QUERY_KEY` as a value if an array now uses it. Use `[]` for a key with no known upstream dependencies.
- Check existing edges for staleness too. **Never remove an existing dependency without explicit approval for that edge.** Before any removal (including a replacement or clearing an entry), list each proposed `dependent <- source` and the evidence for removing it. Ask which to remove, offering **keep all** or **remove selected**; wait for the user's choice. Keep every edge that was not explicitly approved for removal. A missing `*_id` alone does not disprove a manual dependency. If there are no removal candidates, apply the additions without prompting.
- Verify every key has an entry, every source belongs to the domain/common maps, and a change to a representative source finds the dependent via `getQueryKeyDependencies([source])`. Recheck that no unapproved edges disappeared. Run the owning package's lint, type-check, and tests; report keys reviewed, additions, removals (if approved), and unresolved items.
