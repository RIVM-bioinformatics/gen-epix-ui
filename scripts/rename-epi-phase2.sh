#!/usr/bin/env bash
# Phase 2: rename Epi/epi prefixes in utils/, stores/, services/, and rest of codebase
# EpiCurve is preserved throughout.
set -euo pipefail

SRCDIR="$(cd "$(dirname "$0")/../packages/ui-casedb/src" && pwd)"
echo "Source dir: $SRCDIR"

# Apply all content renames using perl -pi -e on all .ts/.tsx files.
# Order: most specific / longest compound names first to avoid partial matches.

find "$SRCDIR" -type f \( -name "*.ts" -o -name "*.tsx" \) | while IFS= read -r f; do
  perl -pi -e '
    # ==== Service classes (PascalCase, longest first) ====
    s/\bEpiLineListCaseSetMembersService\b/LineListCaseSetMembersService/g;
    s/\bEpiEventBusService\b/EventBusService/g;
    s/\bEpiDataService\b/DataService/g;

    # ==== Store type compound names (PascalCase, longest first) ====
    s/\bCreateEpiDashboardStoreInitialStateKwArgs\b/CreateDashboardStoreInitialStateKwArgs/g;
    s/\bCreateEpiDashboardStoreKwArgs\b/CreateDashboardStoreKwArgs/g;
    s/\bCreateEpiUploadStoreInitialStateKwArg\b/CreateUploadStoreInitialStateKwArg/g;
    s/\bCreateEpiUploadStoreKwArgs\b/CreateUploadStoreKwArgs/g;
    s/\bcreateEpiDashboardStoreInitialState\b/createDashboardStoreInitialState/g;
    s/\bcreateEpiDashboardStore\b/createDashboardStore/g;
    s/\bcreateEpiUploadStore\b/createUploadStore/g;
    s/\bEpiDashboardStoreActions\b/DashboardStoreActions/g;
    s/\bEpiDashboardStoreState\b/DashboardStoreState/g;
    s/\bEpiDashboardStoreContext\b/DashboardStoreContext/g;
    s/\bEpiDashboardStore\b/DashboardStore/g;
    s/\bEpiUploadStoreActions\b/UploadStoreActions/g;
    s/\bEpiUploadStoreState\b/UploadStoreState/g;
    s/\bEpiUploadStoreContext\b/UploadStoreContext/g;
    s/\bEpiUploadStore\b/UploadStore/g;

    # ==== Util classes (PascalCase) ====
    s/\bEpiFindSimilarCasesUtil\b/FindSimilarCasesUtil/g;
    s/\bEpiFilterUtil\b/FilterUtil/g;
    s/\bEpiMapUtil\b/MapUtil/g;
    s/\bEpiTreeUtil\b/TreeUtil/g;
    s/\bEpiUploadUtil\b/UploadUtil/g;

    # ==== Widget data types (PascalCase) ====
    s/\bEpiTreeWidgetData\b/TreeWidgetData/g;
    s/\bEpiListWidgetData\b/ListWidgetData/g;
    s/\bEpiMapWidgetData\b/MapWidgetData/g;

    # ==== Other PascalCase types ====
    s/\bEpiDashboardGeneralSettings\b/DashboardGeneralSettings/g;
    s/\bForwardRefEpiDashboardLayoutRendererRefMethods\b/ForwardRefDashboardLayoutRendererRefMethods/g;
    s/\bEpiCaseAbacContext\b/CaseAbacContext/g;
    s/\bEpiCaseTypeAbacContext\b/CaseTypeAbacContext/g;

    # ==== camelCase: set/reset/create/update methods (longest first) ====
    s/\bsetEpiDashboardArrangementConfig\b/setDashboardArrangementConfig/g;
    s/\bsetEpiDashboardPanelConfiguration\b/setDashboardPanelConfiguration/g;
    s/\bsetEpiDashboardLayoutUserConfig\b/setDashboardLayoutUserConfig/g;
    s/\bresetEpiDashboardGeneralSettings\b/resetDashboardGeneralSettings/g;
    s/\bresetEpiDashboardLayout\b/resetDashboardLayout/g;
    s/\bcreateEpiTreeWidgetDataInitialState\b/createTreeWidgetDataInitialState/g;
    s/\bupdateEpiTreeWidgetData\b/updateTreeWidgetData/g;
    s/\bupdateEpiListWidgetData\b/updateListWidgetData/g;
    s/\bupdateEpiMapWidgetData\b/updateMapWidgetData/g;

    # ==== camelCase: onXxx callbacks (longest first) ====
    s/\bonEpiDashboardLayoutSelectorSidebarButtonClick\b/onDashboardLayoutSelectorSidebarButtonClick/g;
    s/\bonEpiDashboardOpenCaseSetDescriptionButtonClick\b/onDashboardOpenCaseSetDescriptionButtonClick/g;
    s/\bonEpiDashboardOpenFilterSidebarButtonClick\b/onDashboardOpenFilterSidebarButtonClick/g;
    s/\bonEpiDashboardOpenInfoSidebarButtonClick\b/onDashboardOpenInfoSidebarButtonClick/g;
    s/\bonEpiDashboardOpenDownloadButtonClick\b/onDashboardOpenDownloadButtonClick/g;
    s/\bonEpiDashboardLayoutSelectorSidebarReset\b/onDashboardLayoutSelectorSidebarReset/g;
    s/\bonEpiDashboardFilterSidebarClose\b/onDashboardFilterSidebarClose/g;
    s/\bonEpiDashboardSettingsSidebarClose\b/onDashboardSettingsSidebarClose/g;
    s/\bonEpiDashboardDownloadSidebarClose\b/onDashboardDownloadSidebarClose/g;
    s/\bonEpiDashboardEditCasesClose\b/onDashboardEditCasesClose/g;

    # ==== camelCase: dialog refs (longest first) ====
    s/\bepiCaseTypeInfoDialogWithLoaderRef\b/caseTypeInfoDialogWithLoaderRef/g;
    s/\bepiRemoveFindSimilarCasesResultDialogRef\b/removeFindSimilarCasesResultDialogRef/g;
    s/\bepiRemoveCasesFromEventDialogRef\b/removeCasesFromEventDialogRef/g;
    s/\bepiAddCasesToEventDialogRef\b/addCasesToEventDialogRef/g;
    s/\bepiUploadEditColumnValuesDialogRef\b/uploadEditColumnValuesDialogRef/g;
    s/\bepiUploadSequenceMappingRef\b/uploadSequenceMappingRef/g;
    s/\bepiSequenceDownloadDialogRef\b/sequenceDownloadDialogRef/g;
    s/\bepiCaseTypeInfoDialogRef\b/caseTypeInfoDialogRef/g;
    s/\bepiCaseSetInfoDialogRef\b/caseSetInfoDialogRef/g;
    s/\bepiCreateEventDialogRef\b/createEventDialogRef/g;
    s/\bepiFindSimilarCasesDialogRef\b/findSimilarCasesDialogRef/g;
    s/\bepiContactDetailsDialogRef\b/contactDetailsDialogRef/g;
    s/\bepiCaseFormDialogRef\b/caseFormDialogRef/g;
    s/\bepiCaseInfoDialogRef\b/caseInfoDialogRef/g;
    s/\bepiUserRightsDialogRef\b/userRightsDialogRef/g;

    # ==== camelCase: store/context variables (longest/most-specific first) ====
    s/\bepiDashboardArrangementConfig\b/dashboardArrangementConfig/g;
    s/\bepiDashboardGeneralSettings\b/dashboardGeneralSettings/g;
    s/\bepiDashboardWidgetSettings\b/dashboardWidgetSettings/g;
    s/\bepiDashboardLayoutRendererRef\b/dashboardLayoutRendererRef/g;
    s/\bepiDashboardPermissions\b/dashboardPermissions/g;
    s/\bepiDashboardStoreContext\b/dashboardStoreContext/g;
    s/\bepiDashboardPanels\b/dashboardPanels/g;
    s/\bepiDashboardContext\b/dashboardContext/g;
    s/\bepiDashBoardStore\b/dashBoardStore/g;
    s/\bepiDashboardStore\b/dashboardStore/g;
    s/\bepiDashboardConfig\b/dashboardConfig/g;
    s/\bepiUploadStoreContext\b/uploadStoreContext/g;
    s/\bepiUploadStore\b/uploadStore/g;
    s/\bepiEventBusService\b/eventBusService/g;

    # ==== camelCase: widget data variables ====
    s/\bepiTreeWidgetData\b/treeWidgetData/g;
    s/\bepiListWidgetData\b/listWidgetData/g;
    s/\bepiMapWidgetData\b/mapWidgetData/g;

    # ==== camelCase: other variables ====
    s/\bepiCaseIsLoading\b/caseIsLoading/g;
    s/\bepiCaseError\b/caseError/g;
    s/\bepiContextMenuConfig\b/contextMenuConfig/g;
    s/\bepiMapCaseCount\b/mapCaseCount/g;

    # ==== camelCase: HMR singleton string keys (after class renames above) ====
    s/\bepiLineListCaseSetMembersService\b/lineListCaseSetMembersService/g;
    s/\bepiDataService\b/dataService/g;

    # ==== camelCase: config properties (SHORT - must be after all compound names) ====
    # epiDashboard: only 2 remaining uses (models/config.ts, CaseDbStandardConfigUtil.ts)
    s/\bepiDashboard\b/dashboard/g;
    s/\bepiLineList\b/lineList/g;
    # epiMap: only in config interface/util - safe after epiMapCaseCount, epiMapWidgetData done
    s/\bepiMap\b/map/g;
    # epiTree: safe after epiTreeWidgetData done
    s/\bepiTree\b/tree/g;
  ' "$f"
done

echo "Content renames done."

# ============================================================
# File and directory renames
# ============================================================

UI_CASEDB="$(cd "$(dirname "$0")/../packages/ui-casedb" && pwd)"

# --- Util dirs (rename dir then file inside) ---
for old_name in EpiFilterUtil EpiFindSimilarCasesUtil EpiMapUtil EpiTreeUtil EpiUploadUtil; do
  new_name="${old_name#Epi}"  # strip leading "Epi"
  old_dir="$UI_CASEDB/src/utils/$old_name"
  new_dir="$UI_CASEDB/src/utils/$new_name"

  # rename the main .ts file inside the dir
  old_file="$old_dir/$old_name.ts"
  new_file="$old_dir/$new_name.ts"
  if [ -f "$old_file" ]; then
    mv "$old_file" "$new_file"
    echo "Renamed file: $old_file -> $new_file"
  fi

  # rename .test.ts if present
  old_test="$old_dir/$old_name.test.ts"
  new_test="$old_dir/$new_name.test.ts"
  if [ -f "$old_test" ]; then
    mv "$old_test" "$new_test"
    echo "Renamed file: $old_test -> $new_test"
  fi

  # rename the directory
  if [ -d "$old_dir" ]; then
    mv "$old_dir" "$new_dir"
    echo "Renamed dir: $old_dir -> $new_dir"
  fi
done

# --- Service dirs ---
for old_name in EpiDataService EpiEventBusService EpiLineListCaseSetMembersService; do
  new_name="${old_name#Epi}"
  old_dir="$UI_CASEDB/src/classes/services/$old_name"
  new_dir="$UI_CASEDB/src/classes/services/$new_name"

  old_file="$old_dir/$old_name.ts"
  new_file="$old_dir/$new_name.ts"
  if [ -f "$old_file" ]; then
    mv "$old_file" "$new_file"
    echo "Renamed file: $old_file -> $new_file"
  fi

  if [ -d "$old_dir" ]; then
    mv "$old_dir" "$new_dir"
    echo "Renamed dir: $old_dir -> $new_dir"
  fi
done

# --- Store: epiDashboardStore -> dashboardStore ---
DASH_OLD="$UI_CASEDB/src/stores/epiDashboardStore"
DASH_NEW="$UI_CASEDB/src/stores/dashboardStore"

if [ -f "$DASH_OLD/epiDashboardStore.ts" ]; then
  mv "$DASH_OLD/epiDashboardStore.ts" "$DASH_OLD/dashboardStore.ts"
  echo "Renamed: epiDashboardStore.ts -> dashboardStore.ts"
fi
if [ -f "$DASH_OLD/epiDashboardStoreContext.tsx" ]; then
  mv "$DASH_OLD/epiDashboardStoreContext.tsx" "$DASH_OLD/dashboardStoreContext.tsx"
  echo "Renamed: epiDashboardStoreContext.tsx -> dashboardStoreContext.tsx"
fi
if [ -d "$DASH_OLD" ]; then
  mv "$DASH_OLD" "$DASH_NEW"
  echo "Renamed dir: epiDashboardStore -> dashboardStore"
fi

# --- Store: epiUploadStore -> uploadStore ---
UPLOAD_OLD="$UI_CASEDB/src/stores/epiUploadStore"
UPLOAD_NEW="$UI_CASEDB/src/stores/uploadStore"

if [ -f "$UPLOAD_OLD/epiUploadStore.ts" ]; then
  mv "$UPLOAD_OLD/epiUploadStore.ts" "$UPLOAD_OLD/uploadStore.ts"
  echo "Renamed: epiUploadStore.ts -> uploadStore.ts"
fi
if [ -f "$UPLOAD_OLD/epiUploadStoreContext.tsx" ]; then
  mv "$UPLOAD_OLD/epiUploadStoreContext.tsx" "$UPLOAD_OLD/uploadStoreContext.tsx"
  echo "Renamed: epiUploadStoreContext.tsx -> uploadStoreContext.tsx"
fi
if [ -d "$UPLOAD_OLD" ]; then
  mv "$UPLOAD_OLD" "$UPLOAD_NEW"
  echo "Renamed dir: epiUploadStore -> uploadStore"
fi

echo "All renames complete."
