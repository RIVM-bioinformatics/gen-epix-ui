---
name: translate
description: >-
  Run the add-missing-translations package script, translate missing locale JSON
   values marked with the ⚠ missing translation marker, and leave changes
   unstaged. Use when asked to fill missing translations, resolve ⚠ translation
   markers, or update locale JSON.
---

# Translate Missing Translations

Fill missing translation placeholders in locale JSON files without staging any
changes.

## Workflow

1. From the repository root, run the translation placeholder generator:

   ```sh
   pnpm run add-missing-translations
   ```

2. Find all remaining missing translation markers:

   ```sh
   rg -n "⚠" --glob "**/locale/*.json"
   ```

3. For each value containing `⚠`, edit the owning `*/locale/*.json` file and
   replace the marker placeholder with a real translation.

   - Preserve the existing JSON structure, keys, ordering, indentation, and
     escaping style.
   - Translate from the corresponding source locale when available, usually
     `en.json` to `nl.json` or `nl.json` to `en.json`.
   - Keep product names, API names, route names, placeholders, variables, and
     interpolation tokens unchanged.
   - Do not translate generated keys or change unrelated strings.

4. Repeat the marker search until no missing translation markers remain:

   ```sh
   rg -n "⚠" --glob "**/locale/*.json"
   ```

5. Validate the translation files with the narrowest relevant command. Prefer
   the owning package's validation when only one package changed, for example:

   ```sh
   pnpm --filter @gen-epix/ui run test-missing-translations
   ```

   If several packages or examples changed, run the root translation validation
   when available:

   ```sh
   pnpm run add-missing-translations
   pnpm run validate
   ```

6. Review the modified locale JSON files without staging them:

   ```sh
   git --no-pager diff -- '**/locale/*.json'
   ```

7. Confirm the worktree changes are left unstaged:

   ```sh
   git status --short
   ```

## Notes

- Use `pnpm`, not `npm` or `yarn`, in this repository.
- If `pnpm run add-missing-translations` rewrites files, inspect those changes
  before translating markers.
- Do not run `git add` or otherwise stage translation changes in this workflow.
