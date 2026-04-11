import { produce } from 'immer';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import CheckBoxOutlineBlankOutlinedIcon from '@mui/icons-material/CheckBoxOutlineBlankOutlined';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';

import type { MenuItemData } from '../../models/nestedMenu';
import type { HasCellDataFn } from '../../models/table';
import { useTableStoreContext } from '../../stores/tableStore';
import { TableUtil } from '../../utils/TableUtil';


export type UseColumnsMenuProps<TRowData> = {
  readonly hasCellData?: HasCellDataFn<TRowData>;
};

//Note: must be CamelCase because of HMR
export const UseColumnsMenu = <TRowData,>({ hasCellData }: UseColumnsMenuProps<TRowData>): MenuItemData => {
  const tableStore = useTableStoreContext<TRowData>();
  const emitTableEvent = useStore(tableStore, useShallow((state) => state.emitEvent));
  const tableColumns = useStore(tableStore, useShallow((state) => state.columns));
  const visibleColumnIds = useStore(tableStore, useShallow((state) => state.columnSettings.filter(c => c.isVisible).map(c => c.id)));
  const columnDimensions = useStore(tableStore, useShallow((state) => state.columnDimensions));
  const sortedData = useStore(tableStore, useShallow((state) => state.sortedData));
  const { t } = useTranslation();

  const onColumnsEditorMenuItemClick = useCallback(() => {
    emitTableEvent('openColumnsEditorDialog', hasCellData as HasCellDataFn<unknown>);
  }, [emitTableEvent, hasCellData]);

  const toggleItem = useCallback((columnId: string): void => {
    const newVisibleColumnIds = produce(visibleColumnIds, (draft) => {
      if (draft.includes(columnId)) {
        return draft.filter(c => c !== columnId);
      }
      draft.push(columnId);
      return draft;
    });
    emitTableEvent('columnVisibilityChange', newVisibleColumnIds);
  }, [emitTableEvent, visibleColumnIds]);

  const toggleDimension = useCallback((dimensionColumnIds: string[]): void => {
    const areAllVisible = dimensionColumnIds.every(columnId => visibleColumnIds.includes(columnId));
    const newVisibleColumnIds = produce(visibleColumnIds, (draft) => {
      if (areAllVisible) {
        return draft.filter(c => !dimensionColumnIds.includes(c));
      }
      dimensionColumnIds.forEach((columnId) => {
        if (!draft.includes(columnId)) {
          draft.push(columnId);
        }
      });
      return draft;
    });
    emitTableEvent('columnVisibilityChange', newVisibleColumnIds);
  }, [emitTableEvent, visibleColumnIds]);

  const onHideColumnsWithoutDataClick = useCallback(() => {
    emitTableEvent('columnVisibilityChange', TableUtil.getColumnIdsWithData({
      hasCellData,
      sortedData,
      tableColumns,
      visibleColumnIds,
    }));

  }, [emitTableEvent, hasCellData, sortedData, tableColumns, visibleColumnIds]);

  const menuItemData: MenuItemData = useMemo(() => {
    const items: MenuItemData[] = [
      {
        callback: () => onColumnsEditorMenuItemClick(),
        divider: true,
        label: t`Change order / visibility`,
      },
      {
        autoCloseDisabled: true,
        callback: () => emitTableEvent('reset'),
        label: t`Reset`,
      },
      {
        autoCloseDisabled: true,
        callback: () => {
          emitTableEvent('columnVisibilityChange', [...tableColumns.map(c => c.id)]);
        },
        label: t`Show all`,
      },
      {
        autoCloseDisabled: true,
        callback: () => {
          emitTableEvent('columnVisibilityChange', [...tableColumns.filter(c => c.isStatic).map(c => c.id)]);
        },
        label: t`Hide all`,
      },
      {
        autoCloseDisabled: true,
        callback: () => onHideColumnsWithoutDataClick(),
        divider: true,
        label: t`Hide columns without data`,
      },
    ];

    if (columnDimensions) {
      columnDimensions.forEach((columnDimension) => {
        const areAllVisible = columnDimension.columnIds.every(columnId => visibleColumnIds.includes(columnId));
        const areSomeVisible = columnDimension.columnIds.some(columnId => visibleColumnIds.includes(columnId));
        items.push({
          autoCloseDisabled: true,
          callback: () => toggleDimension(columnDimension.columnIds),
          // eslint-disable-next-line no-nested-ternary
          checked: areAllVisible ? 'true' : areSomeVisible ? 'mixed' : 'false',
          items: columnDimension.columnIds.map((columnId) => {
            const checked = visibleColumnIds.includes(columnId);
            return {
              autoCloseDisabled: true,
              callback: () => toggleItem(columnId),
              checked: checked ? 'true' : 'false',
              label: tableColumns.find(c => c.id === columnId)?.headerName ?? '',
              rightIcon: checked ? <CheckBoxOutlinedIcon /> : <CheckBoxOutlineBlankOutlinedIcon />,
            };
          }),
          label: columnDimension.label,
          // eslint-disable-next-line no-nested-ternary
          rightIcon: areAllVisible ? <CheckBoxOutlinedIcon /> : areSomeVisible ? <IndeterminateCheckBoxIcon /> : <CheckBoxOutlineBlankOutlinedIcon />,
        });
      });
    } else {
      tableColumns.filter(c => !c.isStatic).forEach((column) => {
        const checked = visibleColumnIds.includes(column.id);
        items.push({
          autoCloseDisabled: true,
          callback: () => toggleItem(column.id),
          checked: checked ? 'true' : 'false',
          label: column.headerName,
          rightIcon: checked ? <CheckBoxOutlinedIcon /> : <CheckBoxOutlineBlankOutlinedIcon />,
        });
      });
    }

    return {
      items,
      label: t`Columns`,
    };
  }, [t, columnDimensions, onColumnsEditorMenuItemClick, emitTableEvent, tableColumns, onHideColumnsWithoutDataClick, visibleColumnIds, toggleDimension, toggleItem]);

  return menuItemData;
};
