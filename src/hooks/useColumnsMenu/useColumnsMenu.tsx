import { produce } from 'immer';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import CheckBoxOutlineBlankOutlinedIcon from '@mui/icons-material/CheckBoxOutlineBlankOutlined';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';

import type { MenuItemData } from '../../models/nestedMenu';
import type { TableColumn } from '../../models/table';
import { useTableStoreContext } from '../../stores/tableStore';


export type UseColumnsMenuProps<TRowData> = {
  readonly hasCellData?: (row: TRowData, column: TableColumn<TRowData>, rowIndex: number) => boolean;
};

//Note: must be CamelCase because of HMR
export const UseColumnsMenu = <TRowData,>({ hasCellData }: UseColumnsMenuProps<TRowData>): MenuItemData => {
  const tableStore = useTableStoreContext<TRowData>();
  const emitTableEvent = useStore(tableStore, useShallow((state) => state.emitEvent));
  const tableColumns = useStore(tableStore, useShallow((state) => state.columns));
  const visibleColumnIds = useStore(tableStore, useShallow((state) => state.columnSettings.filter(c => c.isVisible).map(c => c.id)));
  const columnDimensions = useStore(tableStore, useShallow((state) => state.columnDimensions));
  const sortedData = useStore(tableStore, useShallow((state) => state.sortedData));
  const [t] = useTranslation();

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

  const onHideColumnsWithoutDataClick = useCallback(() => {
    const columns = visibleColumnIds.map(id => tableColumns.find(c => c.id === id));
    let newVisibleColumnIds: string[];
    if (hasCellData) {
      newVisibleColumnIds = columns.filter(column => {
        if (column.isStatic) {
          return true;
        }
        return sortedData.every((row, rowIndex) => hasCellData(row, column, rowIndex));
      }).map(c => c.id);
    } else {
      newVisibleColumnIds = columns.filter(column => {
        if (column.isStatic) {
          return true;
        }
        return sortedData.some((row, rowIndex) => {
          if (column.valueGetter) {
            return column.valueGetter({
              id: column.id,
              row,
              rowIndex,
            });
          }
          return row[column.id as keyof TRowData] !== undefined;
        });
      }).map(c => c.id);
    }
    emitTableEvent('columnVisibilityChange', newVisibleColumnIds);

  }, [emitTableEvent, hasCellData, sortedData, tableColumns, visibleColumnIds]);

  const menuItemData: MenuItemData = useMemo(() => {
    const items: MenuItemData[] = [
      {
        label: t`Reset`,
        callback: () => emitTableEvent('reset'),
        autoCloseDisabled: true,
        divider: true,
      },
      {
        label: t`Show all`,
        callback: () => {
          emitTableEvent('columnVisibilityChange', [...tableColumns.map(c => c.id)]);
        },
        autoCloseDisabled: true,
      },
      {
        label: t`Hide all`,
        callback: () => {
          emitTableEvent('columnVisibilityChange', [...tableColumns.filter(c => c.isStatic).map(c => c.id)]);
        },
        autoCloseDisabled: true,
      },
      {
        label: t`Hide columns without data`,
        callback: () => onHideColumnsWithoutDataClick(),
        divider: true,
        autoCloseDisabled: true,
      },
    ];

    if (columnDimensions) {
      columnDimensions.forEach((dimension) => {
        items.push({
          label: dimension.label,
          items: dimension.columnIds.map((columnId) => ({
            autoCloseDisabled: true,
            label: tableColumns.find(c => c.id === columnId)?.headerName ?? '',
            callback: () => toggleItem(columnId),
            rightIcon: visibleColumnIds.includes(columnId) ? <CheckBoxOutlinedIcon /> : <CheckBoxOutlineBlankOutlinedIcon />,
          })),
        });
      });
    } else {
      tableColumns.filter(c => !c.isStatic).forEach((column) => {
        items.push({
          autoCloseDisabled: true,
          label: column.headerName,
          callback: () => toggleItem(column.id),
          rightIcon: visibleColumnIds.includes(column.id) ? <CheckBoxOutlinedIcon /> : <CheckBoxOutlineBlankOutlinedIcon />,
        });
      });
    }

    return {
      label: t`Columns`,
      items,
    };
  }, [t, columnDimensions, emitTableEvent, tableColumns, onHideColumnsWithoutDataClick, visibleColumnIds, toggleItem]);

  return menuItemData;
};
