---
name: create-admin-page
description: Generate and register a Gen-EpiX management CRUD page from a named xxxGetAll endpoint or symbol such as diseasesGetAll. Use for CaseDB, SeqDB, or OMOPDB admin pages, including forms, table columns, foreign-key lookups, query dependencies, and adminRoutes.tsx.
---

# Create an admin page

## 1. Identify the resource before creating files

- Start with the requested symbol (strip `#sym:` if present), its definition, and any explicit target client. Use the [create-datahook ownership and cache rules](../create-datahook/SKILL.md#resolve-the-owner-and-cache-key). `@gen-epix/api-<db>` normally maps to `@gen-epix/ui-client-<db>`, not to the app containing the closest example. If a bare method exists in multiple SDKs, use its declaring package or ask which client; don't default to CaseDB.
- Read the public API class method in `packages/api-<db>/src/api.ts`, the typed `AxiosPromise` signature, the returned array element type, and the actual single-item write signatures. Record the row ID, write model, editable fields, foreign keys, command names, and main list key. Don't infer these by singularizing the method name or edit the generated SDK.
- In the target's `src/constants/query.constants.ts`, reuse or add the main list key **and** its `*_QUERY_DEPENDENCIES` entry using the linked cache rules. A scalar page needs these even when it needs no related-data hook.
- Check the target's `src/pages`, `src/routes/adminRoutes.tsx`, and the inherited common routes. Reuse an existing page/route instead of creating duplicates. A shared `@gen-epix/api-commondb` contract does not by itself mean the new page should appear in all three apps.
- Calibration: `diseasesGetAll` resolves to `CaseDbOntologyApi`, `CaseDbDisease`, `CASEDB_QUERY_KEY.DISEASES`, `CaseDbCommandName.DiseaseCrudCommand`, and the **existing** `/management/diseases` route. See [DiseasesAdminPage](../../../packages/ui-client-casedb/src/pages/DiseasesAdminPage/DiseasesAdminPage.tsx) for a scalar page.

## 2. Resolve related data with `create-datahook`

**If a row has `x_id` and `x`, only `x_id` is populated by the backend. Never read or write `x`, not even as a display fallback.** Inspect other documented foreign keys too; not every field ending in `_id` is a foreign key (it may be the resource's own key or an external code).

For each relationship, **apply the [create-datahook skill](../create-datahook/SKILL.md)** to the *related* endpoint. Reuse or extend an existing hook before creating one. Obtain all choices from that resource, not just IDs present in the current rows. Use its options for the field and the table; use its map or option labels for a composite name. Call hooks at the top of the component. Pass their loadable results to `CrudPage` (the CaseDB pattern is `useArray([firstQuery, secondQuery])`), and pass `options` and `isLoading` to each lookup field. No inline `useQuery`, effect, per-row fetch, or extra lookup inside `fetchAll`.

For example, `etiologiesGetAll` needs **both** `useDiseaseOptionsQuery()` for `disease_id` and `useEtiologicalAgentOptionsQuery()` for `etiological_agent_id`. The write form is `OmitWithMetaData<CaseDbEtiology, 'disease' | 'etiological_agent'>`. The two options columns bind the same two IDs; a readable name can join the two labels, falling back to each original ID if its label is missing. See [EtiologiesAdminPage](../../../packages/ui-client-casedb/src/pages/EtiologiesAdminPage/EtiologiesAdminPage.tsx) for the wiring.

## 3. Implement the page

Create `src/pages/<Resources>AdminPage/<Resources>AdminPage.tsx` and `index.ts` with `export * from './<Resources>AdminPage';`. Use named exports, local relative imports within the client, and public subpaths for common helpers. Build on [CrudPage](../../../packages/ui-client-common/src/pages/CrudPage/CrudPage.tsx); it owns the **main** list query, mutations, permissions, dialogs, loading/error handling, and table store.

| Callback | Contract for a typical `id`-based resource |
|---|---|
| `fetchAll(signal)` | Resolve the owning API with `container.resolve(...)`; return `(await api.xxxGetAll(null, null, { signal })).data`. Match the actual pagination/options signature. Don't call a React hook here. |
| `deleteOne(item)` | Call `api.xxxDeleteOne(item.id)`. |
| `updateOne(variables, item)` | Call `api.xxxPutOne(item.id, { ...writableFields, id: item.id })` when that is the declared body; return `.data`. |
| `createOne(variables)` | Call `api.xxxPostOne(writableFields)`; return `.data`. |

Use `useCallback` for these operations. Only pass supported mutations. If the SDK lacks a single-item write or its permission cannot be established, leave that action unavailable and report it; don't invent methods, substitute a bulk operation, or omit authorization to make it work.

**Check row identity, especially in OMOPDB.** `CrudPage` and its optimistic mutations use `row.id` in the *cached array*. For example, `OmopDbDomain` has `domain_id`, not `id`; `domain_str_id` is a different field. For a verified nonstandard primary key, adapt persisted rows to a typed UI row with `id` from that key at the fetch and mutation-response boundaries. Use the same row shape in any hook sharing the key. Send the real path ID and only SDK fields on writes, never the UI alias. `convertToTableData` or a type cast alone won't fix cache identity. If the endpoint has no verifiable stable ID, clarify before generating editable CRUD.

Define these together from the actual read/write models:

- **`FormFields` and `getName`:** use `OmitWithMetaData` or an explicit `Pick` of writable fields. Exclude metadata, expanded relationships, computed fields, and UI-only values from payloads; preserve required context on PUT. For notifications and dialog titles, `getName` must work on both a persisted row and unsaved form values. Prefer a meaningful name, label, code, or composite of lookup labels; use IDs only as fallbacks.
- **`schema`:** memoize `object<FormFields>().shape({...})` from Yup. Use `SchemaUtil.name`, `.code`, `.description`, `.rank`, etc. where their constraints actually fit. Match required/nullable values, enum values, ID formats, ranges, and cross-field rules. Don't assume every ID is UUIDv4.
- **`formFieldDefinitions`:** use typed `FormFieldDefinition<FormFields>` and `FORM_FIELD_DEFINITION_TYPE`. Use `TEXTFIELD` for strings, multiline for descriptions, `NUMBER`/`BOOLEAN`/`DATE` for corresponding scalars and `AUTOCOMPLETE` or `SELECT` for relationships/enums. The name and submitted value of a lookup field are the FK and selected ID, never the label or object.
- **`tableColumns`:** memoize `TableColumn<TableData>[]`. Use `TableUtil.createTextColumn`, `createNumberColumn`, `createBooleanColumn`, `createDateColumn`, or `createOptionsColumn({ id: 'x_id', name: ..., options: lookup.options })` as appropriate. Choose a real, visible default sort field. Use literal translations for headers, field labels, item name and titles; include `t` and changing lookups in memo dependencies.
- **Render:** use `<CrudPage<FormFields, Row, TableData, DB_QUERY_KEY, DbApiPermission>>` with the target client's types (`TableData = Row` unless enriched). Pass the callbacks, schema, definitions, columns, `crudCommandType`, `resourceQueryKeyBase`, sort field/direction, `itemName`, `title`, `createItemDialogTitle` for creation, `TestIdUtil.createAttributes('<Resources>AdminPage')` as `testIdAttributes`, and the lookup `loadables`.

### Choose the advanced pattern only when needed

| Situation | What to adapt |
|---|---|
| Set with editable members | [ColSetsAdminPage](../../../packages/ui-client-casedb/src/pages/ColSetsAdminPage/ColSetsAdminPage.tsx): load member rows and choices via hooks; derive synthetic `colIds` for `TRANSFER_LIST` and table display. Write the parent first, then use its persisted ID with the actual association endpoint. Keep synthetic fields out of POST/PUT; invalidate the member list via `associationQueryKeys`, and require the association command in the applicable `extra*OnePermissions`. |
| Parent-scoped or conditional editor | [RefColsAdminPage](../../../packages/ui-client-casedb/src/pages/RefColsAdminPage/RefColsAdminPage.tsx): reuse the global list and filter via `fetchAllSelect` for a route parameter; set/lock the parent ID when scoped. Use lookup and validation-rule hooks, dynamic definitions, conditional Yup validation and `onFormChange` to clear incompatible selections. Don't put a filtered list under the global cache key. |
| Nested write shape | [CaseTypesAdminPage](../../../packages/ui-client-casedb/src/pages/CaseTypesAdminPage/CaseTypesAdminPage.tsx): project nested properties into the form and translate them back on create/update. Use `getFormValuesFromItem`, `convertToTableData`, or `getOptimisticUpdateIntermediateItem` where the shapes differ. |

## 4. Register and verify

1. Import the page barrel in **the owning client's** `src/routes/adminRoutes.tsx`. Add one object to `createAdminRoutes()` at `/management/<plural-kebab-name>` (or the relevant parent). Keep `...createCommonAdminRoutes<...>()` and existing overrides. No separate menu or demo route is needed.
2. Follow the [CaseDB route objects](../../../packages/ui-client-casedb/src/routes/adminRoutes.tsx): `Component`, `errorElement: <RouterErrorPage />`, and `handle` with an existing `ADMIN_PAGE_CATEGORY`, `requiresUserProfile: true`, literal translated `title` and `subTitle`, and `requiredPermissions`. Require the actual command and permission for **every** read needed to render, including lookups and member lists (normally `{ command_name: DbCommandName.XCrudCommand, permission_type: DbPermissionType.READ }`). Gate writes on the page, not route entry. Use common permission types for common contracts.
3. In the affected UI package run `pnpm run update-exports`, `pnpm run lint-fix`, `pnpm run lint`, `pnpm run check-types`, and `pnpm run test-run`. For new labels run `pnpm run add-missing-translations`, fill the new locale values, and run `pnpm run test-missing-translations`.
4. Verify the registered path and permissions, the list key and its dependency entry, and the actual POST/PUT/DELETE signatures. Try a row with only FK IDs: the form should preselect the right options, the table should show labels, and saving should send IDs only. Report the client, route, hooks reused/created, and any unavailable actions.

**SeqDB example:** `protocolSetMembersGetAll` should produce `/management/protocol-set-members` in `ui-client-seqdb`, backed by `SeqDbSeqApi` and `SEQDB_QUERY_KEY.PROTOCOL_SET_MEMBERS`. Use `protocolSetsGetAll` and `protocolsGetAll` through two data hooks. The route needs READ on `ProtocolSetMemberCrudCommand`, `ProtocolSetCrudCommand`, and `ProtocolCrudCommand`; the two editable fields are `protocol_set_id` and `protocol_id`.
