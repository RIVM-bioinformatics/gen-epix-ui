import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import type {
  ReactElement,
  ReactNode,
} from 'react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { withDialog } from '@gen-epix/ui-core-components/hoc/withDialog';
import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '@gen-epix/ui-core-components/hoc/withDialog';

import type {
  HasCellDataFn,
  TableColumn,
  TableColumnVisualSettings,
} from '../../../models/table.models';
import type { SortableListBaseItem } from '../SortableList/SortableList';
import { SortableList } from '../SortableList/SortableList';
import { useTableStoreContext } from '../../../stores/tableStore';
import { TableUtil } from '../../../utils/TableUtil';


export interface TableColumnsEditorDialogItem<TRowData, TDataContext> extends SortableListBaseItem {
  column: TableColumn<TRowData, TDataContext>;
}

export interface TableColumnsEditorDialogOpenProps<TRowData, TDataContext> {
  readonly hasCellData: HasCellDataFn<TRowData, TDataContext>;
}

export interface TableColumnsEditorDialogProps<TRowData, TDataContext> extends WithDialogRenderProps<TableColumnsEditorDialogOpenProps<TRowData, TDataContext>> {
  renderHeaderContent?: () => ReactNode;
  renderItemContent?: (item: TableColumnsEditorDialogItem<TRowData, TDataContext>) => ReactNode;
}

export type TableColumnsEditorDialogRefMethods<TRowData, TDataContext> = WithDialogRefMethods<TableColumnsEditorDialogProps<TRowData, TDataContext>, TableColumnsEditorDialogOpenProps<TRowData, TDataContext>>;

type TableColumnsEditorDialogComponent = {
  new <TRowData, TDataContext>(
    props: TableColumnsEditorDialogProps<TRowData, TDataContext>,
  ): TableColumnsEditorDialogRefMethods<TRowData, TDataContext>;
};

export const TableColumnsEditorDialog = withDialog<TableColumnsEditorDialogProps<unknown, unknown>, TableColumnsEditorDialogOpenProps<unknown, unknown>>((
  {
    onActionsChange,
    onClose,
    onTitleChange,
    openProps: { hasCellData },
    renderHeaderContent,
    renderItemContent,
  }: TableColumnsEditorDialogProps<unknown, unknown>,
): ReactElement => {
  const { t } = useTranslation();
  const [items, setItems] = useState<TableColumnsEditorDialogItem<unknown, unknown>[]>([]);

  const tableStore = useTableStoreContext<unknown, unknown>();
  const emitTableEvent = useStore(tableStore, useShallow((state) => state.emitEvent));
  const dataContext = useStore(tableStore, useShallow((state) => state.dataContext));
  const tableColumnVisualSettings = useStore(tableStore, useShallow((state) => state.getCurrentColumnVisualSettings()));
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
    const newItems: TableColumnsEditorDialogItem<unknown, unknown>[] = [];
    columnVisualSettings.forEach(columnSetting => {
      const column = columnsMap.get(columnSetting.id);
      if (column && !column.frozen) {
        newItems.push({
          column,
          id: column.id,
          isSelected: columnSetting.isVisible,
          itemContent: column.headerName,
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
    emitTableEvent('columnVisibilityChange', [...tableColumns.filter(c => c.frozen).map(c => c.id), ...items.filter((item) => item.isSelected).map((item) => item.id.toString())]);

    const firstMovableColumnIndex = tableColumns.findIndex(c => !c.frozen);
    const leadingStaticColumns = tableColumns.slice(0, firstMovableColumnIndex);
    const trailingStaticColumns = tableColumns.slice(firstMovableColumnIndex + items.length);

    emitTableEvent('columnOrderChange', [...leadingStaticColumns.map(c => c.id), ...items.map((item) => item.id.toString()), ...trailingStaticColumns.map(c => c.id)]);
    onClose();
  }, [tableColumns, emitTableEvent, items, onClose]);

  const filterColumnsWithPredicate = useCallback((predicate: (item: TableColumnsEditorDialogItem<unknown, unknown>) => boolean) => {
    const newVisibleColumnIds = TableUtil.getColumnIdsWithData({
      dataContext,
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
  }, [dataContext, hasCellData, items, sortedData, tableColumns]);


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
          label: t`Show all`,
          onClick: onEnableAllButtonClick,
          variant: 'outlined',
        },
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-enable-all-with-data'),
          autoFocus: true,
          color: 'secondary',
          label: t`Show all with data`,
          onClick: onEnableOnlyColumnsWithDataClick,
          variant: 'outlined',
        },
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-disable-all'),
          autoFocus: true,
          color: 'secondary',
          label: t`Hide all`,
          onClick: onDisableAllButtonClick,
          variant: 'outlined',
        },
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-disable-all-without-data'),
          autoFocus: true,
          color: 'secondary',
          label: t`Hide all without data`,
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

  const onSortableListChange = useCallback((newItems: TableColumnsEditorDialogItem<unknown, unknown>[]) => {
    setItems(newItems);
  }, []);

  const defaultRenderItemContent = useCallback((item: TableColumnsEditorDialogItem<unknown, unknown>) => (
    <Box role={'cell'}>
      {item.label}
    </Box>
  ), []);

  return (
    <Box
      sx={{
      }}
    >
      <SortableList<TableColumnsEditorDialogItem<unknown, unknown>>
        items={items}
        onChange={onSortableListChange}
        renderHeaderContent={renderHeaderContent}
        renderItemContent={renderItemContent ?? defaultRenderItemContent}
      />
    </Box>
  );
}, {
  defaultTitle: '',
  disableBackdropClick: false,
  fullWidth: true,
  maxWidth: 'lg',
  noCloseButton: false,
  testId: 'TableColumnOrderDialog',
}) as unknown as TableColumnsEditorDialogComponent;
