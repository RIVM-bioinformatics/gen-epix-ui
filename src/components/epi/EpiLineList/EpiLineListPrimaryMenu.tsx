import noop from 'lodash/noop';
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
import { EpiLineListUtil } from '../../../utils/EpiLineListUtil';

export type EpiLineListPrimaryMenuProps = {
  readonly caseSet?: CaseSet;
};


export const EpiLineListPrimaryMenu = ({
  caseSet,
}: EpiLineListPrimaryMenuProps) => {
  const epiStore = useContext(EpiDashboardStoreContext);
  const { t } = useTranslation();
  const selectedIds = useStore(epiStore, useShallow((state) => state.selectedIds));
  const sortedData = useStore(epiStore, useShallow((state) => state.sortedData));
  const completeCaseType = useStore(epiStore, useShallow((state) => state.completeCaseType));
  const setFilterValue = useStore(epiStore, useShallow((state) => state.setFilterValue));
  const setSelectedIds = useStore(epiStore, useShallow((state) => state.setSelectedIds));

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
  }, [setSelectedIds, selectedIds, setFilterValue]);


  const columnsMenuItem = UseColumnsMenu({ hasCellData });


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
          disabled: true,
          callback: noop,
        },
      ],
    };

    if (shouldShowCreateEventMenuItem) {
      actionsColumnMenuItem.items.push(
        {
          label: t`Create new event with selected cases`,
          disabled: !selectedIds?.length,
          callback: () => EpiEventBusManager.instance.emit('openCreateEventDialog', {
            rows: EpiLineListUtil.getSelectedRows(sortedData, selectedIds),
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
          callback: () => EpiEventBusManager.instance.emit('openAddCasesToEventDialog', { rows: EpiLineListUtil.getSelectedRows(sortedData, selectedIds), currentCaseSet: caseSet }),
        },
      );
    }

    if (shouldShowRemoveFromEventMenuItem) {
      actionsColumnMenuItem.items.push(
        {
          disabled: !selectedIds?.length,
          label: t`Remove selected cases from this event`,
          callback: () => EpiEventBusManager.instance.emit('openRemoveCasesFromEventDialog', { rows: EpiLineListUtil.getSelectedRows(sortedData, selectedIds), caseSet }),
        },
      );
    }
    if (actionsColumnMenuItem.items.length > 2) {
      actionsColumnMenuItem.items[1].divider = true;
    }

    // last(actionsColumnMenuItem.items).divider = true;
    // if (shouldShowBulkEditCaseMenuItem) {
    //   actionsColumnMenuItem.items.push(
    //     {
    //       disabled: !selectedRowCaseIds?.length,
    //       label: t`Bulk edit selected cases`,
    //       callback: () => EpiEventBusManager.instance.emit('openBulkEditCaseDialog', { rows: EpiLineListUtil.getSelectedRows(sortedData, selectedIds) }),
    //     },
    //   );
    // }

    const menus: MenuItemData[] = [
      columnsMenuItem,
      actionsColumnMenuItem,
    ];

    return menus;
  }, [caseSet, t, selectedIds, createFilterFromSelectedRowCaseIds, columnsMenuItem, sortedData, completeCaseType]);


  return <EpiWidgetMenu menu={menu} />;
};
