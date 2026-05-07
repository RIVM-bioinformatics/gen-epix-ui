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
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '../../../hoc/withDialog';
import type {
  HasCellDataFn,
  TableColumn,
  TableColumnVisualSettings,
} from '../../../models/table';
import { SortableList } from '../SortableList/SortableList';
import { useTableStoreContext } from '../../../stores/tableStore';
import { TableUtil } from '../../../utils/TableUtil';


export interface TableColumnsEditorDialogOpenProps<TRowData, TContext> {
  readonly hasCellData: HasCellDataFn<TRowData, TContext>;
}

export interface TableColumnsEditorDialogProps<TRowData, TContext> extends WithDialogRenderProps<TableColumnsEditorDialogOpenProps<TRowData, TContext>> {
  //
}

export type TableColumnsEditorDialogRefMethods<TRowData, TContext> = WithDialogRefMethods<TableColumnsEditorDialogProps<TRowData, TContext>, TableColumnsEditorDialogOpenProps<TRowData, TContext>>;


type Item = {
  id: UniqueIdentifier;
  isSelected: boolean;
  label: string;
};

export const TableColumnsEditorDialog = withDialog<TableColumnsEditorDialogProps<unknown, unknown>, TableColumnsEditorDialogOpenProps<unknown, unknown>>((
  {
    onActionsChange,
    onClose,
    onTitleChange,
    openProps: { hasCellData },
  }: TableColumnsEditorDialogProps<unknown, unknown>,
): ReactElement => {
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);

  const tableStore = useTableStoreContext<unknown, unknown>();
  const emitTableEvent = useStore(tableStore, useShallow((state) => state.emitEvent));
  const context = useStore(tableStore, useShallow((state) => state.context));
  const tableColumnVisualSettings = useStore(tableStore, useShallow((state) => state.columnVisualSettings));
  const tableColumns = useStore(tableStore, useShallow((state) => state.columns));
  const sortedData = useStore(tableStore, useShallow((state) => state.sortedData));

  const columnsMap = useMemo(() => {
    const map = new Map<string, TableColumn<unknown, unknown>>();
    tableColumns.forEach((column) => {
      map.set(column.id, column);
    });
    return map;
  }, [tableColumns]);

  const updateItems = useCallback((columnVisualSettings: TableColumnVisualSettings[]) => {
    const newItems: Item[] = [];
    columnVisualSettings.forEach(columnSetting => {
      const column = columnsMap.get(columnSetting.id);
      if (column && !column.isStatic && !column.frozen) {
        newItems.push({
          id: column.id,
          isSelected: columnSetting.isVisible,
          label: column.headerName,
        });
      }
    });
    setItems(newItems);
  }, [columnsMap]);

  useEffect(() => {
    updateItems(tableColumnVisualSettings);
  }, [tableColumnVisualSettings, updateItems]);

  const onResetButtonClick = useCallback(() => {
    updateItems(TableUtil.createInitialVisualColumnSettings(tableColumns));
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
      context,
      hasCellData,
      sortedData,
      tableColumns,
      visibleColumnIds: items.filter(predicate).map(c => c.id.toString()),
    });
    setItems((prevItems) => {
      return prevItems.map((item) => ({
        ...item,
        isSelected: newVisibleColumnIds.includes(item.id.toString()),
      }));
    });
  }, [context, hasCellData, items, sortedData, tableColumns]);


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
          autoFocus: true,
          color: 'secondary',
          label: t`Enable all`,
          onClick: onEnableAllButtonClick,
          variant: 'outlined',
        },
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-enable-all-with-data'),
          autoFocus: true,
          color: 'secondary',
          label: t`Enable all with data`,
          onClick: onEnableOnlyColumnsWithDataClick,
          variant: 'outlined',
        },
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-disable-all'),
          autoFocus: true,
          color: 'secondary',
          label: t`Disable all`,
          onClick: onDisableAllButtonClick,
          variant: 'outlined',
        },
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-disable-all-without-data'),
          autoFocus: true,
          color: 'secondary',
          label: t`Disable all without data`,
          onClick: onDisableColumnsWithoutDataClick,
          variant: 'outlined',
        },
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-reset'),
          autoFocus: true,
          color: 'secondary',
          label: t`Reset to default`,
          onClick: onResetButtonClick,
          variant: 'outlined',
        },
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-close'),
          autoFocus: true,
          color: 'primary',
          label: t`Close`,
          onClick: onClose,
          variant: 'outlined',
        },
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-save'),
          autoFocus: true,
          color: 'secondary',
          label: t`Apply`,
          onClick: onSaveButtonClick,
          variant: 'contained',
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
        onChange={onSortableListChange}
        renderItemContent={renderItemContent}
      />
    </Box>
  );
}, {
  defaultTitle: '',
  disableBackdropClick: false,
  fullWidth: true,
  maxWidth: 'md',
  noCloseButton: false,
  testId: 'TableColumnOrderDialog',
});
