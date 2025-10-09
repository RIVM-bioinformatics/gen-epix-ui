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
  const [t] = useTranslation();

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
      visibleColumnIds,
      tableColumns,
      sortedData,
      hasCellData,
    }));

  }, [emitTableEvent, hasCellData, sortedData, tableColumns, visibleColumnIds]);

  const menuItemData: MenuItemData = useMemo(() => {
    const items: MenuItemData[] = [
      {
        label: t`Change order / visibility`,
        callback: () => onColumnsEditorMenuItemClick(),
        divider: true,
      },
      {
        label: t`Reset`,
        callback: () => emitTableEvent('reset'),
        autoCloseDisabled: true,
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
        const areAllVisible = dimension.columnIds.every(columnId => visibleColumnIds.includes(columnId));
        const areSomeVisible = dimension.columnIds.some(columnId => visibleColumnIds.includes(columnId));
        items.push({
          autoCloseDisabled: true,
          label: dimension.label,
          callback: () => toggleDimension(dimension.columnIds),
          // eslint-disable-next-line no-nested-ternary
          rightIcon: areAllVisible ? <CheckBoxOutlinedIcon /> : areSomeVisible ? <IndeterminateCheckBoxIcon /> : <CheckBoxOutlineBlankOutlinedIcon />,
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
  }, [t, columnDimensions, onColumnsEditorMenuItemClick, emitTableEvent, tableColumns, onHideColumnsWithoutDataClick, visibleColumnIds, toggleDimension, toggleItem]);

  return menuItemData;
};
