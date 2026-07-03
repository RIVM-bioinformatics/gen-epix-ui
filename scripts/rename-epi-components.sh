#!/usr/bin/env bash
# rename-epi-components.sh
#
# PURPOSE:
#   1. Rename EpiXxx components → Xxx in packages/ui-casedb/src/components/ui
#      (remove Epi prefix), EXCEPT EpiCurve* components.
#   2. Rename epiCase prop/variable → caseDbCase.
#   3. Remove Epi prefix from all models/enums in packages/ui-casedb/src/models/epi.ts.
#   4. Rename the actual files and directories.
#
# Run from repo root: bash scripts/rename-epi-components.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UI_SRC="$REPO_ROOT/packages/ui-casedb/src"
COMPONENTS_UI="$UI_SRC/components/ui"

cd "$REPO_ROOT"

echo "=== Phase 1: Rename identifiers in component files, models, pages, forms, index ==="
#
# Applied to: components/ui/, models/epi.ts, pages/, components/forms/, index.ts
#
# Exclusions (things NOT renamed):
#   - EpiCurve*                            per user request
#   - EpiContactDetailsDialog*             from @gen-epix/ui (external)
#   - EpiDashboardGeneralSettings          store setting type (not a component/model)
#   - EpiDashboardStore + variants         zustand store types
#   - EpiUploadStore + variants            zustand store types
#   - EpiListWidgetData                    store internal type
#   - EpiMapWidgetData                     store internal type
#   - EpiTreeWidgetData                    store internal type
#   - EpiUploadUtil, EpiTreeUtil, etc.     utility classes
#   - EpiDataService, EpiEventBusService,  service classes
#     EpiLineListCaseSetMembersService
#
PHASE1_PERL='
  # 1. Rename epiCase variable/prop → caseDbCase
  s/\bepiCase\b/caseDbCase/g;

  # 2. Rename all-caps EPI_ enum prefix from models/epi.ts and component files
  #    (explicit list to avoid touching EPI_WIDGET_NAME in data/epi.ts)
  s/\bEPI_DASHBOARD_ARRANGEMENT_ORIENTATION\b/DASHBOARD_ARRANGEMENT_ORIENTATION/g;
  s/\bEPI_UPLOAD_STEP\b/UPLOAD_STEP/g;
  s/\bEPI_WIDGET_CONSTRAINT_CARDINAL_DIRECTION\b/WIDGET_CONSTRAINT_CARDINAL_DIRECTION/g;
  s/\bEPI_CASE_INFO_DIALOG_TAB_NAME\b/CASE_INFO_DIALOG_TAB_NAME/g;

  # 3. Rename EpiXxx → Xxx (CamelCase) with exclusions.
  #    Pattern: \bEpi followed by uppercase letter, NOT if it is one of the
  #    excluded identifiers (store/util/service identifiers).
  s/\bEpi(?!
    Curve
    |ContactDetailsDialog
    |DashboardGeneralSettings\b
    |DashboardStore(?:State|Actions|KwArgs|InitialState(?:KwArgs)?|Context|\b)
    |UploadStore(?:State|Actions|KwArgs|InitialState(?:KwArg)?|Context|\b)
    |ListWidgetData\b
    |MapWidgetData\b
    |TreeWidgetData\b
    |UploadUtil\b
    |TreeUtil\b
    |MapUtil\b
    |FindSimilarCasesUtil\b
    |FilterUtil\b
    |CurveUtil\b
    |DataService\b
    |EventBusService\b
    |LineListCaseSetMembersService\b
  )([A-Z])/$1/gx;
'

# Files to process in Phase 1
PHASE1_DIRS=(
  "$UI_SRC/components/ui"
  "$UI_SRC/components/forms"
  "$UI_SRC/pages"
)

echo "  Processing component/model/page files..."
for dir in "${PHASE1_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    find "$dir" -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | \
      xargs -0 perl -i -pe "$PHASE1_PERL"
  fi
done

# Process models/epi.ts and main index.ts separately
perl -i -pe "$PHASE1_PERL" "$UI_SRC/models/epi.ts"
perl -i -pe "$PHASE1_PERL" "$UI_SRC/index.ts"

echo "=== Phase 2: Rename model types in store/util/class files ==="
#
# These files are NOT components, but they DO import model types from models/epi.ts.
# We only rename the specific model types (not store-internal types).
#
PHASE2_PERL='
  # All-caps enum renames from models/epi.ts
  s/\bEPI_DASHBOARD_ARRANGEMENT_ORIENTATION\b/DASHBOARD_ARRANGEMENT_ORIENTATION/g;
  s/\bEPI_UPLOAD_STEP\b/UPLOAD_STEP/g;
  s/\bEPI_WIDGET_CONSTRAINT_CARDINAL_DIRECTION\b/WIDGET_CONSTRAINT_CARDINAL_DIRECTION/g;

  # Model type renames from models/epi.ts
  s/\bEpiCaseHasCaseSet\b/CaseHasCaseSet/g;
  s/\bEpiConceptBoundaryProps\b/ConceptBoundaryProps/g;
  s/\bEpiDashboardArrangementWidgetAssignments\b/DashboardArrangementWidgetAssignments/g;
  s/\bEpiDashboardArrangementConfig\b/DashboardArrangementConfig/g;
  s/\bEpiDashboardArrangementCell\b/DashboardArrangementCell/g;
  s/\bEpiDashboardArrangement\b/DashboardArrangement/g;
  s/\bEpiDashboardEpiCurveSettings\b/DashboardEpiCurveSettings/g;
  s/\bEpiDashboardTreeSettings\b/DashboardTreeSettings/g;
  s/\bEpiData\b/Data/g;
  s/\bEpiLineListRangeSubjectValue\b/LineListRangeSubjectValue/g;
  s/\bEpiLinkedScrollSubjectValue\b/LinkedScrollSubjectValue/g;
  s/\bEpiUploadCompleteColStats\b/UploadCompleteColStats/g;
  s/\bEpiUploadFileColumnAssignment\b/UploadFileColumnAssignment/g;
  s/\bEpiUploadMappedColumnsFormFields\b/UploadMappedColumnsFormFields/g;
  s/\bEpiUploadMappedColumn\b/UploadMappedColumn/g;
  s/\bEpiUploadSequenceMappingForCaseId\b/UploadSequenceMappingForCaseId/g;
  s/\bEpiUploadSequenceMapping\b/UploadSequenceMapping/g;
  s/\bEpiUploadTableRow\b/UploadTableRow/g;
  s/\bEpiWidgetConstraint\b/WidgetConstraint/g;
  s/\bEpiWidgetsConfig\b/WidgetsConfig/g;
'

PHASE2_DIRS=(
  "$UI_SRC/stores"
  "$UI_SRC/utils"
  "$UI_SRC/classes"
)

echo "  Processing store/util/class files..."
for dir in "${PHASE2_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    find "$dir" -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | \
      xargs -0 perl -i -pe "$PHASE2_PERL"
  fi
done

echo "=== Phase 3: Rename component directories and files ==="
#
# Rename EpiXxx/ → Xxx/ (excluding EpiCurveWidget/)
# Also rename EpiXxx.tsx/ts files inside those directories.
#

DIRS_TO_RENAME=(
  "EpiAddCasesToEventDialog"
  "EpiCaseContentForm"
  "EpiCaseContentFormDialog"
  "EpiCaseInfoDialog"
  "EpiCaseSetInfoDialog"
  "EpiCaseSummary"
  "EpiCaseTypeInfoDialog"
  "EpiCasesAlreadyInCaseSetWarning"
  "EpiCompletCaseTypeLoader"
  "EpiContextMenu"
  "EpiCreateEventDialog"
  "EpiCustomTabPanel"
  "EpiDashboard"
  "EpiDashboardEditCases"
  "EpiDashboardStoreLoader"
  "EpiDataCollectionAccessInfo"
  "EpiFindSimilarCasesDialog"
  "EpiLegendaItem"
  "EpiLineListWidget"
  "EpiMapWidget"
  "EpiRemoveCasesFromEventDialog"
  "EpiRemoveFindSimilarCasesResultDialog"
  "EpiSequenceDownloadDialog"
  "EpiStratification"
  "EpiTreeDescription"
  "EpiTreeWidget"
  "EpiUpload"
  "EpiUserRightsDialog"
  "EpiWarning"
  "EpiWidgetHeaderIconButton"
  "EpiWidgetMenu"
  "EpiWidgetUnavailable"
)

for old_dir in "${DIRS_TO_RENAME[@]}"; do
  new_dir="${old_dir#Epi}"
  old_path="$COMPONENTS_UI/$old_dir"
  new_path="$COMPONENTS_UI/$new_dir"

  if [ ! -d "$old_path" ]; then
    echo "  WARNING: $old_path does not exist, skipping..."
    continue
  fi

  echo "  Renaming dir: $old_dir → $new_dir"

  # Rename EpiXxx.tsx / EpiXxx.ts files inside (recursively), skipping EpiCurve*
  while IFS= read -r -d '' old_file; do
    file_dir="$(dirname "$old_file")"
    old_basename="$(basename "$old_file")"

    if [[ "$old_basename" == Epi* && "$old_basename" != EpiCurve* ]]; then
      new_basename="${old_basename#Epi}"
      echo "    File: $old_basename → $new_basename"
      mv "$old_file" "$file_dir/$new_basename"
    fi
  done < <(find "$old_path" -type f \( -name "Epi*.tsx" -o -name "Epi*.ts" \) -print0)

  # Rename the directory
  mv "$old_path" "$new_path"
done

echo ""
echo "=== All renames complete! ==="
echo ""
echo "NOTE: The storage key 'GENEPIX-EpiDashboard-Layout-v1.3' in DashboardUtil.ts"
echo "      has been changed to 'GENEPIX-Dashboard-Layout-v1.3'. Existing persisted"
echo "      data using the old key will not be found. Consider migrating this key."
echo ""
echo "Next steps:"
echo "  cd $REPO_ROOT"
echo "  npx eslint --fix packages/ui-casedb/src/"
echo "  pnpm run validate"
