import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import type { ReactElement } from 'react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import type { UniqueIdentifier } from '@dnd-kit/core';

import { TestIdUtil } from '../../../utils/TestIdUtil';
import { withDialog } from '../../../hoc/withDialog';
import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
} from '../../../hoc/withDialog';
import type {
  HasCellDataFn,
  TableColumn,
  TableColumnSettings,
} from '../../../models/table';
import { SortableList } from '../SortableList/SortableList';
import { useTableStoreContext } from '../../../stores/tableStore';
import { TableUtil } from '../../../utils/TableUtil';


export interface TableColumnsEditorDialogOpenProps {
  readonly hasCellData: HasCellDataFn<unknown>;
}

export interface TableColumnsEditorDialogProps extends WithDialogRenderProps<TableColumnsEditorDialogOpenProps> {
  //
}

export type TableColumnsEditorDialogRefMethods = WithDialogRefMethods<TableColumnsEditorDialogProps, TableColumnsEditorDialogOpenProps>;


type Item = {
  id: UniqueIdentifier;
  label: string;
  isSelected: boolean;
};

export const TableColumnsEditorDialog = withDialog<TableColumnsEditorDialogProps, TableColumnsEditorDialogOpenProps>((
  {
    onTitleChange,
    onActionsChange,
    onClose,
    openProps: { hasCellData },
  }: TableColumnsEditorDialogProps,
): ReactElement => {
  const [t] = useTranslation();
  const [items, setItems] = useState<Item[]>([]);

  const tableStore = useTableStoreContext<unknown>();
  const emitTableEvent = useStore(tableStore, useShallow((state) => state.emitEvent));
  const tableColumnSettings = useStore(tableStore, useShallow((state) => state.columnSettings));
  const tableColumns = useStore(tableStore, useShallow((state) => state.columns));
  const sortedData = useStore(tableStore, useShallow((state) => state.sortedData));

  const columnsMap = useMemo(() => {
    const map = new Map<string, TableColumn<unknown>>();
    tableColumns.forEach((column) => {
      map.set(column.id, column);
    });
    return map;
  }, [tableColumns]);

  const updateItems = useCallback((columnSettings: TableColumnSettings[]) => {
    const newItems: Item[] = [];
    columnSettings.forEach(columnSetting => {
      const column = columnsMap.get(columnSetting.id);
      if (column && !column.isStatic && !column.frozen) {
        newItems.push({
          id: column.id,
          label: column.headerName,
          isSelected: columnSetting.isVisible,
        });
      }
    });
    setItems(newItems);
  }, [columnsMap]);

  useEffect(() => {
    updateItems(tableColumnSettings);
  }, [tableColumnSettings, updateItems]);

  const onResetButtonClick = useCallback(() => {
    updateItems(TableUtil.createInitialColumnSettings(tableColumns));
  }, [tableColumns, updateItems]);


  useEffect(() => {
    onTitleChange(t`Change column order and visibility`);
  }, [onTitleChange, t]);

  const onSaveButtonClick = useCallback(() => {
    emitTableEvent('columnVisibilityChange', [...tableColumns.filter(c => c.isStatic || c.frozen).map(c => c.id), ...items.filter((item) => item.isSelected).map((item) => item.id.toString())]);

    const firstMovableColumnIndex = tableColumns.findIndex(c => !c.isStatic && !c.frozen);
    const leadingStaticColumns = tableColumns.slice(0, firstMovableColumnIndex);
    const trailingStaticColumns = tableColumns.slice(firstMovableColumnIndex + items.length);

    emitTableEvent('columnOrderChange', [...leadingStaticColumns.map(c => c.id), ...items.map((item) => item.id.toString()), ...trailingStaticColumns.map(c => c.id)]);
    onClose();
  }, [tableColumns, emitTableEvent, items, onClose]);

  const filterColumnsWithPredicate = useCallback((predicate: (item: Item) => boolean) => {
    const newVisibleColumnIds = TableUtil.getColumnIdsWithData({
      visibleColumnIds: items.filter(predicate).map(c => c.id.toString()),
      tableColumns,
      sortedData,
      hasCellData,
    });
    setItems((prevItems) => {
      return prevItems.map((item) => ({
        ...item,
        isSelected: newVisibleColumnIds.includes(item.id.toString()),
      }));
    });
  }, [hasCellData, items, sortedData, tableColumns]);


  const onEnableOnlyColumnsWithDataClick = useCallback(() => {
    filterColumnsWithPredicate(() => true);
  }, [filterColumnsWithPredicate]);

  const onDisableColumnsWithoutDataClick = useCallback(() => {
    filterColumnsWithPredicate((item) => item.isSelected);
  }, [filterColumnsWithPredicate]);

  const onEnableAllButtonClick = useCallback(() => {
    setItems((prevItems) => {
      return prevItems.map((item) => ({
        ...item,
        isSelected: true,
      }));
    });
  }, []);

  const onDisableAllButtonClick = useCallback(() => {
    setItems((prevItems) => {
      return prevItems.map((item) => ({
        ...item,
        isSelected: false,
      }));
    });
  }, []);

  useEffect(() => {
    onActionsChange(
      [
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-enable-all'),
          color: 'secondary',
          autoFocus: true,
          onClick: onEnableAllButtonClick,
          variant: 'outlined',
          label: t`Enable all`,
        },
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-enable-all-with-data'),
          color: 'secondary',
          autoFocus: true,
          onClick: onEnableOnlyColumnsWithDataClick,
          variant: 'outlined',
          label: t`Enable all with data`,
        },
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-disable-all'),
          color: 'secondary',
          autoFocus: true,
          onClick: onDisableAllButtonClick,
          variant: 'outlined',
          label: t`Disable all`,
        },
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-disable-all-without-data'),
          color: 'secondary',
          autoFocus: true,
          onClick: onDisableColumnsWithoutDataClick,
          variant: 'outlined',
          label: t`Disable all without data`,
        },
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-reset'),
          color: 'secondary',
          autoFocus: true,
          onClick: onResetButtonClick,
          variant: 'outlined',
          label: t`Reset to default`,
        },
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-close'),
          color: 'primary',
          autoFocus: true,
          onClick: onClose,
          variant: 'outlined',
          label: t`Close`,
        },
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-save'),
          color: 'secondary',
          autoFocus: true,
          onClick: onSaveButtonClick,
          variant: 'contained',
          label: t`Apply`,
        },
      ],
    );
  }, [onActionsChange, onClose, onDisableAllButtonClick, onEnableOnlyColumnsWithDataClick, onResetButtonClick, onSaveButtonClick, onEnableAllButtonClick, t, onDisableColumnsWithoutDataClick]);

  const onSortableListChange = useCallback((newItems: Item[]) => {
    setItems(newItems);
  }, []);

  const renderItemContent = useCallback((item: Item) => item.label, []);

  return (
    <Box
      sx={{
      }}
    >
      <SortableList<Item>
        items={items}
        renderItemContent={renderItemContent}
        onChange={onSortableListChange}
      />
    </Box>
  );
}, {
  testId: 'TableColumnOrderDialog',
  maxWidth: 'md',
  fullWidth: true,
  defaultTitle: '',
  noCloseButton: false,
  disableBackdropClick: false,
});
