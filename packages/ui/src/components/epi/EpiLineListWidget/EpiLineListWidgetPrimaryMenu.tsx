import {
  use,
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import type {
  Case,
  CaseSet,
} from '@gen-epix/api-casedb';
import {
  CommandName,
  PermissionType,
} from '@gen-epix/api-casedb';

import { AuthorizationManager } from '../../../classes/managers/AuthorizationManager';
import { EpiEventBusManager } from '../../../classes/managers/EpiEventBusManager';
import type { MenuItemData } from '../../../models/nestedMenu';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { UseColumnsMenu } from '../../../hooks/useColumnsMenu';
import type { TableColumn } from '../../../models/table';
import { CaseUtil } from '../../../utils/CaseUtil';
import { EpiWidgetMenu } from '../EpiWidgetMenu';
import { SelectionFilter } from '../../../classes/filters/SelectionFilter';

export type EpiLineListWidgetPrimaryMenuProps = {
  readonly caseSet?: CaseSet;
};


export const EpiLineListWidgetPrimaryMenu = ({
  caseSet,
}: EpiLineListWidgetPrimaryMenuProps) => {
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const { t } = useTranslation();
  const selectedIds = useStore(epiDashboardStore, useShallow((state) => state.selectedIds));
  const sortedData = useStore(epiDashboardStore, useShallow((state) => state.sortedData));
  const completeCaseType = useStore(epiDashboardStore, useShallow((state) => state.completeCaseType));
  const setFilterValue = useStore(epiDashboardStore, useShallow((state) => state.setFilterValue));
  const filters = useStore(epiDashboardStore, useShallow((state) => state.filters));
  const setSelectedIds = useStore(epiDashboardStore, useShallow((state) => state.setSelectedIds));
  const findSimilarCasesResults = useStore(epiDashboardStore, useShallow((state) => state.findSimilarCasesResults));

  const hasCellData = useCallback((row: Case, tableColumn: TableColumn<Case>, rowIndex: number) => {
    if (tableColumn.type === 'caseType' && tableColumn.valueGetter) {
      return !tableColumn.valueGetter({
        id: tableColumn.id,
        row,
        rowIndex,
      }).isMissing;
    }
    return !CaseUtil.getRowValue(row.content, completeCaseType.cols[tableColumn.id], completeCaseType).isMissing;
  }, [completeCaseType]);

  const createFilterFromSelectedRowCaseIds = useCallback(async () => {
    await setFilterValue('selected', selectedIds);
    setSelectedIds([]);
  }, [setFilterValue, selectedIds, setSelectedIds]);

  const hasSelectionFilter = filters.some((filter) => filter instanceof SelectionFilter && filter.filterValue.length > 0);
  const columnsMenuItem = UseColumnsMenu({ hasCellData });

  const similarCaseIds = useMemo(() => findSimilarCasesResults?.flatMap((result) => result.similarCaseIds) || [], [findSimilarCasesResults]);

  const rowsWithoutSimilarCases = useMemo(() => {
    if (!findSimilarCasesResults?.length) {
      return sortedData;
    }
    return sortedData.filter((row) => !similarCaseIds.includes(row.id));
  }, [findSimilarCasesResults, sortedData, similarCaseIds]);

  const selectedRowsWithoutSimilarCases = useMemo(() => {
    return rowsWithoutSimilarCases.filter((row) => selectedIds?.includes(row.id));
  }, [rowsWithoutSimilarCases, selectedIds]);

  const selectedRows = useMemo(() => {
    return sortedData.filter((row) => selectedIds?.includes(row.id));
  }, [sortedData, selectedIds]);

  const menu = useMemo<MenuItemData[]>(() => {
    const shouldShowCreateEventMenuItem = AuthorizationManager.instance.doesUserHavePermission([{ command_name: CommandName.CreateCaseSetCommand, permission_type: PermissionType.EXECUTE }]);
    const shouldShowAddToEventMenuItem = AuthorizationManager.instance.doesUserHavePermission([{ command_name: CommandName.CaseSetMemberCrudCommand, permission_type: PermissionType.CREATE }]);
    const shouldShowRemoveFromEventMenuItem = !!caseSet && AuthorizationManager.instance.doesUserHavePermission([{ command_name: CommandName.CaseSetMemberCrudCommand, permission_type: PermissionType.DELETE }]);
    // !TODO
    // const shouldShowBulkEditCaseMenuItem = true;

    const actionsColumnMenuItem: MenuItemData = {
      items: [
        {
          callback: createFilterFromSelectedRowCaseIds,
          disabled: !selectedIds?.length || similarCaseIds.length > 0,
          divider: true,
          label: t`Create filter from selected cases`,
        },
        {
          callback: () => EpiEventBusManager.instance.emit('openFindSimilarCasesDialog', {
            allRows: sortedData,
            completeCaseType,
            selectedRows: sortedData,
          }),
          disabled: hasSelectionFilter,
          label: t`Find similar cases`,
        },
        {
          callback: () => EpiEventBusManager.instance.emit('openFindSimilarCasesDialog', {
            allRows: sortedData,
            completeCaseType,
            selectedRows,
          }),
          disabled: !selectedIds?.length || hasSelectionFilter,
          label: t`Find similar cases (based on selected cases)`,
        },
        {
          callback: () => EpiEventBusManager.instance.emit('openRemoveFindSimilarCasesResultDialog', {
            completeCaseType,
          }),
          disabled: !findSimilarCasesResults?.length,
          label: t`Remove similar cases from results`,
        },
      ],
      label: t`Actions`,
    };

    if (shouldShowCreateEventMenuItem) {
      actionsColumnMenuItem.items.push(
        {
          callback: () => EpiEventBusManager.instance.emit('openCreateEventDialog', {
            completeCaseType,
            rows: selectedRows,
          }),
          disabled: !selectedIds?.length,
          label: t`Create new event with selected cases`,
        },
      );
    }

    if (shouldShowAddToEventMenuItem) {
      actionsColumnMenuItem.items.push(
        {
          callback: () => EpiEventBusManager.instance.emit('openAddCasesToEventDialog', {
            currentCaseSet: caseSet,
            rows: selectedRows,
          }),
          disabled: !selectedIds?.length,
          label: t`Add selected cases to an existing event`,
        },
      );
    }

    if (shouldShowRemoveFromEventMenuItem) {
      actionsColumnMenuItem.items.push(
        {
          callback: () => EpiEventBusManager.instance.emit('openRemoveCasesFromEventDialog', {
            caseSet,
            rows: selectedRowsWithoutSimilarCases,
          }),
          disabled: !selectedRowsWithoutSimilarCases.length,
          label: t`Remove selected cases from this event`,
        },
      );
    }
    if (actionsColumnMenuItem.items.length > 3) {
      actionsColumnMenuItem.items[3].divider = true;
    }

    // last(actionsColumnMenuItem.items).divider = true;
    // if (shouldShowBulkEditCaseMenuItem) {
    //   actionsColumnMenuItem.items.push(
    //     {
    //       disabled: !selectedRowCaseIds?.length,
    //       label: t`Bulk edit selected cases`,
    //       callback: () => EpiEventBusManager.instance.emit('openBulkEditCaseDialog', { rows: selectedRows }),
    //     },
    //   );
    // }

    const menus: MenuItemData[] = [
      columnsMenuItem,
      actionsColumnMenuItem,
    ];

    return menus;
  }, [caseSet, t, selectedIds?.length, hasSelectionFilter, similarCaseIds.length, createFilterFromSelectedRowCaseIds, findSimilarCasesResults?.length, columnsMenuItem, sortedData, completeCaseType, selectedRows, selectedRowsWithoutSimilarCases]);


  return <EpiWidgetMenu menu={menu} />;
};
