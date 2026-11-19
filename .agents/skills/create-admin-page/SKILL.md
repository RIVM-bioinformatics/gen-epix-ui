---
name: create-admin-page
description: Use a named or selected xxxGetAll endpoint, page component, file, or management route to create a missing Gen-EpiX admin page or automatically check and update an existing one in CaseDB, SeqDB, or OMOPDB. No mode argument is needed.
---

# Create or update an admin page

## Infer the action from the target

Use the target from the request or, if none is named, the IDE selection and its file. For example, `/create-admin-page #sym:allelesGetAll` and `/create-admin-page` with `allelesGetAll` selected mean the same thing. Never ask the user to choose a mode. Ask which resource or client they mean only if the target is still ambiguous.

Search the owning client's pages and admin routes (including inherited routes). Match the resource and scope of the page's main `fetchAll`, not a related lookup. **If no page exists, create and register it. If one exists, check the whole page and fix confirmed deviations in place**, even for a bare endpoint or a request about just one field. If the user asks only for findings or an explanation, report what you find without editing, scaffolding, or running fixers.

Use steps 1-4 below as the checklist for an existing page:

- Compare the page with the current SDK: supported CRUD actions, identity, write payloads, and `OmitWithMetaData` form type. Check `getName` and `defaultSortByField` together against the `GetAll` row model, then check the schema, defaults, fields, and columns.
- On update, remove any table column that exposes the row's own `id`. Keep the ID on the row for identity and mutations.
- Check every options-backed model field uses `TableUtil.createOptionsColumn` with the actual field as `id` and the hook's `.options` unchanged. Compare all query hooks called by the page with the entries in `const loadables = useArray(...)`; none may be missing, even static enum queries. Review any scoped filtering or association writes the page already supports.
- Check its barrel and package export, list key and invalidation dependencies, and existing route registrations, translations, and read/write permissions.

Preserve intentional behavior such as read-only actions, custom validation, and parent-scoped routes. Report fixes and remaining exceptions with file locations and reasons. If the page already conforms and no other change was requested, leave it unchanged.

## 1. Identify the resource

- Start with the requested symbol (strip `#sym:` if present), its definition, and any explicit target client. Use the [create-datahook ownership and cache rules](../create-datahook/SKILL.md#resolve-the-owner-and-cache-key). `@gen-epix/api-<db>` normally maps to `@gen-epix/ui-client-<db>`, not to the app containing the closest example. If a bare method exists in multiple SDKs, use its declaring package or ask which client; don't default to CaseDB.
- Read the public API class method in `packages/api-<db>/src/api.ts`, the typed `AxiosPromise` signature, the returned array element type, and the actual single-item write signatures. Record the row ID, write model, editable fields, foreign keys, command names, and main list key. Don't infer these by singularizing the method name or edit the generated SDK.
- Follow [Query Key Dependencies in AGENTS.md](../../../AGENTS.md#query-key-dependencies) in the target's `src/constants/query.constants.ts`. Reuse or add the main list key **and** its dependency entry, even for a scalar page. List what can make the cached rows stale (`[]` if nothing else does). If a write to this resource also makes an existing query stale, add the resource key to **that query's** entry, not the reverse.
- Check the target's `src/pages`, `src/routes/adminRoutes.tsx`, and the inherited common routes. Reuse an existing page/route instead of creating duplicates. A shared `@gen-epix/api-commondb` contract does not by itself mean the new page should appear in all three apps.
- Calibration: `diseasesGetAll` resolves to `CaseDbOntologyApi`, `CaseDbDisease`, `CASEDB_QUERY_KEY.DISEASES`, `CaseDbCommandName.DiseaseCrudCommand`, and the **existing** `/management/diseases` route. See [DiseasesAdminPage](../../../packages/ui-client-casedb/src/pages/DiseasesAdminPage/DiseasesAdminPage.tsx) for a scalar page.

## 2. Resolve related data and enum choices with `create-datahook`

**If a row has `x_id` and `x`, only `x_id` is populated by the backend. Never read or write `x`, not even as a display fallback.** Inspect other documented foreign keys too; not every field ending in `_id` is a foreign key (it may be the resource's own key or an external code).

For each relationship, **apply the [create-datahook skill](../create-datahook/SKILL.md)** to the *related* endpoint. Reuse or extend an existing hook before creating one. Obtain all choices from that resource, not just IDs present in the current rows. Pass its `options` and `isLoading` to the lookup field; use its map or option labels for a composite name. Call hooks at the top of the component. No inline `useQuery`, effect, per-row fetch, or extra lookup inside `fetchAll`.

For example, `etiologiesGetAll` needs **both** `useDiseaseOptionsQuery()` for `disease_id` and `useEtiologicalAgentOptionsQuery()` for `etiological_agent_id`. The write form is `OmitWithMetaData<CaseDbEtiology, 'disease' | 'etiological_agent'>`. The two options columns bind the same two IDs; a readable name can join the two labels, falling back to each original ID if its label is missing. See [EtiologiesAdminPage](../../../packages/ui-client-casedb/src/pages/EtiologiesAdminPage/EtiologiesAdminPage.tsx) for the wiring.

For **every API enum the page edits or displays**, apply the [static enum options workflow](../create-datahook/SKILL.md#static-enum-options). Call the hook once per enum and share its options between the form and the table. Don't define an inline choices array or a second label map.

### Options columns and loadables

When the page calls query hooks, import `useArray` from `@gen-epix/ui-core/hooks/useArray`. Collect **every** page-owned `xxxQuery` result exactly once, including list, map, validation, and static enum queries. Pass the named array as `loadables={loadables}` to `CrudPage`, never an inline array or a subset. For `AllelesAdminPage`:

```ts
const locusOptionsQuery = useLocusOptionsQuery();
const seqFormatOptionsQuery = useSeqFormatOptionsQuery();
const loadables = useArray([locusOptionsQuery, seqFormatOptionsQuery]);
```

**Bind options columns directly.** Use the actual model field as `id` and pass the same hook's `.options` unchanged to both field and column, as in [ConceptSetsAdminPage](../../../packages/ui-client-casedb/src/pages/ConceptSetsAdminPage/ConceptSetsAdminPage.tsx). The column declaration for the allele's sequence format is:

```ts
TableUtil.createOptionsColumn<TableData>({ id: 'seq_format', name: t`Sequence format`, options: seqFormatOptionsQuery.options })
```

Do not add a shadow field, `convertToTableData`, a page-side `.options.map(...)`, a cast, or a text-column `valueGetter` to make an enum fit. Keep `TableData` equal to the SDK row when no other enrichment is needed. If the direct binding fails, check the [enum hook and shared value contract](../create-datahook/SKILL.md#static-enum-options) rather than adapting the page.

## 3. Implement the page

Edit the existing component and barrel; for a new page, create `src/pages/<Resources>AdminPage/<Resources>AdminPage.tsx` and `index.ts` with `export * from './<Resources>AdminPage';`. Use named exports, local relative imports within the client, and public subpaths for common helpers. Build on [CrudPage](../../../packages/ui-client-common/src/pages/CrudPage/CrudPage.tsx); it owns the **main** list query, mutations, permissions, dialogs, loading/error handling, and table store.

| Callback | Contract for a typical `id`-based resource |
|---|---|
| `fetchAll(signal)` | Resolve the owning API with `container.resolve(...)`; return `(await api.xxxGetAll(null, null, { signal })).data`. Match the actual pagination/options signature. Don't call a React hook here. |
| `deleteOne(item)` | Call `api.xxxDeleteOne(item.id)`. |
| `updateOne(variables, item)` | Call `api.xxxPutOne(item.id, { ...writableFields, id: item.id })` when that is the declared body; return `.data`. |
| `createOne(variables)` | Call `api.xxxPostOne(writableFields)`; return `.data`. |

Use `useCallback` for these operations. Only pass supported mutations. If the SDK lacks a single-item write or its permission cannot be established, leave that action unavailable and report it; don't invent methods, substitute a bulk operation, or omit authorization to make it work.

**Check row identity, especially in OMOPDB.** `CrudPage` and its optimistic mutations use `row.id` in the *cached array*. For example, `OmopDbDomain` has `domain_id`, not `id`; `domain_str_id` is a different field. For a verified nonstandard primary key, adapt persisted rows to a typed UI row with `id` from that key at the fetch and mutation-response boundaries. Use the same row shape in any hook sharing the key. Send the real path ID and only SDK fields on writes, never the UI alias. `convertToTableData` or a type cast alone won't fix cache identity. If the endpoint has no verifiable stable ID, clarify before generating editable CRUD.

Define these together from the actual read/write models:

- **`FormFields`: always derive it with [`OmitWithMetaData`](../../../packages/ui-client-common/src/models/data.models.ts); never use `Pick`.** Start with the generated write model and pass only the additional keys the form excludes as the second type argument. This keeps new API fields visible to the form type instead of silently excluding them. In the allele form, `type FormFields = OmitWithMetaData<SeqDbAllele, 'length' | 'locus'>;` excludes the display-only length and expanded locus but already inherits `seq_format` with its exact type and optionality. Do not redeclare existing model fields with a union or intersection. Only extend the derived type for a genuinely form-only field (such as `colIds`); strip it before writing.
- **`getName` and `defaultSortByField`:** If the `GetAll` row model has `label` or `name`, use that field for both the display name and the default sort column. If it has both, choose the one users recognize as the row's display name and use it consistently. For example, a model with `name` but no `label` uses `item.name` and `defaultSortByField="name"`.
  - If neither field exists, choose a meaningful alternative such as `code`. A relationship row can use a composite of lookup labels for its name and sort by the most useful corresponding column. Use `id` as the last resort for either choice.
  - `getName` must also work for unsaved form values. If an individual item's display value is empty, try another readable value, then its `id` if present. This per-item fallback does not change the table's default sort field.
- **`schema`:** memoize `object<FormFields>().shape({...})` from Yup. Use `SchemaUtil.name`, `.code`, `.description`, `.rank`, etc. where their constraints actually fit. Match required/nullable values, enum values, ID formats, ranges, and cross-field rules. Don't assume every ID is UUIDv4.
- **`formFieldDefinitions`:** use typed `FormFieldDefinition<FormFields>` and `FORM_FIELD_DEFINITION_TYPE`. Use `TEXTFIELD` for strings, multiline for descriptions, `NUMBER`/`BOOLEAN`/`DATE` for corresponding scalars and `AUTOCOMPLETE` or `SELECT` for relationships/enums. The name and submitted value of a lookup field are the FK and selected ID, never the label or object.
- **`tableColumns`:** Never add the row's own `id` as a table column (`id: 'id'`), even when it is the fallback for `getName` or `defaultSortByField`. Leave `CrudPage`'s `showIdColumn` off. Foreign-key columns such as `locus_id` still display the related label.
  - Memoize `TableColumn<TableData>[]`. Use `TableUtil.createOptionsColumn` for options-backed fields; reserve the text, number, boolean, and date factories for plain scalar columns. Use literal translations for headers, field labels, item name and titles; include `t` and changing lookups in memo dependencies.
- **Render:** use `<CrudPage<FormFields, Row, TableData, DB_QUERY_KEY, DbApiPermission>>` with the target client's types (`TableData = Row` unless enriched). Pass the callbacks, schema, definitions, columns, `crudCommandType`, `resourceQueryKeyBase`, sort field/direction, `itemName`, `title`, `createItemDialogTitle` for creation, `TestIdUtil.createAttributes('<Resources>AdminPage')` as `testIdAttributes`, and the lookup `loadables`.

### Choose the advanced pattern only when needed

| Situation | What to adapt |
|---|---|
| Set with editable members | [ColSetsAdminPage](../../../packages/ui-client-casedb/src/pages/ColSetsAdminPage/ColSetsAdminPage.tsx): load member rows and choices via hooks; derive synthetic `colIds` for `TRANSFER_LIST` and table display. Write the parent first, then use its persisted ID with the actual association endpoint. Keep synthetic fields out of POST/PUT; invalidate the member list via `associationQueryKeys`, and require the association command in the applicable `extra*OnePermissions`. |
| Parent-scoped or conditional editor | [RefColsAdminPage](../../../packages/ui-client-casedb/src/pages/RefColsAdminPage/RefColsAdminPage.tsx): reuse the global list and filter via `fetchAllSelect` for a route parameter; set/lock the parent ID when scoped. Use lookup and validation-rule hooks, dynamic definitions, conditional Yup validation and `onFormChange` to clear incompatible selections. Don't put a filtered list under the global cache key. |
| Nested write shape | [CaseTypesAdminPage](../../../packages/ui-client-casedb/src/pages/CaseTypesAdminPage/CaseTypesAdminPage.tsx): project nested properties into the form and translate them back on create/update. Use `getFormValuesFromItem`, `convertToTableData`, or `getOptimisticUpdateIntermediateItem` where the shapes differ. |

## 4. Register and verify

1. In **the owning client's** `src/routes/adminRoutes.tsx`, reuse the page's registration and preserve its path and nesting. Only if the intended route is missing, import the page barrel and add an object to `createAdminRoutes()` at `/management/<plural-kebab-name>` (or the relevant parent). Keep `...createCommonAdminRoutes<...>()` and existing overrides. No separate menu or demo route is needed.
2. Follow the [CaseDB route objects](../../../packages/ui-client-casedb/src/routes/adminRoutes.tsx): `Component`, `errorElement: <RouterErrorPage />`, and `handle` with an existing `ADMIN_PAGE_CATEGORY`, `requiresUserProfile: true`, literal translated `title` and `subTitle`, and `requiredPermissions`. Require the actual command and permission for **every** read needed to render, including lookups and member lists (normally `{ command_name: DbCommandName.XCrudCommand, permission_type: DbPermissionType.READ }`). Gate writes on the page, not route entry. Use common permission types for common contracts.
3. If a barrel is new or its package subpath is missing, run `pnpm run update-exports` in the affected UI package. After code changes run `pnpm run lint-fix`, `pnpm run lint`, `pnpm run check-types`, and `pnpm run test-run`. For changed labels run `pnpm run add-missing-translations`, fill the locale values, and run `pnpm run test-missing-translations`.
4. Verify the registered path and permissions, the list key and its dependency entry, and the actual POST/PUT/DELETE signatures. Try a row with only FK IDs: the form should preselect the right options, the table should show labels, and saving should send IDs only. For each enum, use an unmodified SDK row to check display, filtering, form preselection, and the submitted value and type. Type-checking the column alone does not verify value matching. Report the client, route, hooks reused/created, and any unavailable actions.

**SeqDB example:** `protocolSetMembersGetAll` should produce `/management/protocol-set-members` in `ui-client-seqdb`, backed by `SeqDbSeqApi` and `SEQDB_QUERY_KEY.PROTOCOL_SET_MEMBERS`. Use `protocolSetsGetAll` and `protocolsGetAll` through two data hooks. The route needs READ on `ProtocolSetMemberCrudCommand`, `ProtocolSetCrudCommand`, and `ProtocolCrudCommand`; the two editable fields are `protocol_set_id` and `protocol_id`.
