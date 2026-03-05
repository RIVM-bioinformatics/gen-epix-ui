import {
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

import type {
  Case,
  CaseSet,
} from '../../../api';
import {
  CommandName,
  PermissionType,
} from '../../../api';
import { AuthorizationManager } from '../../../classes/managers/AuthorizationManager';
import { EpiEventBusManager } from '../../../classes/managers/EpiEventBusManager';
import type { MenuItemData } from '../../../models/nestedMenu';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { UseColumnsMenu } from '../../../hooks/useColumnsMenu';
import type { TableColumn } from '../../../models/table';
import { CaseUtil } from '../../../utils/CaseUtil';
import { EpiWidgetMenu } from '../EpiWidgetMenu';

export type EpiLineListPrimaryMenuProps = {
  readonly caseSet?: CaseSet;
};


export const EpiLineListPrimaryMenu = ({
  caseSet,
}: EpiLineListPrimaryMenuProps) => {
  const epiDashboardStore = useContext(EpiDashboardStoreContext);
  const { t } = useTranslation();
  const selectedIds = useStore(epiDashboardStore, useShallow((state) => state.selectedIds));
  const sortedData = useStore(epiDashboardStore, useShallow((state) => state.sortedData));
  const completeCaseType = useStore(epiDashboardStore, useShallow((state) => state.completeCaseType));
  const setFilterValue = useStore(epiDashboardStore, useShallow((state) => state.setFilterValue));
  const setSelectedIds = useStore(epiDashboardStore, useShallow((state) => state.setSelectedIds));
  const findSimilarCasesResults = useStore(epiDashboardStore, useShallow((state) => state.findSimilarCasesResults));

  const hasCellData = useCallback((row: Case, column: TableColumn<Case>, rowIndex: number) => {
    if (column.type === 'caseType' && column.valueGetter) {
      return !column.valueGetter({
        row,
        id: column.id,
        rowIndex,
      }).isMissing;
    }
    return !CaseUtil.getRowValue(row.content, completeCaseType.case_type_cols[column.id], completeCaseType).isMissing;
  }, [completeCaseType]);

  const createFilterFromSelectedRowCaseIds = useCallback(async () => {
    await setFilterValue('selected', selectedIds);
    setSelectedIds([]);
  }, [setFilterValue, selectedIds, setSelectedIds]);


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
    // FIXME
    // const shouldShowBulkEditCaseMenuItem = true;

    const actionsColumnMenuItem: MenuItemData = {
      label: t`Actions`,
      items: [
        {
          label: t`Create filter from selected cases`,
          disabled: !selectedIds?.length,
          callback: createFilterFromSelectedRowCaseIds,
          divider: true,
        },
        {
          label: t`Find similar cases`,
          callback: () => EpiEventBusManager.instance.emit('openFindSimilarCasesDialog', {
            selectedRows: sortedData,
            allRows: sortedData,
            completeCaseType,
          }),
        },
        {
          label: t`Find similar cases (based on selected cases)`,
          disabled: !selectedIds?.length,
          callback: () => EpiEventBusManager.instance.emit('openFindSimilarCasesDialog', {
            selectedRows,
            allRows: sortedData,
            completeCaseType,
          }),
        },
        {
          label: t`Remove similar cases from results`,
          disabled: !findSimilarCasesResults?.length,
          callback: () => EpiEventBusManager.instance.emit('openRemoveFindSimilarCasesResultDialog', {
            completeCaseType,
          }),
        },
      ],
    };

    if (shouldShowCreateEventMenuItem) {
      actionsColumnMenuItem.items.push(
        {
          label: t`Create new event with selected cases`,
          disabled: !selectedIds?.length,
          callback: () => EpiEventBusManager.instance.emit('openCreateEventDialog', {
            rows: selectedRows,
            completeCaseType,
          }),
        },
      );
    }

    if (shouldShowAddToEventMenuItem) {
      actionsColumnMenuItem.items.push(
        {
          disabled: !selectedIds?.length,
          label: t`Add selected cases to existing event`,
          callback: () => EpiEventBusManager.instance.emit('openAddCasesToEventDialog', {
            rows: selectedRows,
            currentCaseSet: caseSet,
          }),
        },
      );
    }

    if (shouldShowRemoveFromEventMenuItem) {
      actionsColumnMenuItem.items.push(
        {
          disabled: !selectedRowsWithoutSimilarCases.length,
          label: t`Remove selected cases from this event`,
          callback: () => EpiEventBusManager.instance.emit('openRemoveCasesFromEventDialog', {
            rows: selectedRowsWithoutSimilarCases,
            caseSet,
          }),
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
  }, [caseSet, t, selectedIds?.length, createFilterFromSelectedRowCaseIds, findSimilarCasesResults?.length, columnsMenuItem, selectedRows, sortedData, completeCaseType, selectedRowsWithoutSimilarCases]);


  return <EpiWidgetMenu menu={menu} />;
};
